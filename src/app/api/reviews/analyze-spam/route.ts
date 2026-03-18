import { createClient } from "@/lib/supabase/server";
import { requireFeatureAccess } from "@/lib/subscription";
import { analyzeSpam } from "@/lib/spam-analysis";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const featureCheck = await requireFeatureAccess(supabase, user.id, "review_shield");
    if ("error" in featureCheck) return featureCheck.error;

    const { review_id } = await request.json();
    if (!review_id) {
      return NextResponse.json({ error: "review_id is required" }, { status: 400 });
    }

    // Fetch the review with business context
    const { data: review, error: reviewError } = await supabase
      .from("reviews")
      .select("*, businesses!inner(*)")
      .eq("id", review_id)
      .single();

    if (reviewError || !review) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 });
    }

    const business = review.businesses;

    // Get recent reviews for context (timing patterns)
    const { data: recentReviews } = await supabase
      .from("reviews")
      .select("reviewer_name, rating, review_text, review_date")
      .eq("business_id", business.id)
      .order("review_date", { ascending: false })
      .limit(20);

    const result = await analyzeSpam(review, business, recentReviews || []);

    // Update the review with spam analysis
    await supabase
      .from("reviews")
      .update({
        spam_score: result.spam_score,
        spam_reasons: result.spam_reasons,
        is_suspicious: result.spam_score >= 0.7,
      })
      .eq("id", review_id);

    return NextResponse.json({
      spam_score: result.spam_score,
      spam_reasons: result.spam_reasons,
      is_suspicious: result.spam_score >= 0.7,
      recommended_response: result.recommended_response,
    });
  } catch (error) {
    console.error("Analyze spam error:", error);
    return NextResponse.json(
      { error: "Failed to analyze review" },
      { status: 500 }
    );
  }
}
