import { createAdminClient } from "@/lib/supabase/admin";
import { isSubscriptionActive } from "@/lib/subscription";
import { getAccessToken, fetchGoogleReviews, postGoogleReply, mapStarRating } from "@/lib/google";
import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

export async function GET(request: Request) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createAdminClient();

    // Get all active businesses with auto_reply enabled
    const { data: businesses, error: bizError } = await supabase
      .from("businesses")
      .select("*, users!inner(*)")
      .eq("auto_reply", true)
      .eq("is_active", true)
      .not("google_refresh_token", "is", null);

    if (bizError || !businesses) {
      return NextResponse.json({ error: "Failed to fetch businesses" }, { status: 500 });
    }

    const results = [];

    for (const business of businesses) {
      try {
        // Only process businesses with active subscriptions
        if (!isSubscriptionActive(business.users)) {
          continue;
        }

        // Pull new reviews
        const accessToken = await getAccessToken(business.google_refresh_token!);
        const googleReviews = await fetchGoogleReviews(
          accessToken,
          business.google_account_id!
        );

        let newReviews = 0;
        for (const review of googleReviews) {
          const { error: insertError } = await supabase.from("reviews").upsert(
            {
              business_id: business.id,
              google_review_id: review.reviewId,
              reviewer_name: review.reviewer.displayName,
              rating: mapStarRating(review.starRating),
              review_text: review.comment || "",
              review_date: review.createTime,
              reply_status: "pending",
            },
            { onConflict: "google_review_id", ignoreDuplicates: true }
          );
          if (!insertError) newReviews++;
        }

        // Generate and post replies for pending reviews
        const { data: pendingReviews } = await supabase
          .from("reviews")
          .select("*")
          .eq("business_id", business.id)
          .eq("reply_status", "pending")
          .is("ai_reply", null);

        const customInstructions = business.review_reply_instructions
          ? `\nAdditional instructions: ${business.review_reply_instructions}`
          : "";

        const systemPrompt = `You are a review responder for ${business.business_name}, a ${business.business_type}.
Tone: ${business.tone}.${customInstructions}

Rules:
- Keep replies under 3 sentences.
- For 4-5 star reviews: thank the reviewer specifically for what they mentioned. Be warm and genuine.
- For 3 star reviews: thank them, acknowledge what could be better, invite them back.
- For 1-2 star reviews: acknowledge the concern sincerely, apologize briefly, invite them to contact you directly to resolve it. Never be defensive.
- Never offer discounts, freebies, or compensation.
- Never use generic phrases like "We appreciate your feedback" — be specific to what the reviewer said.
- Sign off with just the business name, no "Best regards" etc.`;

        let repliesGenerated = 0;
        let repliesPosted = 0;

        for (const review of pendingReviews || []) {
          try {
            // Rate limiting
            if (repliesGenerated > 0) {
              await new Promise((resolve) => setTimeout(resolve, 200));
            }

            const message = await anthropic.messages.create({
              model: "claude-sonnet-4-20250514",
              max_tokens: 300,
              system: systemPrompt,
              messages: [
                {
                  role: "user",
                  content: `Write a reply to this ${review.rating}-star review from ${review.reviewer_name}:\n\n"${review.review_text}"`,
                },
              ],
            });

            const aiReply =
              message.content[0].type === "text" ? message.content[0].text : "";

            await supabase
              .from("reviews")
              .update({ ai_reply: aiReply })
              .eq("id", review.id);

            repliesGenerated++;

            // Auto-post
            if (review.google_review_id) {
              try {
                await postGoogleReply(
                  accessToken,
                  review.google_review_id,
                  aiReply
                );
                await supabase
                  .from("reviews")
                  .update({
                    reply_status: "posted",
                    posted_at: new Date().toISOString(),
                  })
                  .eq("id", review.id);
                repliesPosted++;
              } catch {
                await supabase
                  .from("reviews")
                  .update({ reply_status: "failed" })
                  .eq("id", review.id);
              }
            }
          } catch (err) {
            console.error(`Cron: Failed for review ${review.id}:`, err);
          }
        }

        results.push({
          business: business.business_name,
          newReviews,
          repliesGenerated,
          repliesPosted,
        });
      } catch (err) {
        console.error(`Cron: Failed for business ${business.id}:`, err);
        results.push({
          business: business.business_name,
          error: "Processing failed",
        });
      }
    }

    return NextResponse.json({ results });
  } catch (error) {
    console.error("Cron check-reviews error:", error);
    return NextResponse.json(
      { error: "Cron job failed" },
      { status: 500 }
    );
  }
}
