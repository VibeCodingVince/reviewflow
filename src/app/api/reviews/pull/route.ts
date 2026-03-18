import { createClient } from "@/lib/supabase/server";
import { requireActiveSubscription } from "@/lib/subscription";
import { getAccessToken, fetchGoogleReviews, mapStarRating } from "@/lib/google";
import { analyzeSpam } from "@/lib/spam-analysis";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const subCheck = await requireActiveSubscription(supabase, user.id);
    if ('error' in subCheck) return subCheck.error;

    const { business_id } = await request.json();
    if (!business_id) {
      return NextResponse.json({ error: "business_id is required" }, { status: 400 });
    }

    // Fetch business
    const { data: business, error: bizError } = await supabase
      .from("businesses")
      .select("*")
      .eq("id", business_id)
      .single();

    if (bizError || !business) {
      return NextResponse.json({ error: "Business not found" }, { status: 404 });
    }

    if (!business.google_refresh_token || !business.google_account_id) {
      return NextResponse.json(
        { error: "Business not connected to Google" },
        { status: 400 }
      );
    }

    // Get fresh access token
    const accessToken = await getAccessToken(business.google_refresh_token);

    // Fetch reviews from Google
    const googleReviews = await fetchGoogleReviews(
      accessToken,
      business.google_account_id
    );

    // Deduplicate and insert new reviews
    const newReviewIds: string[] = [];
    let newCount = 0;
    for (const review of googleReviews) {
      const { data: inserted, error: insertError } = await supabase
        .from("reviews")
        .upsert(
          {
            business_id,
            google_review_id: review.reviewId,
            reviewer_name: review.reviewer.displayName,
            rating: mapStarRating(review.starRating),
            review_text: review.comment || "",
            review_date: review.createTime,
            reply_status: "pending",
          },
          { onConflict: "google_review_id", ignoreDuplicates: true }
        )
        .select("id");

      if (!insertError && inserted && inserted.length > 0) {
        newCount++;
        newReviewIds.push(inserted[0].id);
      }
    }

    // Review Shield: Analyze new reviews for spam (if shield is enabled and user is Pro)
    let spamFlagged = 0;
    if (business.review_shield_enabled && subCheck.user.subscription_tier === "pro" && newReviewIds.length > 0) {
      const { data: recentReviews } = await supabase
        .from("reviews")
        .select("reviewer_name, rating, review_text, review_date")
        .eq("business_id", business_id)
        .order("review_date", { ascending: false })
        .limit(20);

      for (const reviewId of newReviewIds) {
        const { data: review } = await supabase
          .from("reviews")
          .select("*")
          .eq("id", reviewId)
          .single();

        if (review) {
          const spamResult = await analyzeSpam(review, business, recentReviews || []);
          await supabase
            .from("reviews")
            .update({
              spam_score: spamResult.spam_score,
              spam_reasons: spamResult.spam_reasons,
              is_suspicious: spamResult.spam_score >= 0.7,
            })
            .eq("id", reviewId);

          if (spamResult.spam_score >= 0.7) spamFlagged++;
        }
      }
    }

    return NextResponse.json({ new_reviews: newCount, spam_flagged: spamFlagged });
  } catch (error) {
    console.error("Pull reviews error:", error);
    return NextResponse.json(
      { error: "Failed to pull reviews" },
      { status: 500 }
    );
  }
}
