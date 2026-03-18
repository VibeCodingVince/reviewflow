import { createClient } from "@/lib/supabase/server";
import { requireFeatureAccess } from "@/lib/subscription";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const featureCheck = await requireFeatureAccess(supabase, user.id, "action_planner");
    if ("error" in featureCheck) return featureCheck.error;

    const { searchParams } = new URL(request.url);
    const businessId = searchParams.get("business_id");
    const weekOf = searchParams.get("week_of");

    let query = supabase
      .from("optimization_tasks")
      .select("*, businesses!inner(user_id)")
      .eq("businesses.user_id", user.id)
      .order("priority", { ascending: true })
      .order("created_at", { ascending: false });

    if (businessId) {
      query = query.eq("business_id", businessId);
    }

    if (weekOf) {
      query = query.eq("week_of", weekOf);
    }

    const { data: tasks, error } = await query;

    if (error) {
      return NextResponse.json({ error: "Failed to fetch tasks" }, { status: 500 });
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const cleaned = (tasks || []).map(({ businesses: _b, ...task }) => task);

    return NextResponse.json({ tasks: cleaned });
  } catch (error) {
    console.error("Tasks GET error:", error);
    return NextResponse.json({ error: "Failed to fetch tasks" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const featureCheck = await requireFeatureAccess(supabase, user.id, "action_planner");
    if ("error" in featureCheck) return featureCheck.error;

    const { task_id, status, ai_draft } = await request.json();
    if (!task_id) {
      return NextResponse.json({ error: "task_id is required" }, { status: 400 });
    }

    const updates: Record<string, unknown> = {};
    if (status) updates.status = status;
    if (ai_draft !== undefined) updates.ai_draft = ai_draft;
    if (status === "published" || status === "skipped") {
      updates.completed_at = new Date().toISOString();
    }

    const { error } = await supabase
      .from("optimization_tasks")
      .update(updates)
      .eq("id", task_id);

    if (error) {
      return NextResponse.json({ error: "Failed to update task" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Tasks PATCH error:", error);
    return NextResponse.json({ error: "Failed to update task" }, { status: 500 });
  }
}
