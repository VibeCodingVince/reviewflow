# ReviewFlow — Shared Memory (Cross-Machine)

> **This file is the shared brain.** On any new machine or session, tell Claude: "read shared-memory.md" to restore full context.

---

## Current Status
- **Last updated:** 2026-03-21 (Windows session #1)
- **Phase:** Google OAuth signup flow fixed, ready to configure Google Cloud Console
- **Last session:** Fixed Google OAuth signup, updated Windows .env.local with Supabase credentials
- **Repo:** https://github.com/VibeCodingVince/reviewflow
- **Build status:** Clean (`npm run build` passes)
- **Supabase project:** `https://vdkujkrurjqklkpofpmz.supabase.co` — all 7 tables, RLS, triggers, indexes live
- **Dev server:** Running on Windows at http://localhost:3001

### What was done this session (2026-03-21, Windows session #1)
1. **Fixed Google OAuth signup flow** — 3 major fixes:
   - Created migration 007 (`007_fix_google_oauth.sql`) to fix `handle_new_user()` trigger
     - Now extracts name from Google OAuth metadata (`name` field)
     - Falls back to email username if no name provided
   - Enhanced auth callback route with user record verification and fallback creation
   - Updated signup/login pages with proper OAuth options (`access_type: offline`, `prompt: consent`)
2. **Updated Windows .env.local** with real Supabase credentials (URL, anon key, service role key)
3. **Created comprehensive documentation:**
   - `GOOGLE_OAUTH_SETUP.md` - Step-by-step Google OAuth setup guide
   - `FIXES_APPLIED.md` - Summary of fixes and testing checklist
   - `scripts/run-migration-007.ts` - Script to run migration 007
4. **Fixed build issues** - Excluded `scripts/` from tsconfig to prevent TypeScript errors
5. **Tested signup flow** - Got error: "provider is not enabled" - need to enable Google in Supabase

**Stopped at:** Need to create Google OAuth credentials in Google Cloud Console and enable Google provider in Supabase

### Previous session (2026-03-20, session #2)
1. **Created Radar demo seed script** at `scripts/seed-radar-demo.ts`
   - Run with: `npx tsx scripts/seed-radar-demo.ts`
   - Requires a user account to exist first (sign up at /login)
   - Seeds: upgrades user to Pro, creates/configures business, 30 days of performance snapshots (with realistic dip story), 4 alerts (1 critical, 2 warning, 1 info)
   - After seeding, visit `/radar` to see the Early-Warning Radar demo
2. **No user account exists yet** — need to sign up before running seed script

### Previous session (2026-03-20, session #1)
1. Created Supabase project, ran all 6 migrations, configured `.env.local` with Supabase credentials

### What needs to be done next
**Immediate next steps (continue from where we stopped):**
1. **Set up Google OAuth in Google Cloud Console:**
   - Go to https://console.cloud.google.com/apis/credentials
   - Create OAuth client ID (or use existing)
   - Configure consent screen
   - Add redirect URIs:
     - `http://localhost:3001/api/auth/callback`
     - `https://vdkujkrurjqklkpofpmz.supabase.co/auth/v1/callback`
   - Copy Client ID and Client Secret
   - See `GOOGLE_OAUTH_SETUP.md` for detailed steps

2. **Enable Google provider in Supabase:**
   - Go to https://supabase.com/dashboard/project/vdkujkrurjqklkpofpmz/auth/providers
   - Enable Google provider
   - Paste Client ID and Client Secret
   - Save

3. **Add Google credentials to Windows `.env.local`:**
   - `GOOGLE_CLIENT_ID=...`
   - `GOOGLE_CLIENT_SECRET=...`

4. **Run migration 007:**
   - `npx tsx scripts/run-migration-007.ts`

5. **Test Google OAuth signup:**
   - Visit http://localhost:3001/signup
   - Click "Continue with Google"
   - Complete OAuth flow
   - Verify user record created in Supabase

**After Google OAuth works:**
1. **Sign up** and create first user account
2. **Run seed script:** `npx tsx scripts/seed-radar-demo.ts` — seeds Radar demo data
3. **Visit /radar** to see the Early-Warning Radar demo

**Before going live (priority order):**
1. ~~Run migrations 001-006 on Supabase~~ — DONE
2. ~~Fix Google OAuth signup~~ — DONE (migration 007 created)
3. ~~Configure Windows .env.local with Supabase~~ — DONE
4. **Complete Google OAuth setup** — IN PROGRESS
5. **Add remaining env vars to `.env.local`:** Stripe keys, Anthropic API key, CRON_SECRET
6. **Create Stripe products/prices** — Single ($29), Multi ($79), Pro ($149) in Stripe dashboard
7. **Set up Vercel cron config** for new cron jobs (check-performance daily 2AM, generate-tasks weekly Monday 6AM, publish-posts every 6h)
8. **Test end-to-end flows** — signup, add business, connect Google, pull reviews, generate replies, Pro features
9. **Frontend subscription gate UX** — Handle `FEATURE_REQUIRED` 403 responses in the UI (show upgrade prompt)
10. **Deploy to Vercel**

**Polish items:**
9. CSV import validation improvements
10. Duplicate `connectGoogle()` helper — extract to shared util
11. Error boundaries on dashboard pages
12. Loading state flash on trial banner

### New cron schedule to configure
```
check-reviews:      */30 * * * *        (every 30 min — existing)
check-performance:  0 2 * * *           (daily 2 AM)
generate-tasks:     0 6 * * 1           (weekly Monday 6 AM)
publish-posts:      0 */6 * * *         (every 6 hours)
```

## Lessons Learned / Gotchas (2026-03-21 additions)
- **Google OAuth metadata structure:** Google OAuth stores user name as `name` (not `full_name`) in Supabase `raw_user_meta_data`. Email signup uses `full_name`. Trigger must check both.
- **Supabase Google provider must be enabled:** Just having OAuth credentials isn't enough - must explicitly enable Google provider in Supabase dashboard (Authentication → Providers)
- **Auth callback verification:** After OAuth, always verify user record exists in `public.users` table (not just `auth.users`). Trigger can fail silently.
- **Windows port conflicts:** If port 3000 is in use, Next.js auto-switches to 3001. Always check console for actual port.
- **tsconfig includes scripts:** Next.js tsconfig includes `**/*.ts` which includes scripts directory. Must exclude scripts to prevent build errors on script files.

## Previous Lessons Learned / Gotchas
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
