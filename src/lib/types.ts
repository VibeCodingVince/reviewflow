export type SubscriptionStatus = "free" | "active" | "canceled" | "past_due";
export type SubscriptionTier = "single" | "multi";
export type Tone = "friendly" | "professional" | "casual";
export type ReplyStatus = "pending" | "approved" | "posted" | "skipped" | "failed";

export interface User {
  id: string;
  email: string;
  full_name: string | null;
  stripe_customer_id: string | null;
  subscription_status: SubscriptionStatus;
  subscription_tier: SubscriptionTier | null;
  trial_end: string | null;
  created_at: string;
  updated_at: string;
}

export interface Business {
  id: string;
  user_id: string;
  google_account_id: string | null;
  google_refresh_token: string | null;
  business_name: string;
  business_type: string;
  tone: Tone;
  auto_reply: boolean;
  review_reply_instructions: string | null;
  is_active: boolean;
  created_at: string;
}

export interface Review {
  id: string;
  business_id: string;
  google_review_id: string | null;
  reviewer_name: string;
  rating: number;
  review_text: string;
  review_date: string;
  ai_reply: string | null;
  edited_reply: string | null;
  reply_status: ReplyStatus;
  posted_at: string | null;
  created_at: string;
}

export interface BusinessWithStats extends Business {
  review_count: number;
  pending_count: number;
  avg_rating: number;
}
