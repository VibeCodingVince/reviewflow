import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  try {
    const { email, placeId, businessName, score, breakdown } =
      await request.json();

    // Basic email validation
    if (!email || typeof email !== "string" || !email.includes("@") || email.length > 254) {
      return NextResponse.json(
        { error: "Valid email is required" },
        { status: 400 }
      );
    }

    if (!businessName || typeof businessName !== "string") {
      return NextResponse.json(
        { error: "Business name is required" },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Upsert to avoid duplicates for same email + place
    const { error } = await supabase.from("leads").upsert(
      {
        email: email.toLowerCase().trim(),
        business_name: businessName,
        place_id: placeId || null,
        score: score || null,
        score_breakdown: breakdown || null,
        source: "audit",
      },
      { onConflict: "email,place_id", ignoreDuplicates: false }
    );

    if (error) {
      // If upsert fails due to no unique constraint on email+place_id, fall back to insert
      const { error: insertError } = await supabase.from("leads").insert({
        email: email.toLowerCase().trim(),
        business_name: businessName,
        place_id: placeId || null,
        score: score || null,
        score_breakdown: breakdown || null,
        source: "audit",
      });

      if (insertError) {
        console.error("Lead capture error:", insertError);
        return NextResponse.json(
          { error: "Failed to save" },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Audit capture error:", error);
    return NextResponse.json(
      { error: "Failed to save" },
      { status: 500 }
    );
  }
}
