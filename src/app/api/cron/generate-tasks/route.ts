import { createAdminClient } from "@/lib/supabase/admin";
import { isSubscriptionActive } from "@/lib/subscription";
import { getAccessToken } from "@/lib/google";
import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createAdminClient();

    const { data: businesses, error: bizError } = await supabase
      .from("businesses")
      .select("*, users!inner(*)")
      .eq("action_planner_enabled", true)
      .eq("is_active", true)
      .not("google_refresh_token", "is", null);

    if (bizError || !businesses) {
      return NextResponse.json({ error: "Failed to fetch businesses" }, { status: 500 });
    }

    const results = [];
    const weekOf = getMonday(new Date()).toISOString().split("T")[0];

    for (const business of businesses) {
      try {
        if (!isSubscriptionActive(business.users) || business.users.subscription_tier !== "pro") {
          continue;
        }

        // Check if we already generated tasks for this week
        const { data: existingTasks } = await supabase
          .from("optimization_tasks")
          .select("id")
          .eq("business_id", business.id)
          .eq("week_of", weekOf)
          .limit(1);

        if (existingTasks && existingTasks.length > 0) {
          results.push({ business: business.business_name, skipped: "Tasks already generated this week" });
          continue;
        }

        await new Promise((resolve) => setTimeout(resolve, 200));

        // Gather context: recent performance, recent reviews, recent posts
        const { data: recentSnapshots } = await supabase
          .from("performance_snapshots")
          .select("*")
          .eq("business_id", business.id)
          .order("snapshot_date", { ascending: false })
          .limit(7);

        const { data: recentReviews } = await supabase
          .from("reviews")
          .select("rating, review_text, review_date")
          .eq("business_id", business.id)
          .order("review_date", { ascending: false })
          .limit(10);

        const { data: recentPosts } = await supabase
          .from("gbp_posts")
          .select("summary, post_type, published_at")
          .eq("business_id", business.id)
          .order("created_at", { ascending: false })
          .limit(5);

        // Fetch GBP profile info
        let profileInfo = "";
        try {
          const accessToken = await getAccessToken(business.google_refresh_token!);
          const locRes = await fetch(
            `https://mybusinessbusinessinformation.googleapis.com/v1/${business.google_account_id}/locations?readMask=name,title,categories,serviceItems,regularHours,websiteUri,phoneNumbers`,
            { headers: { Authorization: `Bearer ${accessToken}` } }
          );
          if (locRes.ok) {
            const locData = await locRes.json();
            profileInfo = JSON.stringify(locData.locations?.[0] || {});
          }
        } catch {
          profileInfo = "Profile info unavailable";
        }

        const performanceContext = (recentSnapshots || [])
          .map((s) => `${s.snapshot_date}: clicks=${s.website_clicks}, calls=${s.call_clicks}, directions=${s.direction_requests}, impressions=${s.search_impressions + s.maps_impressions}`)
          .join("\n");

        const reviewContext = (recentReviews || [])
          .map((r) => `${r.rating}★: "${r.review_text?.slice(0, 100)}"`)
          .join("\n");

        const postsContext = (recentPosts || [])
          .map((p) => `[${p.post_type}] ${p.summary?.slice(0, 80)} (${p.published_at || "draft"})`)
          .join("\n");

        const today = new Date();
        const month = today.toLocaleString("en-US", { month: "long" });

        const message = await anthropic.messages.create({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1500,
          system: `You are a Google Business Profile optimization expert. Generate 3-5 prioritized weekly tasks for a business owner.

Task types: post, service_update, description_update, photo, qa, hours_update, category_update

For "post" tasks, include a fully drafted post in ai_draft (1500 chars max, engaging, with a CTA).
For other tasks, include specific instructions in ai_draft.

Consider seasonality (current month: ${month}), recent performance trends, review themes, and gaps in their profile.

Respond with ONLY valid JSON array:
[
  {
    "task_type": "post",
    "priority": 1,
    "title": "Short task title",
    "description": "Why this matters and what to do",
    "ai_draft": "The actual content/instructions",
    "impact_note": "Expected impact on visibility/engagement"
  }
]`,
          messages: [
            {
              role: "user",
              content: `Business: ${business.business_name} (${business.business_type})

GBP Profile:
${profileInfo}

Recent Performance (last 7 days):
${performanceContext || "No data yet"}

Recent Reviews:
${reviewContext || "No reviews yet"}

Recent Posts:
${postsContext || "No posts yet"}

Generate this week's optimization tasks.`,
            },
          ],
        });

        const text = message.content[0].type === "text" ? message.content[0].text : "[]";

        try {
          const tasks = JSON.parse(text);
          if (Array.isArray(tasks)) {
            for (const task of tasks.slice(0, 5)) {
              await supabase.from("optimization_tasks").insert({
                business_id: business.id,
                task_type: task.task_type || "post",
                priority: task.priority || 3,
                title: task.title || "Untitled task",
                description: task.description || "",
                ai_draft: task.ai_draft || null,
                impact_note: task.impact_note || null,
                week_of: weekOf,
              });
            }

            results.push({
              business: business.business_name,
              tasksGenerated: tasks.length,
            });
          }
        } catch {
          results.push({
            business: business.business_name,
            error: "Failed to parse AI response",
          });
        }
      } catch (err) {
        console.error(`Cron: Task generation failed for ${business.id}:`, err);
        results.push({
          business: business.business_name,
          error: "Processing failed",
        });
      }
    }

    return NextResponse.json({ results });
  } catch (error) {
    console.error("Cron generate-tasks error:", error);
    return NextResponse.json({ error: "Cron job failed" }, { status: 500 });
  }
}

function getMonday(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}
