export interface PlaceData {
  name: string;
  address: string;
  rating: number | null;
  reviewCount: number | null;
  photoCount: number;
  hasWebsite: boolean;
  websiteUrl: string | null;
  hasHours: boolean;
  hasCategory: boolean;
  category: string | null;
  googleMapsUrl: string | null;
  reviews: Array<{
    rating: number;
    text: string;
    authorName: string;
    relativePublishTime: string;
    publishTime: string;
  }>;
}

export interface CategoryScore {
  score: number;
  max: number;
  label: string;
  details: string;
  recommendations: string[];
}

export interface AuditScoreBreakdown {
  rating: CategoryScore;
  reviewVolume: CategoryScore;
  visualPresence: CategoryScore;
  profileCompleteness: CategoryScore;
  engagement: CategoryScore;
  total: number;
  grade: "A" | "B" | "C" | "D" | "F";
}

function scoreRating(rating: number | null): CategoryScore {
  let score = 3;
  let details = "No rating available";
  const recommendations: string[] = [];

  if (rating !== null) {
    if (rating >= 4.8) {
      score = 25;
      details = `Exceptional ${rating} rating`;
    } else if (rating >= 4.5) {
      score = 22;
      details = `Strong ${rating} rating`;
    } else if (rating >= 4.0) {
      score = 18;
      details = `Good ${rating} rating — room to improve`;
      recommendations.push(
        "Focus on resolving negative feedback quickly to push your rating above 4.5"
      );
    } else if (rating >= 3.5) {
      score = 12;
      details = `Below average ${rating} rating`;
      recommendations.push(
        "Respond to every negative review with empathy and a resolution",
        "Encourage satisfied customers to leave reviews after positive experiences"
      );
    } else if (rating >= 3.0) {
      score = 7;
      details = `Low ${rating} rating — needs attention`;
      recommendations.push(
        "Prioritize responding to all recent negative reviews",
        "Identify recurring complaints and address the root causes",
        "Ask your happiest customers to share their experience on Google"
      );
    } else {
      score = 3;
      details = `Critical ${rating} rating — immediate action needed`;
      recommendations.push(
        "Respond professionally to every negative review within 24 hours",
        "Address the most common complaints in your operations",
        "Consider a review recovery campaign targeting satisfied customers"
      );
    }
  } else {
    recommendations.push(
      "Your business has no rating yet — encourage your first customers to leave reviews"
    );
  }

  return { score, max: 25, label: "Rating", details, recommendations };
}

function scoreReviewVolume(count: number | null): CategoryScore {
  let score = 0;
  let details = "No reviews yet";
  const recommendations: string[] = [];

  if (count !== null && count > 0) {
    if (count >= 200) {
      score = 25;
      details = `${count} reviews — strong social proof`;
    } else if (count >= 100) {
      score = 22;
      details = `${count} reviews — solid volume`;
      recommendations.push(
        `You need ${200 - count} more reviews to hit the 200+ benchmark that dominates local search`
      );
    } else if (count >= 50) {
      score = 18;
      details = `${count} reviews — growing nicely`;
      recommendations.push(
        "Set up a systematic review request process for every customer interaction",
        `${100 - count} more reviews would put you in the top tier for local search`
      );
    } else if (count >= 25) {
      score = 14;
      details = `${count} reviews — building momentum`;
      recommendations.push(
        "Businesses with 50+ reviews see significantly better local search placement",
        "Add a review link to your email signatures and receipts"
      );
    } else if (count >= 10) {
      score = 10;
      details = `${count} reviews — early stage`;
      recommendations.push(
        "Ask every customer for a review — most won't unless prompted",
        "Make it easy: create a short link directly to your Google review form"
      );
    } else if (count >= 5) {
      score = 6;
      details = `Only ${count} reviews — needs growth`;
      recommendations.push(
        "Review volume is a key local ranking factor — aim for at least 25 reviews",
        "Send a follow-up SMS or email with your Google review link after each visit"
      );
    } else {
      score = 3;
      details = `Just ${count} review${count === 1 ? "" : "s"} — very low`;
      recommendations.push(
        "Even 10 reviews significantly improves your credibility and local ranking",
        "Start by asking your most loyal customers to share their experience"
      );
    }
  } else {
    recommendations.push(
      "Getting your first 10 reviews should be your top priority"
    );
  }

  return { score, max: 25, label: "Review Volume", details, recommendations };
}

function scoreVisualPresence(photoCount: number): CategoryScore {
  let score = 0;
  let details = "No photos found";
  const recommendations: string[] = [];

  if (photoCount >= 10) {
    score = 15;
    details = `${photoCount} photos — great visual presence`;
  } else if (photoCount >= 5) {
    score = 12;
    details = `${photoCount} photos — good start`;
    recommendations.push(
      `Add ${10 - photoCount} more photos directly in Google Business Profile — businesses with 10+ photos get 35% more clicks`,
      "Tip: upload photos of your interior, exterior, team, and popular products or services via your GBP dashboard"
    );
  } else if (photoCount >= 3) {
    score = 8;
    details = `Only ${photoCount} photos`;
    recommendations.push(
      "Profiles with more photos rank higher and attract more customers",
      "Upload high-quality photos via your Google Business Profile dashboard — storefront, interior, products, and team"
    );
  } else if (photoCount >= 1) {
    score = 4;
    details = `Just ${photoCount} photo${photoCount === 1 ? "" : "s"} — very limited`;
    recommendations.push(
      "Google prioritizes listings with rich visual content — aim for at least 10 photos",
      "Upload photos directly in your Google Business Profile dashboard — this is a quick manual win"
    );
  } else {
    recommendations.push(
      "Add photos immediately via your Google Business Profile dashboard — listings without photos lose 70% of potential customers",
      "Start with: exterior shot, interior shot, 2-3 product/service photos, team photo"
    );
  }

  return {
    score,
    max: 15,
    label: "Visual Presence",
    details,
    recommendations,
  };
}

function scoreProfileCompleteness(place: PlaceData): CategoryScore {
  let score = 0;
  const missing: string[] = [];
  const recommendations: string[] = [];

  if (place.hasWebsite) {
    score += 7;
  } else {
    missing.push("website");
    recommendations.push(
      "Add your website URL in Google Business Profile — it drives direct traffic and improves trust signals"
    );
  }

  if (place.hasHours) {
    score += 7;
  } else {
    missing.push("business hours");
    recommendations.push(
      "Add your business hours in Google Business Profile — customers skip listings without hours displayed"
    );
  }

  if (place.hasCategory) {
    score += 6;
  } else {
    missing.push("business category");
    recommendations.push(
      "Set a primary category in Google Business Profile — it's one of the strongest local ranking signals"
    );
  }

  const details =
    missing.length === 0
      ? "Profile is complete"
      : `Missing: ${missing.join(", ")}`;

  return {
    score,
    max: 20,
    label: "Profile Completeness",
    details,
    recommendations,
  };
}

function scoreEngagement(place: PlaceData): CategoryScore {
  let score = 0;
  const recommendations: string[] = [];
  const parts: string[] = [];

  // Check for recent reviews
  const now = Date.now();
  const oneMonth = 30 * 24 * 60 * 60 * 1000;
  const threeMonths = 90 * 24 * 60 * 60 * 1000;

  let hasRecentReview = false;
  let hasModerateReview = false;

  for (const review of place.reviews) {
    if (review.publishTime) {
      const reviewDate = new Date(review.publishTime).getTime();
      const age = now - reviewDate;
      if (age < oneMonth) hasRecentReview = true;
      else if (age < threeMonths) hasModerateReview = true;
    }
  }

  if (hasRecentReview) {
    score += 8;
    parts.push("recent reviews");
  } else if (hasModerateReview) {
    score += 5;
    parts.push("reviews in last 3 months");
    recommendations.push(
      "Your most recent reviews are aging — encourage new reviews to signal an active business"
    );
  } else if (place.reviews.length > 0) {
    score += 2;
    parts.push("only older reviews");
    recommendations.push(
      "No recent reviews makes your profile look inactive — this hurts local rankings",
      "Launch a review campaign to get fresh reviews within the next 30 days"
    );
  } else {
    recommendations.push(
      "Active review flow signals a thriving business to Google — start collecting reviews"
    );
  }

  // Check for owner responses in sample reviews (indicates engagement)
  // The Places API doesn't directly show owner responses in the review objects,
  // but if the business has a high rating + lots of reviews, engagement is likely good.
  // We approximate this based on available signals.
  if (place.reviewCount && place.reviewCount >= 25 && place.rating && place.rating >= 4.3) {
    score += 7;
    parts.push("strong engagement signals");
  } else if (place.reviewCount && place.reviewCount >= 10) {
    score += 4;
    parts.push("moderate engagement");
    recommendations.push(
      "Respond to every review — Google rewards businesses that actively engage with customers. ReviewFlow can automate this with AI replies that match your brand voice"
    );
  } else {
    recommendations.push(
      "Responding to all reviews (positive and negative) is one of the easiest ways to boost your ranking. ReviewFlow automates this with AI-powered replies"
    );
  }

  const details =
    parts.length > 0
      ? `${parts.join(", ")}`
      : "No engagement signals detected";

  return { score, max: 15, label: "Engagement", details, recommendations };
}

export function computeAuditScore(place: PlaceData): AuditScoreBreakdown {
  const rating = scoreRating(place.rating);
  const reviewVolume = scoreReviewVolume(place.reviewCount);
  const visualPresence = scoreVisualPresence(place.photoCount);
  const profileCompleteness = scoreProfileCompleteness(place);
  const engagement = scoreEngagement(place);

  const total =
    rating.score +
    reviewVolume.score +
    visualPresence.score +
    profileCompleteness.score +
    engagement.score;

  let grade: AuditScoreBreakdown["grade"];
  if (total >= 85) grade = "A";
  else if (total >= 70) grade = "B";
  else if (total >= 55) grade = "C";
  else if (total >= 40) grade = "D";
  else grade = "F";

  return {
    rating,
    reviewVolume,
    visualPresence,
    profileCompleteness,
    engagement,
    total,
    grade,
  };
}
