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

    let query = supabase
      .from("gbp_posts")
      .select("*, businesses!inner(user_id)")
      .eq("businesses.user_id", user.id)
      .order("created_at", { ascending: false });

    if (businessId) {
      query = query.eq("business_id", businessId);
    }

    const { data: posts, error } = await query;

    if (error) {
      return NextResponse.json({ error: "Failed to fetch posts" }, { status: 500 });
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const cleaned = (posts || []).map(({ businesses: _b, ...post }) => post);

    return NextResponse.json({ posts: cleaned });
  } catch (error) {
    console.error("Posts GET error:", error);
    return NextResponse.json({ error: "Failed to fetch posts" }, { status: 500 });
  }
}
