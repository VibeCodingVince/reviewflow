export async function getAccessToken(refreshToken: string): Promise<string> {
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      grant_type: "refresh_token",
    }),
  });

  const data = await response.json();
  if (!data.access_token) {
    throw new Error("Failed to refresh Google access token");
  }
  return data.access_token;
}

export async function fetchGoogleReviews(
  accessToken: string,
  accountId: string
) {
  // List locations
  const locationsRes = await fetch(
    `https://mybusinessbusinessinformation.googleapis.com/v1/${accountId}/locations`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  const locationsData = await locationsRes.json();
  const locations = locationsData.locations || [];

  const allReviews: GoogleReview[] = [];

  for (const location of locations) {
    const reviewsRes = await fetch(
      `https://mybusiness.googleapis.com/v4/${location.name}/reviews`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    const reviewsData = await reviewsRes.json();
    if (reviewsData.reviews) {
      allReviews.push(...reviewsData.reviews);
    }
  }

  return allReviews;
}

export async function postGoogleReply(
  accessToken: string,
  reviewName: string,
  replyText: string
) {
  const response = await fetch(
    `https://mybusiness.googleapis.com/v4/${reviewName}/reply`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ comment: replyText }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to post reply: ${error}`);
  }

  return response.json();
}

export interface GoogleReview {
  reviewId: string;
  reviewer: {
    displayName: string;
  };
  starRating: string;
  comment: string;
  createTime: string;
  name: string;
}

export function mapStarRating(rating: string): number {
  const map: Record<string, number> = {
    ONE: 1,
    TWO: 2,
    THREE: 3,
    FOUR: 4,
    FIVE: 5,
  };
  return map[rating] || 3;
}
