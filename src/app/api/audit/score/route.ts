import { NextResponse } from "next/server";
import { computeAuditScore, PlaceData } from "@/lib/audit-score";

export async function POST(request: Request) {
  try {
    const { placeId } = await request.json();

    if (!placeId || typeof placeId !== "string") {
      return NextResponse.json(
        { error: "placeId is required" },
        { status: 400 }
      );
    }

    const apiKey = process.env.GOOGLE_PLACES_API_KEY;
    if (!apiKey) {
      console.error("GOOGLE_PLACES_API_KEY not configured");
      return NextResponse.json(
        { error: "Service unavailable" },
        { status: 503 }
      );
    }

    const response = await fetch(
      `https://places.googleapis.com/v1/places/${placeId}`,
      {
        headers: {
          "X-Goog-Api-Key": apiKey,
          "X-Goog-FieldMask":
            "displayName,rating,userRatingCount,photos,currentOpeningHours,websiteUri,googleMapsUri,primaryTypeDisplayName,formattedAddress,reviews",
        },
      }
    );

    if (!response.ok) {
      console.error("Places Details API error:", response.status, await response.text());
      return NextResponse.json(
        { error: "Failed to fetch business details" },
        { status: 502 }
      );
    }

    const place = await response.json();

    const placeData: PlaceData = {
      name: place.displayName?.text || "Unknown",
      address: place.formattedAddress || "",
      rating: place.rating ?? null,
      reviewCount: place.userRatingCount ?? null,
      photoCount: place.photos?.length ?? 0,
      hasWebsite: !!place.websiteUri,
      websiteUrl: place.websiteUri || null,
      hasHours: !!place.currentOpeningHours,
      hasCategory: !!place.primaryTypeDisplayName?.text,
      category: place.primaryTypeDisplayName?.text || null,
      googleMapsUrl: place.googleMapsUri || null,
      reviews: (place.reviews || []).map(
        (r: {
          rating: number;
          text?: { text: string };
          authorAttribution?: { displayName: string };
          relativePublishTimeDescription?: string;
          publishTime?: string;
        }) => ({
          rating: r.rating,
          text: r.text?.text || "",
          authorName: r.authorAttribution?.displayName || "Anonymous",
          relativePublishTime: r.relativePublishTimeDescription || "",
          publishTime: r.publishTime || "",
        })
      ),
    };

    const breakdown = computeAuditScore(placeData);

    return NextResponse.json({
      score: breakdown.total,
      grade: breakdown.grade,
      breakdown,
      businessData: placeData,
    });
  } catch (error) {
    console.error("Audit score error:", error);
    return NextResponse.json(
      { error: "Failed to compute score" },
      { status: 500 }
    );
  }
}
