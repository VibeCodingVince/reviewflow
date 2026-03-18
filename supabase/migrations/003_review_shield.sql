-- Review Shield: Add spam detection columns to reviews table
ALTER TABLE public.reviews
  ADD COLUMN spam_score numeric DEFAULT NULL,
  ADD COLUMN spam_reasons jsonb DEFAULT NULL,
  ADD COLUMN is_suspicious boolean NOT NULL DEFAULT false,
  ADD COLUMN flag_status text NOT NULL DEFAULT 'none' CHECK (flag_status IN ('none', 'flagged', 'escalated', 'removed', 'kept')),
  ADD COLUMN flag_narrative text,
  ADD COLUMN flagged_at timestamptz;

-- Add Review Shield toggle to businesses
ALTER TABLE public.businesses
  ADD COLUMN review_shield_enabled boolean NOT NULL DEFAULT false;

-- Index for filtering suspicious reviews
CREATE INDEX idx_reviews_is_suspicious ON public.reviews(is_suspicious) WHERE is_suspicious = true;
CREATE INDEX idx_reviews_flag_status ON public.reviews(flag_status) WHERE flag_status != 'none';
