# RankClerk — AI-Powered GBP Management Platform

## Project Overview
A full-stack SaaS app that manages Google Business Profiles with AI. Started as a review auto-responder, now expanded to a full GBP management platform with 3 AI agent features. Built with Next.js 14 (App Router), Supabase, Stripe, and the Anthropic SDK.

**Repo:** https://github.com/VibeCodingVince/revclerk

## Tech Stack
- **Framework:** Next.js 14 (App Router, TypeScript strict mode)
- **Styling:** Tailwind CSS + shadcn/ui components
- **Animations:** Framer Motion (`motion/react`) — scroll reveals, stagger, spring hover/tap
- **Database & Auth:** Supabase (PostgreSQL + Auth + RLS)
- **Payments:** Stripe (Checkout, Webhooks, Customer Portal)
- **AI:** Anthropic Claude (claude-sonnet-4-20250514) for reply generation, spam analysis, alerts, and task generation
- **i18n:** Custom context-based system (`src/lib/i18n/`) — EN/FR with localStorage persistence
- **Fonts:** Instrument Serif (headings) + Inter (body) via Google Fonts
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
│   ├── audit/               # Free GBP Health Score Audit (public lead magnet)
│   ├── api/
│   │   ├── auth/            # Supabase + Google OAuth callbacks
│   │   ├── audit/           # search, score, capture (public, no auth)
│   │   ├── reviews/         # pull, generate-reply, generate-bulk, post-reply, update-status, import-csv, analyze-spam, generate-flag-narrative
│   │   ├── stripe/          # checkout, webhook, portal
│   │   ├── cron/            # check-reviews, check-performance, generate-tasks, publish-posts
│   │   ├── alerts/          # GET/PATCH alerts (Radar)
│   │   ├── performance/     # GET performance snapshots (Radar)
│   │   ├── tasks/           # GET/PATCH optimization tasks (Planner)
│   │   └── posts/           # GET posts, POST publish (Planner)
│   ├── pricing/             # Pricing page (3 tiers: Single, Multi, Pro)
│   └── page.tsx             # Landing page
├── components/
│   ├── ui/                  # shadcn/ui components
│   ├── logo.tsx             # Shared Logo + LogoMark components (RankClerk brand)
│   └── language-toggle.tsx  # EN | FR language switcher
├── hooks/                   # use-toast
├── lib/
│   ├── supabase/            # client.ts, server.ts, admin.ts
│   ├── i18n/                # context.tsx (I18nProvider + useI18n hook), translations.ts (EN/FR)
│   ├── subscription.ts      # isSubscriptionActive(), requireActiveSubscription(), requireFeatureAccess()
│   ├── spam-analysis.ts     # analyzeSpam() — Claude-powered spam detection (shared by routes + cron)
│   ├── audit-score.ts       # computeAuditScore() — public GBP health scoring (used by audit routes)
│   ├── stripe.ts            # Lazy-initialized Stripe client (getStripe())
│   ├── google.ts            # Google Business Profile API helpers (reviews, performance, posts)
│   ├── types.ts             # TypeScript types for all DB entities
│   └── utils.ts             # cn() utility
├── middleware.ts             # Auth protection for /dashboard, /settings
skills/                      # Design, architecture, and lead magnet skill files
supabase/migrations/         # SQL schema with RLS policies (001-008)
```

## Key Patterns
- **Checkout success modal:** Dashboard shows a thank-you modal when redirected from Stripe with `?checkout=success` query param. Cleans URL via `window.history.replaceState`.
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
- **Public API routes** (`/api/audit/*`): No auth required. Use in-memory rate limiting. Proxy Google Places API to keep key server-side. Use `createAdminClient()` for DB writes (leads table).
- **Lead magnet pattern** (`/audit`): 4-state client component (search → loading → preview → full). Preview shows score + mini cards, gates detailed recommendations behind email. Follow `skills/lead-magnet/SKILL.md` for conversion patterns.
- **i18n system** (`src/lib/i18n/`): Custom React context + `useI18n()` hook. Translations in `translations.ts` (EN/FR). `I18nProvider` wraps app in `layout.tsx`. Language persists in localStorage. `LanguageToggle` component shows `EN | FR` in nav bars. All public pages (landing, pricing, audit, login, signup) are fully translated.
- **Framer Motion** (`motion/react`): All public pages use Framer Motion instead of CSS animations. Patterns: `fadeUp` variants with `whileInView` for scroll reveals, `staggerContainer` for grids, spring `whileHover`/`whileTap` on buttons and cards. Import from `motion/react` (NOT `framer-motion`). All animated components must be `"use client"`.
- **Hero device mockups**: Landing page hero shows a MacBook with dashboard UI + iPhone overlay with notifications/health score. Both float with `animate={{ y: [0, -8, 0] }}`. Performance chart bars animate in sequentially.
- **Logo component** (`src/components/logo.tsx`): Shared `Logo` (icon + wordmark) and `LogoMark` (icon only) components. Used in all nav bars, footers, and auth pages. Inline SVG of ascending bars + checkmark. Accepts `size` prop ("sm" | "default").
- **Gold color token**: Custom `--gold` CSS variable + Tailwind `gold` color for the brand accent. Use `text-gold`, `bg-gold`, etc. The `--accent` variable is kept as a subtle warm tint for shadcn/ui hover states (not gold).
- **CSS stacking context gotcha**: Elements with `animate-fade-in` (uses opacity + transform) create isolated stacking contexts. When dropdown menus need to render above sibling animated elements, add explicit `z-index` to the dropdown's parent container, not just the dropdown itself.

## Database Tables
- `users` — linked to auth.users, has stripe_customer_id, subscription_status/tier (single/multi/pro), trial_end
- `businesses` — belongs to user, has google_refresh_token, tone, auto_reply, custom instructions, review_shield_enabled, radar_enabled, action_planner_enabled, health_score
- `reviews` — belongs to business, has ai_reply, edited_reply, reply_status, spam_score, spam_reasons, is_suspicious, flag_status, flag_narrative, flagged_at
- `performance_snapshots` — daily metrics per business (clicks, calls, directions, bookings, impressions). Unique on (business_id, snapshot_date)
- `alerts` — AI-generated alerts with type, severity, title, description, recommendations, metric deltas, read/dismissed state
- `optimization_tasks` — weekly AI tasks with type, priority, title, description, ai_draft, status, impact_note, week_of
- `gbp_posts` — published posts tracking with google_post_id, post_type, summary, CTA, status, views, clicks
- `leads` — email captures from audit tool with business_name, place_id, score, score_breakdown, source, converted flag

## Migrations
- `001_initial_schema.sql` — Base schema with users, businesses, reviews + RLS
- `002_add_trial_end.sql` — Adds `trial_end` (timestamptz, nullable) to users table
- `003_review_shield.sql` — Spam columns on reviews + shield toggle on businesses
- `004_radar.sql` — performance_snapshots + alerts tables + RLS + radar_enabled/health_score on businesses
- `005_action_planner.sql` — optimization_tasks + gbp_posts tables + RLS + action_planner_enabled on businesses
- `006_pro_tier.sql` — Adds 'pro' to subscription_tier constraint
- `007_fix_google_oauth.sql` — Fixes handle_new_user() trigger to properly extract name from Google OAuth metadata (uses `name` field, falls back to email username)
- `008_leads.sql` — Lead capture table for audit tool (RLS enabled, no user policies — server-only via admin client)

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
| check-reviews | `/api/cron/check-reviews` | Every 12 hours |
| check-performance | `/api/cron/check-performance` | Daily 2 AM |
| generate-tasks | `/api/cron/generate-tasks` | Weekly Monday 6 AM |
| publish-posts | `/api/cron/publish-posts` | Every 12 hours |

## Design System
- **Brand primary:** Dark navy `#0F1D2F` (HSL: 215 52% 12%), **Gold accent:** `#D4952A`
- **Style:** Premium/editorial, not corporate. White bg, light gray accents
- **Animations:** Framer Motion (`motion/react`) for all public pages. Tailwind keyframes still available for dashboard.
- **Utility classes:** `.font-display`, `.font-body`, `.grain-overlay`, `.stagger-1` through `.stagger-6`
- Follow `skills/frontend-design/SKILL.md` for all UI work
- Follow `skills/saas-architecture/SKILL.md` for all backend work
- Follow `skills/lead-magnet/SKILL.md` for lead magnet / conversion pages
- Follow `skills/3d-animator/SKILL.md` for animations and 3D effects

## Pricing Tiers
- Single: $19/mo — 1 location, review replies only
- Multi: $49/mo — up to 5 locations, review replies only
- **Pro: $99/mo — up to 5 locations, review replies + Shield + Radar + Planner**
- 7-day free trial, no card required

## Supabase Project
- **Project URL:** `https://vdkujkrurjqklkpofpmz.supabase.co`
- **Migrations 001–006** have been run on the live Supabase project (as of 2026-03-20)
- **Migration 007** has been run on the live Supabase project (as of 2026-03-21)
- **Migration 008** has been run on the live Supabase project (as of 2026-03-21)
- Database is fully provisioned: all 8 tables, RLS policies, triggers, indexes

## Deployment
- **Hosting:** Vercel (free Hobby tier)
- **Vercel project:** `revclerk` (was `reviewflow`, new project created during folder rename)
- **Domain:** `revclerk.com` (Namecheap, nameservers pointed to Vercel: ns1/ns2.vercel-dns.com)
- **Live URL:** https://revclerk.com
- **Cron jobs:** Will run on VPS via `crontab` + curl (Vercel free tier only supports daily crons)
- **Dashboard layout split:** Server wrapper `layout.tsx` (exports `force-dynamic`) + client `dashboard-layout.tsx` (the actual UI). Required because `"use client"` files can't export route segment config.
- **Still needed:**
  - Set up 4 cron jobs on VPS

## Environment Variables
See `.env.example` for all required vars. `.env.local` exists with credentials configured (gitignored).

**Mac `.env.local` status (as of 2026-03-21):**
- ✅ Supabase URL, anon key, service role key
- ✅ Google OAuth (Client ID + Secret)
- ✅ Anthropic API key
- ✅ Stripe keys (publishable + secret) and price IDs (Single/Multi/Pro)
- ✅ CRON_SECRET
- ✅ Google Places API key (for audit lead magnet)
- ✅ STRIPE_WEBHOOK_SECRET (set 2026-03-22)

**Vercel env vars (as of 2026-03-22):**
- ✅ All 15 env vars pushed to production environment
- ✅ `NEXT_PUBLIC_APP_URL` set to `https://revclerk.com`
- ✅ `STRIPE_WEBHOOK_SECRET` set (whsec_...)

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
