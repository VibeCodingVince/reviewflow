# ReviewFlow — Shared Memory (Cross-Machine)

> **This file is the shared brain.** On any new machine or session, tell Claude: "read shared-memory.md" to restore full context.

---

## Current Status
- **Last updated:** 2026-03-17 (Windows session)
- **Phase:** 3 AI agent features fully built + Pro tier pricing
- **Last session:** Built Review Shield, Early-Warning Radar, and GBP Action Planner (all 3 phases complete)
- **Repo:** https://github.com/VibeCodingVince/reviewflow
- **Build status:** Clean (`npm run build` passes). Pre-existing static export warnings for pages needing env vars remain.

### What was done this session
Built 3 fully-automated AI agent features that transform ReviewFlow from a review-reply tool into a full GBP management platform:

1. **Review Shield** — AI fake review detection & response
   - New columns on reviews table (spam_score, spam_reasons, is_suspicious, flag_status, flag_narrative)
   - `src/lib/spam-analysis.ts` shared utility for Claude-powered spam scoring
   - API routes: `analyze-spam`, `generate-flag-narrative`
   - Integrated into cron/check-reviews and reviews/pull (auto-scans when shield enabled)
   - UI: Shield tab on business detail page with spam badges, reasons, appeal narrative generation

2. **Early-Warning Radar** — Performance monitoring & AI alerts
   - New tables: `performance_snapshots`, `alerts` (with RLS)
   - Google API: `fetchPerformanceMetrics()` in google.ts
   - API routes: `cron/check-performance`, `alerts` (GET/PATCH), `performance` (GET)
   - Health score computation (0-100) per business
   - UI: `/radar` page with health score card, metric cards with trend arrows, chart, alert feed

3. **GBP Action Planner** — Weekly AI content & optimization
   - New tables: `optimization_tasks`, `gbp_posts` (with RLS)
   - Google API: `createLocalPost()`, `listLocalPosts()` in google.ts
   - API routes: `cron/generate-tasks`, `cron/publish-posts`, `tasks` (GET/PATCH), `posts` (GET), `posts/publish`
   - UI: `/planner` page with weekly task checklist, AI drafts, approve/publish; `/planner/posts` for published posts grid

4. **Pro Tier & Feature Gating**
   - New `requireFeatureAccess()` in subscription.ts — checks tier='pro', returns 403 with FEATURE_REQUIRED
   - Stripe checkout updated for Pro tier ($149/mo, needs `STRIPE_PRICE_PRO` env var)
   - Pricing page + landing page updated to 3-column layout
   - Dashboard nav shows Radar/Planner with Pro badges for non-Pro users
   - Settings page has per-business toggles for Shield/Radar/Planner (disabled unless Pro)
   - Migration 006 adds 'pro' to subscription_tier constraint

5. **Infrastructure**
   - 4 new migrations (003-006)
   - Dashboard layout updated with Radar/Planner nav items + alert bell with unread count
   - 20 new files created, 11 existing files modified
   - All new crons follow existing pattern (CRON_SECRET, admin client, subscription check, rate limiting)

### What needs to be done next
**Before going live (priority order):**
1. **Run migrations 003-006** on real Supabase project
2. **Create STRIPE_PRICE_PRO** product/price in Stripe dashboard, add to `.env.local`
3. **Set up Vercel cron config** for new cron jobs (check-performance daily 2AM, generate-tasks weekly Monday 6AM, publish-posts every 6h)
4. **Test end-to-end flows** — enable Shield/Radar/Planner toggles, verify cron routes, check Pro feature gating
5. **Tier passthrough in Stripe checkout** — verify Pro tier metadata flows through webhook correctly
6. **Trial start timing** — Ensure `trial_period_days: 7` is set for Pro tier checkout
7. **Frontend subscription gate UX** — Handle `FEATURE_REQUIRED` 403 responses in the UI (show upgrade prompt)

**Pre-existing items still outstanding:**
8. CSV import validation improvements
9. Duplicate `connectGoogle()` helper — extract to shared util
10. Error boundaries on dashboard pages
11. Loading state flash on trial banner
12. Deploy to Vercel

### New cron schedule to configure
```
check-reviews:      */30 * * * *        (every 30 min — existing)
check-performance:  0 2 * * *           (daily 2 AM)
generate-tasks:     0 6 * * 1           (weekly Monday 6 AM)
publish-posts:      0 */6 * * *         (every 6 hours)
```

## Lessons Learned / Gotchas
- **Stripe lazy init:** Must use `getStripe()` factory, NOT top-level `new Stripe()` — causes build failure when env vars aren't set at build time
- **Next.js 14 prerender:** Client pages using Supabase fail prerender without env vars — need `.env.local` with placeholder values for builds to pass
- **Next.js route file exports:** Route files can ONLY export HTTP method handlers (GET, POST, etc.). Exporting helper functions like `analyzeSpam` causes build errors ("Property is incompatible with index signature"). Solution: extract to a separate `src/lib/` file.
- **shadcn/ui CLI:** Use `npx shadcn@latest` (not `shadcn-ui` which is deprecated)
- **create-next-app naming:** Cannot use directory names with spaces/capitals — create in subdirectory then move files up
- **Stripe API version:** Must match installed SDK version exactly (was `2026-02-25.clover` for current stripe package)
- **Supabase SSR cookies:** Uses get/set/remove pattern — set/remove wrapped in try/catch for server components
- **Git auth:** When gh CLI has multiple accounts, may need `gh auth setup-git` to fix push permissions
- **Mac dev setup:** Homebrew and `gh` CLI installed on Mac (2026-03-16). `gh` lives at `/opt/homebrew/bin/gh` — shell may need restart or path update if `gh` isn't found
- **Stripe trial_end:** Stripe returns `trial_end` as a Unix timestamp (seconds) — must multiply by 1000 for JS Date constructor
- **ESLint unused vars in destructuring:** When stripping joined Supabase data (`{ businesses: _, ...rest }`), the `_` variable triggers lint error. Use `// eslint-disable-next-line` comment.

## User Preferences
- Prefers comprehensive, full builds over incremental
- GitHub accounts: VibeCodingVince (primary), VinceDaigle (secondary)
- Works across Windows (C:\GOOGLE REVIEW) and Mac
- Wants "end session" protocol: update CLAUDE.md → update shared-memory.md → commit & push

## Project Architecture Notes
- All API routes use try/catch + auth check via `supabase.auth.getUser()`
- Three Supabase clients: browser (client.ts), server (server.ts), admin (admin.ts)
- RLS enforces data isolation — reviews/alerts/tasks/posts accessed through business ownership
- Claude AI model used: `claude-sonnet-4-20250514` for all AI features
- Design system: DM Serif Display + Outfit fonts, dark green #1B4332 primary, premium/editorial style
- Skills files in `skills/` directory guide all UI and backend decisions
- Dashboard layout is a client component that fetches user data for trial banner + alert count
- Feature toggles are per-business (review_shield_enabled, radar_enabled, action_planner_enabled)
- Spam analysis is in `src/lib/spam-analysis.ts` (NOT in a route file — Next.js restriction)
