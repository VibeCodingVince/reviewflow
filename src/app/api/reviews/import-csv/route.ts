import { createClient } from "@/lib/supabase/server";
import { requireActiveSubscription } from "@/lib/subscription";
import Papa from "papaparse";
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

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const businessId = formData.get("business_id") as string;

    if (!file || !businessId) {
      return NextResponse.json(
        { error: "file and business_id are required" },
        { status: 400 }
      );
    }

    // Verify business ownership
    const { data: business, error: bizError } = await supabase
      .from("businesses")
      .select("id")
      .eq("id", businessId)
      .single();

    if (bizError || !business) {
      return NextResponse.json({ error: "Business not found" }, { status: 404 });
    }

    const csvText = await file.text();
    const parsed = Papa.parse<{
      reviewer_name: string;
      rating: string;
      review_text: string;
      review_date: string;
    }>(csvText, {
      header: true,
      skipEmptyLines: true,
    });

    if (parsed.errors.length > 0) {
      return NextResponse.json(
        { error: "CSV parsing errors", details: parsed.errors },
        { status: 400 }
      );
    }

    const reviews = parsed.data
      .filter((row) => row.reviewer_name && row.rating && row.review_text)
      .map((row) => ({
        business_id: businessId,
        reviewer_name: row.reviewer_name.trim(),
        rating: Math.min(5, Math.max(1, parseInt(row.rating, 10) || 3)),
        review_text: row.review_text.trim(),
        review_date: row.review_date
          ? new Date(row.review_date).toISOString()
          : new Date().toISOString(),
        reply_status: "pending" as const,
      }));

    if (reviews.length === 0) {
      return NextResponse.json(
        { error: "No valid reviews found in CSV" },
        { status: 400 }
      );
    }

    const { error: insertError } = await supabase
      .from("reviews")
      .insert(reviews);

    if (insertError) {
      return NextResponse.json(
        { error: "Failed to import reviews" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      imported: reviews.length,
      message: `Successfully imported ${reviews.length} reviews`,
    });
  } catch (error) {
    console.error("CSV import error:", error);
    return NextResponse.json(
      { error: "Failed to import CSV" },
      { status: 500 }
    );
  }
}
