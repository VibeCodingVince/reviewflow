export type SubscriptionStatus = "free" | "active" | "canceled" | "past_due";
export type SubscriptionTier = "single" | "multi" | "pro";
export type Tone = "friendly" | "professional" | "casual";
export type ReplyStatus = "pending" | "approved" | "posted" | "skipped" | "failed";

// Review Shield types
export type FlagStatus = "none" | "flagged" | "escalated" | "removed" | "kept";

// Radar types
export type AlertType = "metric_drop" | "metric_spike" | "rating_drop" | "review_surge" | "no_activity";
export type AlertSeverity = "info" | "warning" | "critical";

// Action Planner types
export type TaskType = "post" | "service_update" | "description_update" | "photo" | "qa" | "hours_update" | "category_update";
export type TaskStatus = "pending" | "approved" | "published" | "skipped" | "failed";
export type PostType = "update" | "event" | "offer" | "product";
export type PostStatus = "draft" | "published" | "failed";

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
  // Feature toggles
  review_shield_enabled: boolean;
  radar_enabled: boolean;
  action_planner_enabled: boolean;
  // Radar
  health_score: number | null;
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
  // Review Shield fields
  spam_score: number | null;
  spam_reasons: string[] | null;
  is_suspicious: boolean;
  flag_status: FlagStatus;
  flag_narrative: string | null;
  flagged_at: string | null;
}

export interface BusinessWithStats extends Business {
  review_count: number;
  pending_count: number;
  avg_rating: number;
}

export interface PerformanceSnapshot {
  id: string;
  business_id: string;
  snapshot_date: string;
  website_clicks: number;
  call_clicks: number;
  direction_requests: number;
  bookings: number;
  search_impressions: number;
  maps_impressions: number;
  photo_views: number;
  created_at: string;
}

export interface Alert {
  id: string;
  business_id: string;
  alert_type: AlertType;
  severity: AlertSeverity;
  title: string;
  description: string;
  recommendations: string[];
  metric_name: string | null;
  metric_previous: number | null;
  metric_current: number | null;
  metric_change_pct: number | null;
  is_read: boolean;
  is_dismissed: boolean;
  created_at: string;
}

export interface OptimizationTask {
  id: string;
  business_id: string;
  task_type: TaskType;
  priority: number;
  title: string;
  description: string;
  ai_draft: string | null;
  status: TaskStatus;
  impact_note: string | null;
  week_of: string;
  created_at: string;
  completed_at: string | null;
}

export interface GBPPost {
  id: string;
  business_id: string;
  task_id: string | null;
  google_post_id: string | null;
  post_type: PostType;
  summary: string;
  call_to_action: string | null;
  event_title: string | null;
  event_start: string | null;
  event_end: string | null;
  status: PostStatus;
  views: number;
  clicks: number;
  published_at: string | null;
  created_at: string;
}
