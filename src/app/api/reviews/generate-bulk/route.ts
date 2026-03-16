import { createClient } from "@/lib/supabase/server";
import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

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

    // Fetch pending reviews without AI reply
    const { data: reviews, error: reviewsError } = await supabase
      .from("reviews")
      .select("*")
      .eq("business_id", business_id)
      .eq("reply_status", "pending")
      .is("ai_reply", null);

    if (reviewsError) {
      return NextResponse.json({ error: "Failed to fetch reviews" }, { status: 500 });
    }

    if (!reviews || reviews.length === 0) {
      return NextResponse.json({ generated: 0 });
    }

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

    let generated = 0;

    for (const review of reviews) {
      try {
        // Rate limiting: 200ms between requests
        if (generated > 0) {
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

        generated++;
      } catch (err) {
        console.error(`Failed to generate reply for review ${review.id}:`, err);
      }
    }

    return NextResponse.json({ generated, total: reviews.length });
  } catch (error) {
    console.error("Bulk generate error:", error);
    return NextResponse.json(
      { error: "Failed to generate bulk replies" },
      { status: 500 }
    );
  }
}
