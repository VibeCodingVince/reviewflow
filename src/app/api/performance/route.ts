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
    const days = parseInt(searchParams.get("days") || "30", 10);

    if (!businessId) {
      return NextResponse.json({ error: "business_id is required" }, { status: 400 });
    }

    // Verify ownership
    const { data: business } = await supabase
      .from("businesses")
      .select("id")
      .eq("id", businessId)
      .eq("user_id", user.id)
      .single();

    if (!business) {
      return NextResponse.json({ error: "Business not found" }, { status: 404 });
    }

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const startStr = startDate.toISOString().split("T")[0];

    const { data: snapshots, error } = await supabase
      .from("performance_snapshots")
      .select("*")
      .eq("business_id", businessId)
      .gte("snapshot_date", startStr)
      .order("snapshot_date", { ascending: true });

    if (error) {
      return NextResponse.json({ error: "Failed to fetch snapshots" }, { status: 500 });
    }

    return NextResponse.json({ snapshots: snapshots || [] });
  } catch (error) {
    console.error("Performance GET error:", error);
    return NextResponse.json({ error: "Failed to fetch performance data" }, { status: 500 });
  }
}
