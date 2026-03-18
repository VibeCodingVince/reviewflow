import { createAdminClient } from "@/lib/supabase/admin";
import { isSubscriptionActive } from "@/lib/subscription";
import { getAccessToken, createLocalPost } from "@/lib/google";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createAdminClient();

    // Find approved tasks of type "post" that haven't been published yet
    const { data: tasks, error: taskError } = await supabase
      .from("optimization_tasks")
      .select("*, businesses!inner(*, users!inner(*))")
      .eq("status", "approved")
      .eq("task_type", "post")
      .not("ai_draft", "is", null);

    if (taskError || !tasks) {
      return NextResponse.json({ error: "Failed to fetch tasks" }, { status: 500 });
    }

    const results = [];

    for (const task of tasks) {
      try {
        const business = task.businesses;
        if (!isSubscriptionActive(business.users) || business.users.subscription_tier !== "pro") {
          continue;
        }

        if (!business.google_refresh_token || !business.google_account_id) {
          continue;
        }

        await new Promise((resolve) => setTimeout(resolve, 200));

        const accessToken = await getAccessToken(business.google_refresh_token);

        const postResult = await createLocalPost(accessToken, business.google_account_id, {
          summary: task.ai_draft,
          topicType: "STANDARD",
        });

        // Create GBP post record
        await supabase.from("gbp_posts").insert({
          business_id: business.id,
          task_id: task.id,
          google_post_id: postResult.name || null,
          post_type: "update",
          summary: task.ai_draft,
          status: "published",
          published_at: new Date().toISOString(),
        });

        // Mark task as published
        await supabase
          .from("optimization_tasks")
          .update({ status: "published", completed_at: new Date().toISOString() })
          .eq("id", task.id);

        results.push({ task: task.title, status: "published" });
      } catch (err) {
        console.error(`Cron: Publish failed for task ${task.id}:`, err);

        await supabase
          .from("optimization_tasks")
          .update({ status: "failed" })
          .eq("id", task.id);

        results.push({ task: task.title, status: "failed" });
      }
    }

    return NextResponse.json({ results });
  } catch (error) {
    console.error("Cron publish-posts error:", error);
    return NextResponse.json({ error: "Cron job failed" }, { status: 500 });
  }
}
