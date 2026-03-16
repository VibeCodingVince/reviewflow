# ReviewFlow — AI-Powered Google Review Responder SaaS

## Project Overview
A full-stack SaaS app that auto-generates and posts replies to Google Business reviews using Claude AI. Built with Next.js 14 (App Router), Supabase, Stripe, and the Anthropic SDK.

**Repo:** https://github.com/VibeCodingVince/reviewflow

## Tech Stack
- **Framework:** Next.js 14 (App Router, TypeScript strict mode)
- **Styling:** Tailwind CSS + shadcn/ui components
- **Database & Auth:** Supabase (PostgreSQL + Auth + RLS)
- **Payments:** Stripe (Checkout, Webhooks, Customer Portal)
- **AI:** Anthropic Claude (claude-sonnet-4-20250514) for reply generation
- **Fonts:** DM Serif Display (headings) + Outfit (body) via Google Fonts
- **Icons:** lucide-react

## Project Structure
```
src/
├── app/
│   ├── (auth)/          # Login, Signup pages (client components)
│   ├── (dashboard)/     # Dashboard, Business Reviews, Settings (client components)
│   ├── api/
│   │   ├── auth/        # Supabase + Google OAuth callbacks
│   │   ├── reviews/     # pull, generate-reply, generate-bulk, post-reply, update-status, import-csv
│   │   ├── stripe/      # checkout, webhook, portal
│   │   └── cron/        # check-reviews (auto-reply cron job)
│   ├── pricing/         # Pricing page
│   └── page.tsx         # Landing page
├── components/ui/       # shadcn/ui components
├── hooks/               # use-toast
├── lib/
│   ├── supabase/        # client.ts, server.ts, admin.ts
│   ├── stripe.ts        # Lazy-initialized Stripe client (getStripe())
│   ├── google.ts        # Google Business Profile API helpers
│   ├── types.ts         # TypeScript types for DB entities
│   └── utils.ts         # cn() utility
├── middleware.ts         # Auth protection for /dashboard, /settings
skills/                  # Design and architecture skill files
supabase/migrations/     # SQL schema with RLS policies
```

## Key Patterns
- **Stripe client** is lazy-initialized via `getStripe()` (not top-level) to avoid build errors when env vars are missing
- **Supabase SSR** uses `@supabase/ssr` with cookie-based auth — three clients: browser (`client.ts`), server component (`server.ts`), admin/service role (`admin.ts`)
- **RLS policies** enforce that users can only access their own data; reviews are accessed through business ownership
- **API routes** all follow try/catch pattern with auth check via `supabase.auth.getUser()`
- **Client pages** use "use client" directive and fetch data in useEffect with useCallback
- **Middleware** redirects unauthenticated users to /login and authenticated users away from auth pages
- **Onboarding flow:** signup → dashboard (3-step checklist) → add business → auto-redirect to business detail → Connect Google banner → OAuth → auto-pull reviews via `?connected=true` query param → generate replies
- **Google OAuth callback** redirects to `/dashboard/{businessId}?connected=true` — business detail page auto-syncs reviews on that param
- **`connectGoogle()` helper** exists in both `settings/page.tsx` and `[businessId]/page.tsx` (duplicated, ~5 lines each)
- **Trial banner** in dashboard layout fetches user record and shows countdown banners (>3 days: info, ≤3 days: warning, expired: alert)
- **Stripe webhook** stores `trial_end` from subscription on both `checkout.session.completed` and `customer.subscription.updated`; maps `trialing` status to `active`

## Database Tables
- `users` — linked to auth.users, has stripe_customer_id, subscription_status/tier, trial_end
- `businesses` — belongs to user, has google_refresh_token, tone, auto_reply, custom instructions
- `reviews` — belongs to business, has ai_reply, edited_reply, reply_status (pending/approved/posted/skipped/failed)

## Migrations
- `001_initial_schema.sql` — Base schema with users, businesses, reviews + RLS
- `002_add_trial_end.sql` — Adds `trial_end` (timestamptz, nullable) to users table

## Design System
- **Brand primary:** Dark green `#1B4332` (HSL: 153 46% 18%)
- **Style:** Premium/editorial, not corporate. White bg, light gray accents
- **Animations:** fade-in, slide-in-right, scale-in, float, shimmer + stagger delays
- **Utility classes:** `.font-display`, `.font-body`, `.grain-overlay`, `.stagger-1` through `.stagger-6`
- Follow `skills/frontend-design/SKILL.md` for all UI work
- Follow `skills/saas-architecture/SKILL.md` for all backend work

## Pricing Tiers
- Single: $29/mo — 1 location
- Multi: $79/mo — up to 5 locations
- 7-day free trial, no card required

## Environment Variables
See `.env.example` for all required vars. `.env.local` exists with placeholders for local dev (gitignored).

## Commands
- `npm run dev` — Start dev server
- `npm run build` — Production build
- `npm run lint` — ESLint

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
