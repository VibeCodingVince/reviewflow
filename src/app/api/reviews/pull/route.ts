import { createClient } from "@/lib/supabase/server";
import { getAccessToken, fetchGoogleReviews, mapStarRating } from "@/lib/google";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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
    let newCount = 0;
    for (const review of googleReviews) {
      const { error: insertError } = await supabase.from("reviews").upsert(
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
      );

      if (!insertError) {
        newCount++;
      }
    }

    return NextResponse.json({ new_reviews: newCount });
  } catch (error) {
    console.error("Pull reviews error:", error);
    return NextResponse.json(
      { error: "Failed to pull reviews" },
      { status: 500 }
    );
  }
}
