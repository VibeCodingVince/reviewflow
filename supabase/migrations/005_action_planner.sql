-- GBP Action Planner: Task and post management tables

-- Optimization tasks (weekly AI-generated tasks)
CREATE TABLE public.optimization_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  task_type text NOT NULL CHECK (task_type IN ('post', 'service_update', 'description_update', 'photo', 'qa', 'hours_update', 'category_update')),
  priority integer NOT NULL DEFAULT 3 CHECK (priority >= 1 AND priority <= 5),
  title text NOT NULL,
  description text NOT NULL,
  ai_draft text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'published', 'skipped', 'failed')),
  impact_note text,
  week_of date NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);

-- GBP Posts (published post tracking)
CREATE TABLE public.gbp_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  task_id uuid REFERENCES public.optimization_tasks(id) ON DELETE SET NULL,
  google_post_id text,
  post_type text NOT NULL CHECK (post_type IN ('update', 'event', 'offer', 'product')),
  summary text NOT NULL,
  call_to_action text,
  event_title text,
  event_start timestamptz,
  event_end timestamptz,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'failed')),
  views integer DEFAULT 0,
  clicks integer DEFAULT 0,
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Add Action Planner toggle to businesses
ALTER TABLE public.businesses
  ADD COLUMN action_planner_enabled boolean NOT NULL DEFAULT false;

-- Indexes
CREATE INDEX idx_optimization_tasks_business ON public.optimization_tasks(business_id, week_of DESC);
CREATE INDEX idx_optimization_tasks_status ON public.optimization_tasks(status);
CREATE INDEX idx_gbp_posts_business ON public.gbp_posts(business_id, created_at DESC);
CREATE INDEX idx_gbp_posts_task ON public.gbp_posts(task_id);

-- RLS
ALTER TABLE public.optimization_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gbp_posts ENABLE ROW LEVEL SECURITY;

-- Optimization tasks policies
CREATE POLICY "Users can view tasks of own businesses" ON public.optimization_tasks
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.businesses
      WHERE businesses.id = optimization_tasks.business_id
      AND businesses.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update tasks of own businesses" ON public.optimization_tasks
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.businesses
      WHERE businesses.id = optimization_tasks.business_id
      AND businesses.user_id = auth.uid()
    )
  );

-- GBP Posts policies
CREATE POLICY "Users can view posts of own businesses" ON public.gbp_posts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.businesses
      WHERE businesses.id = gbp_posts.business_id
      AND businesses.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update posts of own businesses" ON public.gbp_posts
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.businesses
      WHERE businesses.id = gbp_posts.business_id
      AND businesses.user_id = auth.uid()
    )
  );
