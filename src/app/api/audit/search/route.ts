import { NextResponse } from "next/server";

// Simple in-memory rate limiter
const rateLimit = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX = 10;

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimit.get(ip);

  if (!entry || now > entry.resetAt) {
    rateLimit.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW });
    return false;
  }

  entry.count++;
  return entry.count > RATE_LIMIT_MAX;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q");

    if (!query || query.trim().length < 2) {
      return NextResponse.json(
        { error: "Query must be at least 2 characters" },
        { status: 400 }
      );
    }

    // Rate limit by IP
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      "unknown";
    if (isRateLimited(ip)) {
      return NextResponse.json(
        { error: "Too many requests. Please try again in a minute." },
        { status: 429 }
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
      "https://places.googleapis.com/v1/places:searchText",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": apiKey,
          "X-Goog-FieldMask":
            "places.id,places.displayName,places.formattedAddress,places.types,places.primaryTypeDisplayName",
        },
        body: JSON.stringify({
          textQuery: query,
          pageSize: 5,
        }),
      }
    );

    if (!response.ok) {
      console.error("Places API error:", response.status, await response.text());
      return NextResponse.json(
        { error: "Search failed" },
        { status: 502 }
      );
    }

    const data = await response.json();
    const places = (data.places || []).map(
      (place: {
        id: string;
        displayName?: { text: string };
        formattedAddress?: string;
        primaryTypeDisplayName?: { text: string };
      }) => ({
        placeId: place.id,
        name: place.displayName?.text || "Unknown",
        address: place.formattedAddress || "",
        type: place.primaryTypeDisplayName?.text || "",
      })
    );

    return NextResponse.json({ places });
  } catch (error) {
    console.error("Audit search error:", error);
    return NextResponse.json({ error: "Search failed" }, { status: 500 });
  }
}
