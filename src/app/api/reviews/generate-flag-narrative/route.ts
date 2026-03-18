import { createClient } from "@/lib/supabase/server";
import { requireFeatureAccess } from "@/lib/subscription";
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

    const featureCheck = await requireFeatureAccess(supabase, user.id, "review_shield");
    if ("error" in featureCheck) return featureCheck.error;

    const { review_id } = await request.json();
    if (!review_id) {
      return NextResponse.json({ error: "review_id is required" }, { status: 400 });
    }

    const { data: review, error: reviewError } = await supabase
      .from("reviews")
      .select("*, businesses!inner(*)")
      .eq("id", review_id)
      .single();

    if (reviewError || !review) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 });
    }

    const business = review.businesses;

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 600,
      system: `You are an expert at writing Google review flag/appeal narratives for business owners.

Write a professional, factual narrative that a business owner can use when flagging this review to Google for removal. The narrative should:
1. Clearly state which Google policy the review violates
2. Provide specific evidence from the review text
3. Explain why this review appears to be fake/spam
4. Be professional and factual — no emotional language
5. Reference Google's review policies where applicable

Keep it to 2-3 paragraphs.`,
      messages: [
        {
          role: "user",
          content: `Business: ${business.business_name} (${business.business_type})

Review details:
- Reviewer: ${review.reviewer_name}
- Rating: ${review.rating}★
- Text: "${review.review_text}"
- Date: ${review.review_date}

Spam analysis:
- Score: ${review.spam_score}
- Reasons: ${JSON.stringify(review.spam_reasons)}

Write a flag/appeal narrative for this review.`,
        },
      ],
    });

    const narrative = message.content[0].type === "text" ? message.content[0].text : "";

    // Update review with narrative and flag status
    await supabase
      .from("reviews")
      .update({
        flag_narrative: narrative,
        flag_status: "flagged",
        flagged_at: new Date().toISOString(),
      })
      .eq("id", review_id);

    return NextResponse.json({ narrative, flag_status: "flagged" });
  } catch (error) {
    console.error("Generate flag narrative error:", error);
    return NextResponse.json(
      { error: "Failed to generate narrative" },
      { status: 500 }
    );
  }
}
