import { createClient } from "@/lib/supabase/server";
import { requireFeatureAccess } from "@/lib/subscription";
import { getAccessToken, createLocalPost } from "@/lib/google";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const featureCheck = await requireFeatureAccess(supabase, user.id, "action_planner");
    if ("error" in featureCheck) return featureCheck.error;

    const { task_id } = await request.json();
    if (!task_id) {
      return NextResponse.json({ error: "task_id is required" }, { status: 400 });
    }

    // Fetch the task with business info
    const { data: task, error: taskError } = await supabase
      .from("optimization_tasks")
      .select("*, businesses!inner(*)")
      .eq("id", task_id)
      .single();

    if (taskError || !task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    const business = task.businesses;
    if (!business.google_refresh_token || !business.google_account_id) {
      return NextResponse.json({ error: "Business not connected to Google" }, { status: 400 });
    }

    if (!task.ai_draft) {
      return NextResponse.json({ error: "No content draft to publish" }, { status: 400 });
    }

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
      .eq("id", task_id);

    return NextResponse.json({ success: true, google_post_id: postResult.name });
  } catch (error) {
    console.error("Publish post error:", error);
    return NextResponse.json({ error: "Failed to publish post" }, { status: 500 });
  }
}
