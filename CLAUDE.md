# ReviewFlow — AI-Powered GBP Management Platform

## Project Overview
A full-stack SaaS app that manages Google Business Profiles with AI. Started as a review auto-responder, now expanded to a full GBP management platform with 3 AI agent features. Built with Next.js 14 (App Router), Supabase, Stripe, and the Anthropic SDK.

**Repo:** https://github.com/VibeCodingVince/reviewflow

## Tech Stack
- **Framework:** Next.js 14 (App Router, TypeScript strict mode)
- **Styling:** Tailwind CSS + shadcn/ui components
- **Database & Auth:** Supabase (PostgreSQL + Auth + RLS)
- **Payments:** Stripe (Checkout, Webhooks, Customer Portal)
- **AI:** Anthropic Claude (claude-sonnet-4-20250514) for reply generation, spam analysis, alerts, and task generation
- **Fonts:** DM Serif Display (headings) + Outfit (body) via Google Fonts
- **Icons:** lucide-react

## Project Structure
```
src/
├── app/
│   ├── (auth)/              # Login, Signup pages (client components)
│   ├── (dashboard)/
│   │   ├── dashboard/       # Main dashboard + [businessId] detail page
│   │   ├── radar/           # Early-Warning Radar page (Pro)
│   │   ├── planner/         # Action Planner + posts subpage (Pro)
│   │   ├── settings/        # Settings with Pro feature toggles
│   │   └── layout.tsx       # Dashboard layout with nav, trial banner, alert bell
│   ├── api/
│   │   ├── auth/            # Supabase + Google OAuth callbacks
│   │   ├── reviews/         # pull, generate-reply, generate-bulk, post-reply, update-status, import-csv, analyze-spam, generate-flag-narrative
│   │   ├── stripe/          # checkout, webhook, portal
│   │   ├── cron/            # check-reviews, check-performance, generate-tasks, publish-posts
│   │   ├── alerts/          # GET/PATCH alerts (Radar)
│   │   ├── performance/     # GET performance snapshots (Radar)
│   │   ├── tasks/           # GET/PATCH optimization tasks (Planner)
│   │   └── posts/           # GET posts, POST publish (Planner)
│   ├── pricing/             # Pricing page (3 tiers: Single, Multi, Pro)
│   └── page.tsx             # Landing page
├── components/ui/           # shadcn/ui components
├── hooks/                   # use-toast
├── lib/
│   ├── supabase/            # client.ts, server.ts, admin.ts
│   ├── subscription.ts      # isSubscriptionActive(), requireActiveSubscription(), requireFeatureAccess()
│   ├── spam-analysis.ts     # analyzeSpam() — Claude-powered spam detection (shared by routes + cron)
│   ├── stripe.ts            # Lazy-initialized Stripe client (getStripe())
│   ├── google.ts            # Google Business Profile API helpers (reviews, performance, posts)
│   ├── types.ts             # TypeScript types for all DB entities
│   └── utils.ts             # cn() utility
├── middleware.ts             # Auth protection for /dashboard, /settings
skills/                      # Design and architecture skill files
supabase/migrations/         # SQL schema with RLS policies (001-006)
```

## Key Patterns
- **Stripe client** is lazy-initialized via `getStripe()` (not top-level) to avoid build errors when env vars are missing
- **Supabase SSR** uses `@supabase/ssr` with cookie-based auth — three clients: browser (`client.ts`), server component (`server.ts`), admin/service role (`admin.ts`)
- **RLS policies** enforce that users can only access their own data; reviews/alerts/tasks/posts are accessed through business ownership
- **API routes** all follow try/catch pattern with auth check via `supabase.auth.getUser()`, then subscription gate via `requireActiveSubscription()` for paid features, or `requireFeatureAccess()` for Pro-only features
- **Client pages** use "use client" directive and fetch data in useEffect with useCallback
- **Middleware** redirects unauthenticated users to /login and authenticated users away from auth pages
- **Onboarding flow:** signup → dashboard (3-step checklist) → add business → auto-redirect to business detail → Connect Google banner → OAuth → auto-pull reviews via `?connected=true` query param → generate replies
- **Google OAuth callback** redirects to `/dashboard/{businessId}?connected=true` — business detail page auto-syncs reviews on that param
- **`connectGoogle()` helper** exists in both `settings/page.tsx` and `[businessId]/page.tsx` (duplicated, ~5 lines each)
- **Trial banner** in dashboard layout fetches user record and shows countdown banners (>3 days: info, ≤3 days: warning, expired: alert)
- **Stripe webhook** stores `trial_end` from subscription on both `checkout.session.completed` and `customer.subscription.updated`; maps `trialing` status to `active`
- **Subscription gate** (`src/lib/subscription.ts`): `isSubscriptionActive()` checks status=active/free OR valid trial; `requireActiveSubscription()` is async DB-check helper returning 403 with `SUBSCRIPTION_REQUIRED` code. Applied to 5 paid routes (generate-reply, generate-bulk, post-reply, pull, import-csv). `update-status` is intentionally ungated. Cron job uses `isSubscriptionActive()` to also honor trials.
- **Feature gate** (`requireFeatureAccess()`): checks subscription is active AND tier='pro'. Returns 403 with `FEATURE_REQUIRED` code. Applied to all new Pro routes (analyze-spam, generate-flag-narrative, alerts, performance, tasks, posts).
- **Shared spam analysis** (`src/lib/spam-analysis.ts`): Extracted from route file because Next.js route files can only export HTTP handlers. Used by analyze-spam route, cron/check-reviews, and reviews/pull.
- **Cron pattern**: All crons use CRON_SECRET bearer auth, createAdminClient(), isSubscriptionActive() + tier check per business, 200ms rate limiting.

## Database Tables
- `users` — linked to auth.users, has stripe_customer_id, subscription_status/tier (single/multi/pro), trial_end
- `businesses` — belongs to user, has google_refresh_token, tone, auto_reply, custom instructions, review_shield_enabled, radar_enabled, action_planner_enabled, health_score
- `reviews` — belongs to business, has ai_reply, edited_reply, reply_status, spam_score, spam_reasons, is_suspicious, flag_status, flag_narrative, flagged_at
- `performance_snapshots` — daily metrics per business (clicks, calls, directions, bookings, impressions). Unique on (business_id, snapshot_date)
- `alerts` — AI-generated alerts with type, severity, title, description, recommendations, metric deltas, read/dismissed state
- `optimization_tasks` — weekly AI tasks with type, priority, title, description, ai_draft, status, impact_note, week_of
- `gbp_posts` — published posts tracking with google_post_id, post_type, summary, CTA, status, views, clicks

## Migrations
- `001_initial_schema.sql` — Base schema with users, businesses, reviews + RLS
- `002_add_trial_end.sql` — Adds `trial_end` (timestamptz, nullable) to users table
- `003_review_shield.sql` — Spam columns on reviews + shield toggle on businesses
- `004_radar.sql` — performance_snapshots + alerts tables + RLS + radar_enabled/health_score on businesses
- `005_action_planner.sql` — optimization_tasks + gbp_posts tables + RLS + action_planner_enabled on businesses
- `006_pro_tier.sql` — Adds 'pro' to subscription_tier constraint

## 3 AI Agent Features (Pro Tier)

### 1. Review Shield — Fake Review Detection
- AI analyzes reviews for spam patterns, scores 0.0–1.0, flags ≥0.7
- Generates policy-aligned flag/appeal narratives for Google reporting
- Runs automatically in cron + on-demand pulls (when shield enabled)
- Dashboard: Shield tab on business detail page shows suspicious reviews with scores, reasons, flag status

### 2. Early-Warning Radar — Performance Monitoring
- Daily cron pulls GBP Performance API metrics
- Detects anomalies (>20% drops) and generates AI-powered alerts
- Computes health score (0–100) per business
- Dashboard: /radar page with health score, metric cards, trend chart, alert feed

### 3. GBP Action Planner — Weekly AI Optimization
- Weekly cron audits profile and generates 3–5 prioritized tasks
- AI drafts GBP posts, service descriptions, profile updates
- Auto-publishes approved posts via Google LocalPosts API
- Dashboard: /planner page with task checklist, /planner/posts for published posts grid

## Cron Schedule
| Job | Route | Frequency |
|---|---|---|
| check-reviews | `/api/cron/check-reviews` | Every 30 min |
| check-performance | `/api/cron/check-performance` | Daily 2 AM |
| generate-tasks | `/api/cron/generate-tasks` | Weekly Monday 6 AM |
| publish-posts | `/api/cron/publish-posts` | Every 6 hours |

## Design System
- **Brand primary:** Dark green `#1B4332` (HSL: 153 46% 18%)
- **Style:** Premium/editorial, not corporate. White bg, light gray accents
- **Animations:** fade-in, slide-in-right, scale-in, float, shimmer + stagger delays
- **Utility classes:** `.font-display`, `.font-body`, `.grain-overlay`, `.stagger-1` through `.stagger-6`
- Follow `skills/frontend-design/SKILL.md` for all UI work
- Follow `skills/saas-architecture/SKILL.md` for all backend work

## Pricing Tiers
- Single: $29/mo — 1 location, review replies only
- Multi: $79/mo — up to 5 locations, review replies only
- **Pro: $149/mo — up to 5 locations, review replies + Shield + Radar + Planner**
- 7-day free trial, no card required

## Supabase Project
- **Project URL:** `https://vdkujkrurjqklkpofpmz.supabase.co`
- **Migrations 001–006** have been run on the live Supabase project (as of 2026-03-20)
- Database is fully provisioned: all 7 tables, RLS policies, triggers, indexes

## Environment Variables
See `.env.example` for all required vars. `.env.local` exists with Supabase credentials configured (gitignored).
Still needed in `.env.local`: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_PRICE_SINGLE`, `STRIPE_PRICE_MULTI`, `STRIPE_PRICE_PRO`, `ANTHROPIC_API_KEY`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `CRON_SECRET`.

## Commands
- `npm run dev` — Start dev server
- `npm run build` — Production build
- `npm run lint` — ESLint
- `npx tsx scripts/seed-radar-demo.ts` — Seed Radar demo data (requires user account to exist first)

## Scripts
- `scripts/seed-radar-demo.ts` — Seeds demo data for Early-Warning Radar: upgrades user to Pro, creates business, inserts 30 days of performance snapshots + 4 alerts. Run after signing up.

---

## Session Protocol — MANDATORY

When the user types **"end session"**, you MUST do the following in order:

1. **Update `CLAUDE.md`** — Add/update any new project context: new files, changed patterns, architectural decisions, current state of work, what was done this session, and what's next.
2. **Update `shared-memory.md`** (at repo root) — This is the cross-machine shared memory file. Write everything Claude needs to know to resume work seamlessly on any machine: lessons learned, debugging insights, gotchas, user preferences, current progress, and next steps. This file IS the memory — it lives in the repo so it syncs across machines.
3. **Commit and push both files to GitHub.**

On any new machine/session, the user will say **"read shared-memory.md"** — that file must contain everything needed to pick up where we left off.

### What goes in `shared-memory.md`:
- Lessons learned and debugging gotchas (e.g. Stripe lazy init, Next.js prerender quirks)
- Current project status and what was last worked on
- What needs to be done next
- User preferences and workflow notes
- Any patterns or conventions established in this project

### What goes in `CLAUDE.md`:
- Project structure, tech stack, key patterns (the permanent reference doc)
- Updated whenever the architecture or structure changes
