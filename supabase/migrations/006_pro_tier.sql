-- Add 'pro' to subscription_tier constraint
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_subscription_tier_check;
ALTER TABLE public.users ADD CONSTRAINT users_subscription_tier_check CHECK (subscription_tier IN ('single', 'multi', 'pro'));
