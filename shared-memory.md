# ReviewFlow — Shared Memory (Cross-Machine)

> **This file is the shared brain.** On any new machine or session, tell Claude: "read shared-memory.md" to restore full context.

---

## Current Status
- **Last updated:** 2026-03-16 (Windows session)
- **Phase:** Initial build complete. All 5 phases done. Project compiles and builds successfully.
- **Last session:** Built entire project from scratch — skills, project setup, database schema, 11 API routes, 7 frontend pages, polish. Pushed to GitHub. Set up "end session" protocol and shared-memory.md for cross-machine sync.
- **Repo:** https://github.com/VibeCodingVince/reviewflow
- **Build status:** Clean — `npm run build` passes with no errors

## What's Next
- Set up real Supabase project and fill in `.env.local` with real credentials
- Set up Stripe products/prices and fill in price IDs
- Set up Google Cloud project with Business Profile API + OAuth credentials
- Set up Anthropic API key
- Run the Supabase migration (`supabase/migrations/001_initial_schema.sql`)
- Test end-to-end flow: signup → add business → connect Google → pull reviews → generate replies → post
- Deploy to Vercel

## Lessons Learned / Gotchas
- **Stripe lazy init:** Must use `getStripe()` factory, NOT top-level `new Stripe()` — causes build failure when env vars aren't set at build time
- **Next.js 14 prerender:** Client pages using Supabase fail prerender without env vars — need `.env.local` with placeholder values for builds to pass
- **shadcn/ui CLI:** Use `npx shadcn@latest` (not `shadcn-ui` which is deprecated)
- **create-next-app naming:** Cannot use directory names with spaces/capitals — create in subdirectory then move files up
- **Stripe API version:** Must match installed SDK version exactly (was `2026-02-25.clover` for current stripe package)
- **Supabase SSR cookies:** Uses get/set/remove pattern — set/remove wrapped in try/catch for server components
- **Git auth:** When gh CLI has multiple accounts, may need `gh auth setup-git` to fix push permissions

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
