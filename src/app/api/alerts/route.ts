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

    const featureCheck = await requireFeatureAccess(supabase, user.id, "radar");
    if ("error" in featureCheck) return featureCheck.error;

    const { searchParams } = new URL(request.url);
    const businessId = searchParams.get("business_id");

    let query = supabase
      .from("alerts")
      .select("*, businesses!inner(user_id)")
      .eq("businesses.user_id", user.id)
      .eq("is_dismissed", false)
      .order("created_at", { ascending: false })
      .limit(50);

    if (businessId) {
      query = query.eq("business_id", businessId);
    }

    const { data: alerts, error } = await query;

    if (error) {
      return NextResponse.json({ error: "Failed to fetch alerts" }, { status: 500 });
    }

    // Strip the joined business data
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const cleaned = (alerts || []).map(({ businesses: _b, ...alert }) => alert);

    return NextResponse.json({ alerts: cleaned });
  } catch (error) {
    console.error("Alerts GET error:", error);
    return NextResponse.json({ error: "Failed to fetch alerts" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const featureCheck = await requireFeatureAccess(supabase, user.id, "radar");
    if ("error" in featureCheck) return featureCheck.error;

    const { alert_id, is_read, is_dismissed } = await request.json();
    if (!alert_id) {
      return NextResponse.json({ error: "alert_id is required" }, { status: 400 });
    }

    const updates: Record<string, boolean> = {};
    if (is_read !== undefined) updates.is_read = is_read;
    if (is_dismissed !== undefined) updates.is_dismissed = is_dismissed;

    const { error } = await supabase
      .from("alerts")
      .update(updates)
      .eq("id", alert_id);

    if (error) {
      return NextResponse.json({ error: "Failed to update alert" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Alerts PATCH error:", error);
    return NextResponse.json({ error: "Failed to update alert" }, { status: 500 });
  }
}
