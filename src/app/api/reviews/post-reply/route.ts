import { createClient } from "@/lib/supabase/server";
import { getAccessToken, postGoogleReply } from "@/lib/google";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { review_id } = await request.json();
    if (!review_id) {
      return NextResponse.json({ error: "review_id is required" }, { status: 400 });
    }

    // Fetch review with business
    const { data: review, error: reviewError } = await supabase
      .from("reviews")
      .select("*, businesses(*)")
      .eq("id", review_id)
      .single();

    if (reviewError || !review) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 });
    }

    const business = review.businesses;
    const replyText = review.edited_reply || review.ai_reply;

    if (!replyText) {
      return NextResponse.json({ error: "No reply to post" }, { status: 400 });
    }

    if (!business.google_refresh_token || !review.google_review_id) {
      // If no Google connection, just mark as posted (for CSV imports)
      await supabase
        .from("reviews")
        .update({
          reply_status: "posted",
          posted_at: new Date().toISOString(),
        })
        .eq("id", review_id);

      return NextResponse.json({ status: "posted", mode: "manual" });
    }

    try {
      const accessToken = await getAccessToken(business.google_refresh_token);
      await postGoogleReply(accessToken, review.google_review_id, replyText);

      await supabase
        .from("reviews")
        .update({
          reply_status: "posted",
          posted_at: new Date().toISOString(),
        })
        .eq("id", review_id);

      return NextResponse.json({ status: "posted" });
    } catch (postError) {
      console.error("Failed to post reply to Google:", postError);

      await supabase
        .from("reviews")
        .update({ reply_status: "failed" })
        .eq("id", review_id);

      return NextResponse.json(
        { error: "Failed to post reply to Google" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Post reply error:", error);
    return NextResponse.json(
      { error: "Failed to post reply" },
      { status: 500 }
    );
  }
}
