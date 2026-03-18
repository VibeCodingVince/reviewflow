-- Early-Warning Radar: Performance monitoring tables

-- Performance snapshots (daily metrics per business)
CREATE TABLE public.performance_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  snapshot_date date NOT NULL,
  website_clicks integer DEFAULT 0,
  call_clicks integer DEFAULT 0,
  direction_requests integer DEFAULT 0,
  bookings integer DEFAULT 0,
  search_impressions integer DEFAULT 0,
  maps_impressions integer DEFAULT 0,
  photo_views integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(business_id, snapshot_date)
);

-- Alerts table
CREATE TABLE public.alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  alert_type text NOT NULL CHECK (alert_type IN ('metric_drop', 'metric_spike', 'rating_drop', 'review_surge', 'no_activity')),
  severity text NOT NULL CHECK (severity IN ('info', 'warning', 'critical')),
  title text NOT NULL,
  description text NOT NULL,
  recommendations jsonb DEFAULT '[]',
  metric_name text,
  metric_previous numeric,
  metric_current numeric,
  metric_change_pct numeric,
  is_read boolean NOT NULL DEFAULT false,
  is_dismissed boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Add Radar toggle and health score to businesses
ALTER TABLE public.businesses
  ADD COLUMN radar_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN health_score integer DEFAULT NULL;

-- Indexes
CREATE INDEX idx_performance_snapshots_business_date ON public.performance_snapshots(business_id, snapshot_date DESC);
CREATE INDEX idx_alerts_business_id ON public.alerts(business_id);
CREATE INDEX idx_alerts_unread ON public.alerts(business_id, is_read) WHERE is_read = false;

-- RLS
ALTER TABLE public.performance_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;

-- Performance snapshots policies (through business ownership)
CREATE POLICY "Users can view snapshots of own businesses" ON public.performance_snapshots
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.businesses
      WHERE businesses.id = performance_snapshots.business_id
      AND businesses.user_id = auth.uid()
    )
  );

-- Alerts policies (through business ownership)
CREATE POLICY "Users can view alerts of own businesses" ON public.alerts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.businesses
      WHERE businesses.id = alerts.business_id
      AND businesses.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update alerts of own businesses" ON public.alerts
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.businesses
      WHERE businesses.id = alerts.business_id
      AND businesses.user_id = auth.uid()
    )
  );
