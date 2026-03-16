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

    const { review_id } = await request.json();
    if (!review_id) {
      return NextResponse.json({ error: "review_id is required" }, { status: 400 });
    }

    // Fetch review with business context
    const { data: review, error: reviewError } = await supabase
      .from("reviews")
      .select("*, businesses(*)")
      .eq("id", review_id)
      .single();

    if (reviewError || !review) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 });
    }

    const business = review.businesses;
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

    // Save reply to DB
    const { error: updateError } = await supabase
      .from("reviews")
      .update({ ai_reply: aiReply })
      .eq("id", review_id);

    if (updateError) {
      return NextResponse.json(
        { error: "Failed to save reply" },
        { status: 500 }
      );
    }

    return NextResponse.json({ ai_reply: aiReply });
  } catch (error) {
    console.error("Generate reply error:", error);
    return NextResponse.json(
      { error: "Failed to generate reply" },
      { status: 500 }
    );
  }
}
