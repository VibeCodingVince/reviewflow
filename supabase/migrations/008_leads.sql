-- Lead capture table for audit tool and future lead magnets
CREATE TABLE public.leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  business_name text NOT NULL,
  place_id text,
  score integer,
  score_breakdown jsonb,
  source text NOT NULL DEFAULT 'audit',
  converted boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_leads_email ON public.leads(email);
CREATE INDEX idx_leads_created_at ON public.leads(created_at DESC);

-- RLS enabled with no user policies — only accessed via admin client (service role)
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
