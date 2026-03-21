# ReviewFlow — Shared Memory (Cross-Machine)

> **This file is the shared brain.** On any new machine or session, tell Claude: "read shared-memory.md" to restore full context.

---

## Current Status
- **Last updated:** 2026-03-21 (Mac session #1)
- **Phase:** All env vars configured, Stripe checkout tested, ready for deployment
- **Last session:** Google OAuth fully working, Stripe configured, pricing updated, hero redesigned
- **Repo:** https://github.com/VibeCodingVince/reviewflow
- **Build status:** Clean (`npm run build` passes)
- **Supabase project:** `https://vdkujkrurjqklkpofpmz.supabase.co` — all 7 tables, RLS, triggers, indexes live
- **Dev server:** Running on Mac at http://localhost:3000 (or 3001 if port conflict)
- **User account:** vincentdaigle91@gmail.com — signed up via Google OAuth, upgraded to Pro tier
- **Test business:** "Gadaxsym" (has Radar seed data), "Tim Horton" (no data)

### What was done this session (2026-03-21, Mac session #1)
1. **Google OAuth fully set up and tested:**
   - Created Google Cloud project "ReviewFlow"
   - Enabled Google+ API, configured consent screen, created OAuth credentials
   - Enabled Google provider in Supabase with Client ID/Secret
   - Added Google credentials to Mac `.env.local`
   - Ran migration 007 manually via Supabase SQL editor (script failed — no exec_sql RPC)
   - Tested Google OAuth signup — works correctly
2. **Ran Radar seed script** — seeded demo data for Gadaxsym business (30 days snapshots, 4 alerts, health score 74)
3. **Configured all env vars on Mac `.env.local`:**
   - Supabase URL, anon key, service role key
   - Google OAuth Client ID + Secret
   - Anthropic API key
   - Stripe publishable key, secret key, 3 price IDs
   - CRON_SECRET (auto-generated)
   - Only missing: STRIPE_WEBHOOK_SECRET (needs Vercel deployment)
4. **Updated pricing to $19/$49/$99** (was $29/$79/$149):
   - Researched competitors: budget tools $7-19/mo, mid-tier $49-99/mo, enterprise $249-449/mo
   - Updated Stripe products, landing page, and pricing page
5. **Redesigned hero headline** — "Never Miss" now has animated highlight-reveal, "Again" has gradient text with underline
6. **Renamed "Phone Calls" to "Call Clicks"** on Radar page (more accurate — tracks GBP listing taps, not actual calls)
7. **Added checkout success modal** — thank-you dialog on dashboard after Stripe checkout (`?checkout=success` param)
8. **Stripe checkout tested** — successfully redirects to Stripe and back

### Previous sessions
- 2026-03-21 (Windows): Fixed Google OAuth signup, created migration 007, updated Windows .env.local
- 2026-03-20 (session #2): Created Radar demo seed script
- 2026-03-20 (session #1): Created Supabase project, ran migrations 001-006

### What needs to be done next
**Immediate next steps:**
1. **Set up Stripe webhook** — create endpoint in Stripe dashboard pointing to Vercel URL once deployed, add `STRIPE_WEBHOOK_SECRET` to env
2. **Deploy to Vercel** — connect GitHub repo, add all env vars, configure cron jobs
3. **Configure Vercel cron jobs:**
   ```
   check-reviews:      0 */12 * * *       (every 12 hours)
   check-performance:  0 2 * * *          (daily 2 AM)
   generate-tasks:     0 6 * * 1          (weekly Monday 6 AM)
   publish-posts:      0 */12 * * *       (every 12 hours)
   ```
4. **Connect real Google Business Profile** — enable GBP API in Google Cloud Console, connect a real listing
5. **Test end-to-end flows** — add business, connect Google, pull reviews, generate AI replies, Pro features

**Polish items:**
- Frontend subscription gate UX — handle `FEATURE_REQUIRED` 403 responses (show upgrade prompt)
- CSV import validation improvements
- Duplicate `connectGoogle()` helper — extract to shared util
- Error boundaries on dashboard pages
- Loading state flash on trial banner
- Consider making cron frequency configurable per business tier

## Lessons Learned / Gotchas

### 2026-03-21 additions (Mac session)
- **Migration script needs dotenv:** `scripts/run-migration-007.ts` doesn't load `.env.local` automatically. Need `export $(grep -v '^#' .env.local | xargs)` prefix, OR run SQL manually in Supabase dashboard.
- **Supabase has no exec_sql RPC:** Can't execute raw SQL via Supabase client. For migrations, run SQL directly in Supabase SQL editor.
- **Radar seed data per-business:** Seed script creates data for "Gadaxsym" business, not all businesses. If user selects a different business in the dropdown, data appears empty.
- **GBP "Phone Calls" are actually call clicks:** Google's Performance API reports taps on the Call button, not actual phone calls. Renamed to "Call Clicks" for accuracy.
- **Pricing research:** Budget GBP tools: $7-19/mo. Mid-tier (NiceJob, GatherUp): $49-99/mo. Enterprise (Podium, Birdeye): $249-449/mo. Our $19/$49/$99 is competitive.
- **Claude API costs are minimal:** ~$0.05-0.10/day for 10 businesses. Margins on $19-99/mo subscriptions are excellent.

### Previous gotchas
- **Google OAuth metadata structure:** Google OAuth stores user name as `name` (not `full_name`) in Supabase `raw_user_meta_data`. Email signup uses `full_name`. Trigger must check both.
- **Supabase Google provider must be enabled:** Just having OAuth credentials isn't enough — must explicitly enable Google provider in Supabase dashboard (Authentication → Providers)
- **Auth callback verification:** After OAuth, always verify user record exists in `public.users` table (not just `auth.users`). Trigger can fail silently.
- **Windows port conflicts:** If port 3000 is in use, Next.js auto-switches to 3001. Always check console for actual port.
- **tsconfig includes scripts:** Next.js tsconfig includes `**/*.ts` which includes scripts directory. Must exclude scripts to prevent build errors on script files.
- **Stripe lazy init:** Must use `getStripe()` factory, NOT top-level `new Stripe()` — causes build failure when env vars aren't set at build time
- **Next.js 14 prerender:** Client pages using Supabase fail prerender without env vars — need `.env.local` with placeholder values for builds to pass
- **Next.js route file exports:** Route files can ONLY export HTTP method handlers (GET, POST, etc.). Exporting helper functions causes build errors. Solution: extract to a separate `src/lib/` file.
- **shadcn/ui CLI:** Use `npx shadcn@latest` (not `shadcn-ui` which is deprecated)
- **Stripe API version:** Must match installed SDK version exactly
- **Supabase SSR cookies:** Uses get/set/remove pattern — set/remove wrapped in try/catch for server components
- **Git auth:** When gh CLI has multiple accounts, may need `gh auth setup-git` to fix push permissions
- **Mac dev setup:** Homebrew and `gh` CLI installed on Mac (2026-03-16). `gh` lives at `/opt/homebrew/bin/gh`
- **Stripe trial_end:** Stripe returns `trial_end` as a Unix timestamp (seconds) — must multiply by 1000 for JS Date constructor
- **ESLint unused vars in destructuring:** When stripping joined Supabase data (`{ businesses: _, ...rest }`), the `_` variable triggers lint error. Use `// eslint-disable-next-line` comment.

## User Preferences
- Prefers comprehensive, full builds over incremental
- GitHub accounts: VibeCodingVince (primary), VinceDaigle (secondary)
- Works across Windows (C:\GOOGLE REVIEW) and Mac
- Wants "end session" protocol: update CLAUDE.md → update shared-memory.md → commit & push
- Girlfriend provides UX feedback (e.g. hero headline visibility)
- Cost-conscious — prefers lower pricing to undercut competitors, aware of API costs

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
- Checkout success redirects to `/dashboard?checkout=success` — shows thank-you modal
