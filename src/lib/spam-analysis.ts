import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

interface SpamAnalysisResult {
  spam_score: number;
  spam_reasons: string[];
  recommended_response: string;
}

export async function analyzeSpam(
  review: { reviewer_name: string; rating: number; review_text: string; review_date: string },
  business: { business_name: string; business_type: string },
  recentReviews: { reviewer_name: string; rating: number; review_text: string; review_date: string }[]
): Promise<SpamAnalysisResult> {
  const recentContext = recentReviews
    .map((r) => `- ${r.reviewer_name}: ${r.rating}★ "${r.review_text}" (${r.review_date})`)
    .join("\n");

  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 500,
    system: `You are a fake review detection expert. Analyze the given review for spam/fake signals.

Consider these factors:
1. Generic/vague language with no specific details about the business
2. Reviewer name patterns (single letters, keyboard smash, clearly fake)
3. Rating vs text sentiment mismatch
4. Review text length (very short + low rating = suspicious)
5. Timing patterns (burst of negative reviews in short window)
6. Copy-paste or template-like language
7. Mentions of competitors or irrelevant content

Be CONSERVATIVE — only flag clearly suspicious reviews. Real negative reviews from genuinely unhappy customers should score LOW (0.1-0.3).

Respond with ONLY valid JSON:
{
  "spam_score": 0.0 to 1.0,
  "spam_reasons": ["reason1", "reason2"],
  "recommended_response": "A professional public response if the review is suspicious"
}`,
    messages: [
      {
        role: "user",
        content: `Business: ${business.business_name} (${business.business_type})

Review to analyze:
- Reviewer: ${review.reviewer_name}
- Rating: ${review.rating}★
- Text: "${review.review_text}"
- Date: ${review.review_date}

Recent reviews for timing context:
${recentContext || "No other recent reviews"}`,
      },
    ],
  });

  const text = message.content[0].type === "text" ? message.content[0].text : "{}";

  try {
    const parsed = JSON.parse(text);
    return {
      spam_score: Math.min(1, Math.max(0, parsed.spam_score || 0)),
      spam_reasons: Array.isArray(parsed.spam_reasons) ? parsed.spam_reasons : [],
      recommended_response: parsed.recommended_response || "",
    };
  } catch {
    return { spam_score: 0, spam_reasons: [], recommended_response: "" };
  }
}
