# ReviewFlow — Shared Memory (Cross-Machine)

> **This file is the shared brain.** On any new machine or session, tell Claude: "read shared-memory.md" to restore full context.

---

## Current Status
- **Last updated:** 2026-03-16 (Mac session)
- **Phase:** Initial build complete + self-serve onboarding + trial countdown banner
- **Last session:** Added trial countdown banner to dashboard — `trial_end` column, Stripe webhook integration, 3-tier banner (info/warning/alert), settings page trial display
- **Repo:** https://github.com/VibeCodingVince/reviewflow
- **Build status:** Clean TypeScript (`tsc --noEmit` passes) — pre-existing static export warnings for pages needing env vars remain

### What was done this session
1. **Database migration (`002_add_trial_end.sql`):** Added `trial_end` (timestamptz, nullable) to `users` table
2. **Types (`types.ts`):** Added `trial_end: string | null` to User interface
3. **Stripe webhook (`webhook/route.ts`):** Both `checkout.session.completed` and `customer.subscription.updated` now extract `trial_end` from the Stripe subscription and store it. `trialing` status already mapped to `active`.
4. **Dashboard layout (`layout.tsx`):** Added `TrialBanner` component that fetches user record and shows:
   - >3 days left: subtle emerald info banner + "Upgrade" link
   - ≤3 days left: amber warning banner + "Upgrade now" CTA
   - Expired (non-active): red alert banner + "Subscribe to continue" CTA
   - Paid/no trial: no banner
5. **Settings page (`settings/page.tsx`):** Subscription badge shows "Free Trial — X days remaining" when on active trial

### What was discussed for next steps
Prioritized list of remaining code-level fixes before going live:
1. **Tier passthrough in Stripe checkout** — checkout flow needs to pass selected tier (single/multi) through to Stripe metadata so webhook stores it correctly
2. **Trial start timing** — Ensure `subscription_data.trial_period_days: 7` is set in Stripe Checkout session creation
3. **Subscription gate** — No enforcement yet that free/expired users can't use paid features (generate replies, post replies, etc.)
4. **CSV import validation** — import-csv endpoint needs better error handling for production
5. **Duplicate `connectGoogle()` helper** — Extract from settings + business detail into shared util
6. **Error boundaries** — Dashboard pages have none; failed fetch crashes the page
7. **Loading states on layout** — Trial banner flashes in after user data loads

### Infrastructure setup still needed
- Set up real Supabase project and fill in `.env.local` with real credentials
- Run migrations (001 + 002)
- Set up Stripe products/prices with correct tier metadata
- Set up Google Cloud project with Business Profile API + OAuth credentials
- Set up Anthropic API key
- Test end-to-end onboarding flow
- Deploy to Vercel

## Lessons Learned / Gotchas
- **Stripe lazy init:** Must use `getStripe()` factory, NOT top-level `new Stripe()` — causes build failure when env vars aren't set at build time
- **Next.js 14 prerender:** Client pages using Supabase fail prerender without env vars — need `.env.local` with placeholder values for builds to pass
- **shadcn/ui CLI:** Use `npx shadcn@latest` (not `shadcn-ui` which is deprecated)
- **create-next-app naming:** Cannot use directory names with spaces/capitals — create in subdirectory then move files up
- **Stripe API version:** Must match installed SDK version exactly (was `2026-02-25.clover` for current stripe package)
- **Supabase SSR cookies:** Uses get/set/remove pattern — set/remove wrapped in try/catch for server components
- **Git auth:** When gh CLI has multiple accounts, may need `gh auth setup-git` to fix push permissions
- **Mac dev setup:** Homebrew and `gh` CLI installed on Mac (2026-03-16). `gh` lives at `/opt/homebrew/bin/gh` — shell may need restart or path update if `gh` isn't found
- **Stripe trial_end:** Stripe returns `trial_end` as a Unix timestamp (seconds) — must multiply by 1000 for JS Date constructor

## User Preferences
- Prefers comprehensive, full builds over incremental
- GitHub accounts: VibeCodingVince (primary), VinceDaigle (secondary)
- Works across Windows (C:\GOOGLE REVIEW) and Mac
- Wants "end session" protocol: update CLAUDE.md → update shared-memory.md → commit & push

## Project Architecture Notes
- All API routes use try/catch + auth check via `supabase.auth.getUser()`
- Three Supabase clients: browser (client.ts), server (server.ts), admin (admin.ts)
- RLS enforces data isolation — reviews accessed through business ownership
- Claude AI model used: `claude-sonnet-4-20250514` for reply generation
- Design system: DM Serif Display + Outfit fonts, dark green #1B4332 primary, premium/editorial style
- Skills files in `skills/` directory guide all UI and backend decisions
- Dashboard layout is a client component that fetches user data for the trial banner
