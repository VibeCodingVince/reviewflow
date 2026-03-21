# ReviewFlow — Shared Memory (Cross-Machine)

> **This file is the shared brain.** On any new machine or session, tell Claude: "read shared-memory.md" to restore full context.

---

## Current Status
- **Last updated:** 2026-03-20 (Mac session)
- **Phase:** Database provisioned, env vars partially configured — approaching deploy-ready
- **Last session:** Created Supabase project, ran all 6 migrations, configured `.env.local` with Supabase credentials
- **Repo:** https://github.com/VibeCodingVince/reviewflow
- **Build status:** Clean (`npm run build` passes)
- **Supabase project:** `https://vdkujkrurjqklkpofpmz.supabase.co` — all 7 tables, RLS, triggers, indexes live

### What was done this session (2026-03-20)
1. **Created Supabase project** — brand new project provisioned
2. **Ran all 6 migrations** (001–006) via SQL Editor — database fully set up:
   - 7 tables: users, businesses, reviews, performance_snapshots, alerts, optimization_tasks, gbp_posts
   - All RLS policies, indexes, triggers (handle_new_user, update_updated_at)
   - Pro tier constraint on subscription_tier
3. **Configured `.env.local`** with Supabase URL, anon key, and service role key

### What needs to be done next
**Before going live (priority order):**
1. ~~Run migrations on Supabase~~ — DONE
2. **Add remaining env vars to `.env.local`:** Stripe keys (secret, webhook, publishable, price IDs for single/multi/pro), Anthropic API key, Google OAuth client ID/secret, CRON_SECRET
3. **Create Stripe products/prices** — Single ($29), Multi ($79), Pro ($149) in Stripe dashboard
4. **Set up Google OAuth** — configure consent screen + credentials in Google Cloud Console
5. **Set up Vercel cron config** for new cron jobs (check-performance daily 2AM, generate-tasks weekly Monday 6AM, publish-posts every 6h)
6. **Test end-to-end flows** — signup, add business, connect Google, pull reviews, generate replies, Pro features
7. **Frontend subscription gate UX** — Handle `FEATURE_REQUIRED` 403 responses in the UI (show upgrade prompt)
8. **Deploy to Vercel**

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
