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

// --- Radar: Performance Metrics ---

export interface PerformanceMetrics {
  websiteClicks: number;
  callClicks: number;
  directionRequests: number;
  bookings: number;
  searchImpressions: number;
  mapsImpressions: number;
  photoViews: number;
}

export async function fetchPerformanceMetrics(
  accessToken: string,
  accountId: string
): Promise<PerformanceMetrics> {
  // List locations
  const locationsRes = await fetch(
    `https://mybusinessbusinessinformation.googleapis.com/v1/${accountId}/locations`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  const locationsData = await locationsRes.json();
  const locations = locationsData.locations || [];

  const totals: PerformanceMetrics = {
    websiteClicks: 0,
    callClicks: 0,
    directionRequests: 0,
    bookings: 0,
    searchImpressions: 0,
    mapsImpressions: 0,
    photoViews: 0,
  };

  // Aggregate metrics across all locations
  for (const location of locations) {
    const locationName = location.name;

    // Use GBP Performance API (v1)
    // Date range: yesterday (most recent complete day)
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const dateStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, "0")}-${String(yesterday.getDate()).padStart(2, "0")}`;

    const metricsRes = await fetch(
      `https://businessprofileperformance.googleapis.com/v1/${locationName}:getDailyMetricsTimeSeries?dailyMetric=WEBSITE_CLICKS&dailyMetric=CALL_CLICKS&dailyMetric=BUSINESS_DIRECTION_REQUESTS&dailyMetric=BUSINESS_BOOKINGS&dailyMetric=BUSINESS_IMPRESSIONS_DESKTOP_SEARCH&dailyMetric=BUSINESS_IMPRESSIONS_MOBILE_MAPS&dailyMetric=BUSINESS_FOOD_MENU_CLICKS&dailyRange.start_date.year=${yesterday.getFullYear()}&dailyRange.start_date.month=${yesterday.getMonth() + 1}&dailyRange.start_date.day=${yesterday.getDate()}&dailyRange.end_date.year=${yesterday.getFullYear()}&dailyRange.end_date.month=${yesterday.getMonth() + 1}&dailyRange.end_date.day=${yesterday.getDate()}`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    if (metricsRes.ok) {
      const metricsData = await metricsRes.json();
      const series = metricsData.timeSeries || [];

      for (const ts of series) {
        const value = ts.dailyMetricTimeSeries?.timeSeries?.datedValues?.[0]?.value
          ? parseInt(ts.dailyMetricTimeSeries.timeSeries.datedValues[0].value, 10)
          : 0;

        switch (ts.dailyMetric) {
          case "WEBSITE_CLICKS":
            totals.websiteClicks += value;
            break;
          case "CALL_CLICKS":
            totals.callClicks += value;
            break;
          case "BUSINESS_DIRECTION_REQUESTS":
            totals.directionRequests += value;
            break;
          case "BUSINESS_BOOKINGS":
            totals.bookings += value;
            break;
          case "BUSINESS_IMPRESSIONS_DESKTOP_SEARCH":
            totals.searchImpressions += value;
            break;
          case "BUSINESS_IMPRESSIONS_MOBILE_MAPS":
            totals.mapsImpressions += value;
            break;
        }
      }
    }

    // Photo views via insights (deprecated API fallback)
    try {
      const insightsRes = await fetch(
        `https://mybusiness.googleapis.com/v4/${locationName}/insights?basicRequest.metricRequests.metric=PHOTOS_VIEWS_CUSTOMERS&basicRequest.timeRange.startTime=${dateStr}T00:00:00Z&basicRequest.timeRange.endTime=${dateStr}T23:59:59Z`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      if (insightsRes.ok) {
        const insightsData = await insightsRes.json();
        const photoMetric = insightsData.locationMetrics?.[0]?.metricValues?.[0]?.totalValue?.value;
        if (photoMetric) totals.photoViews += parseInt(photoMetric, 10);
      }
    } catch {
      // Photo views not available — that's fine
    }
  }

  return totals;
}

// --- Action Planner: Local Posts ---

export interface LocalPostInput {
  summary: string;
  callToAction?: {
    actionType: "LEARN_MORE" | "BOOK" | "ORDER" | "SHOP" | "SIGN_UP" | "CALL";
    url?: string;
  };
  event?: {
    title: string;
    schedule: {
      startDate: { year: number; month: number; day: number };
      startTime?: { hours: number; minutes: number };
      endDate: { year: number; month: number; day: number };
      endTime?: { hours: number; minutes: number };
    };
  };
  topicType?: "STANDARD" | "EVENT" | "OFFER";
}

export async function createLocalPost(
  accessToken: string,
  accountId: string,
  post: LocalPostInput
): Promise<{ name: string }> {
  // List locations to get the first one
  const locationsRes = await fetch(
    `https://mybusinessbusinessinformation.googleapis.com/v1/${accountId}/locations`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  const locationsData = await locationsRes.json();
  const location = locationsData.locations?.[0];

  if (!location) {
    throw new Error("No locations found for this account");
  }

  const body: Record<string, unknown> = {
    summary: post.summary,
    topicType: post.topicType || "STANDARD",
  };

  if (post.callToAction) {
    body.callToAction = post.callToAction;
  }

  if (post.event) {
    body.event = post.event;
  }

  const response = await fetch(
    `https://mybusiness.googleapis.com/v4/${location.name}/localPosts`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to create local post: ${error}`);
  }

  return response.json();
}

export async function listLocalPosts(
  accessToken: string,
  accountId: string
): Promise<{ localPosts: Array<{ name: string; summary: string; state: string; createTime: string; metrics?: { views: string; clicks: string } }> }> {
  const locationsRes = await fetch(
    `https://mybusinessbusinessinformation.googleapis.com/v1/${accountId}/locations`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  const locationsData = await locationsRes.json();
  const location = locationsData.locations?.[0];

  if (!location) {
    return { localPosts: [] };
  }

  const response = await fetch(
    `https://mybusiness.googleapis.com/v4/${location.name}/localPosts`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );

  if (!response.ok) {
    return { localPosts: [] };
  }

  return response.json();
}
