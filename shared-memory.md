# ReviewFlow — Shared Memory (Cross-Machine)

> **This file is the shared brain.** On any new machine or session, tell Claude: "read shared-memory.md" to restore full context.

---

## Current Status
- **Last updated:** 2026-03-21 (Mac session #2)
- **Phase:** Lead magnet built, ready for deployment
- **Last session:** Built free GBP Health Score Audit lead magnet page at `/audit`
- **Repo:** https://github.com/VibeCodingVince/reviewflow
- **Build status:** Clean (`npm run build` passes)
- **Supabase project:** `https://vdkujkrurjqklkpofpmz.supabase.co` — all 7 tables, RLS, triggers, indexes live
- **Dev server:** Running on Mac at http://localhost:3000 (or 3001 if port conflict)
- **User account:** vincentdaigle91@gmail.com — signed up via Google OAuth, upgraded to Pro tier
- **Test business:** "Gadaxsym" (has Radar seed data), "Tim Horton" (no data)

### What was done this session (2026-03-21, Mac session #2)
1. **Built Free GBP Health Score Audit lead magnet** (`/audit`):
   - Public page — no auth required. 4-state flow: search → loading → preview → full report
   - Uses Google Places API (New) to look up businesses and score them on 5 categories (rating, review volume, photos, profile completeness, engagement) → 0-100 score with A-F grade
   - Email-gated: preview shows score + mini category cards, full report unlocks after email with AI summary, quick wins, benchmark comparisons, detailed recommendations per category
   - SVG animated score gauge, stagger animations, blur gate pattern
   - Leads stored in new `leads` table via admin client
   - API routes: `/api/audit/search` (Places proxy with rate limiting), `/api/audit/score` (details + scoring), `/api/audit/capture` (email capture)
2. **Created `skills/lead-magnet/SKILL.md`** — reusable skill for building high-converting lead magnet pages (4-state flow, blur gate, score gauge, conversion psychology)
3. **Migration 008 (leads table)** — run on live Supabase
4. **Added Google Places API key** to `.env.local` — enabled Places API (New) in Google Cloud Console
5. **Landing page integration** — added "Free Audit" nav link + CTA section on landing page and pricing page
6. **Fixed dropdown z-index bug** — `animate-fade-in` creates stacking contexts, needed `z-10` on parent wrapper

### Previous sessions (2026-03-21, Mac session #1)
- Google OAuth fully set up and tested
- Radar seed script run, env vars configured
- Pricing updated to $19/$49/$99, hero redesigned
- Checkout success modal added, Stripe checkout tested

### Previous sessions
- 2026-03-21 (Windows): Fixed Google OAuth signup, created migration 007, updated Windows .env.local
- 2026-03-20 (session #2): Created Radar demo seed script
- 2026-03-20 (session #1): Created Supabase project, ran migrations 001-006

### What needs to be done next
**Immediate next steps:**
1. **Test audit page end-to-end** — search, score, email capture, verify lead in Supabase
2. **Set up Stripe webhook** — create endpoint in Stripe dashboard pointing to Vercel URL once deployed, add `STRIPE_WEBHOOK_SECRET` to env
3. **Deploy to Vercel** — connect GitHub repo, add all env vars (including `GOOGLE_PLACES_API_KEY`), configure cron jobs
4. **Configure Vercel cron jobs:**
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

### 2026-03-21 additions (Mac session #2)
- **CSS stacking context + animations:** `animate-fade-in` (opacity + transform) creates isolated stacking contexts on each animated element. `z-index` on a child only works within its parent's stacking context. Fix: add `z-index` to the parent container so it elevates the entire stacking context above siblings.
- **Google Places API (New) must be explicitly enabled:** Just having an API key isn't enough — must enable "Places API (New)" in Google Cloud Console for the project. Error is a 403 `SERVICE_DISABLED`.
- **Places API costs:** ~$0.05 per audit (1 search + 1 details). At 1000 audits/month ≈ $52/month.
- **Leads table uses admin client:** No RLS user policies on `leads` table — only accessed server-side via `createAdminClient()` (same pattern as cron jobs).

### 2026-03-21 additions (Mac session #1)
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
