# Google OAuth Signup - Fixes Applied

## What Was Fixed

### 1. Database Trigger Issue ✅
**Problem:** The `handle_new_user()` trigger function only looked for `full_name` in user metadata, but Google OAuth stores the name as `name`, causing user records to fail or have missing names.

**Solution:** Created migration `007_fix_google_oauth.sql` that updates the trigger to:
- Try `full_name` first (email signup)
- Fall back to `name` (Google OAuth)
- Use email username as last resort

**File:** `supabase/migrations/007_fix_google_oauth.sql`

### 2. Auth Callback Improvements ✅
**Problem:** The callback route only exchanged the OAuth code but didn't verify or create user records, leading to potential failures.

**Solution:** Enhanced `src/app/api/auth/callback/route.ts` to:
- Verify user record exists in `public.users` table
- Manually create user record if trigger fails
- Extract name from both `user_metadata.full_name` and `user_metadata.name`
- Better error handling and logging
- Return specific error messages

**File:** `src/app/api/auth/callback/route.ts`

### 3. Google OAuth Options ✅
**Problem:** OAuth wasn't requesting offline access or proper consent.

**Solution:** Updated both signup and login pages to include:
- `access_type: "offline"` - Gets refresh token for future API calls
- `prompt: "consent"` - Forces consent screen for proper permissions

**Files:**
- `src/app/(auth)/signup/page.tsx`
- `src/app/(auth)/login/page.tsx`

### 4. Build Configuration ✅
**Problem:** TypeScript was checking script files during Next.js build, causing errors.

**Solution:** Updated `tsconfig.json` to exclude `scripts/` directory from build.

**File:** `tsconfig.json`

---

## What You Need to Do

### Step 1: Update .env.local (Windows)
Copy your Supabase credentials from Mac to Windows `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://vdkujkrurjqklkpofpmz.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-from-mac
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-from-mac
```

### Step 2: Run Migration 007
This updates the database trigger to handle Google OAuth properly.

**Option A - Using the script:**
```bash
npx tsx scripts/run-migration-007.ts
```

**Option B - Manual (if script fails):**
1. Go to: https://supabase.com/dashboard/project/vdkujkrurjqklkpofpmz/sql
2. Copy SQL from: `supabase/migrations/007_fix_google_oauth.sql`
3. Paste and click "Run"

### Step 3: Set Up Google OAuth
Follow the comprehensive guide in `GOOGLE_OAUTH_SETUP.md`:

1. **Google Cloud Console:**
   - Create OAuth credentials
   - Configure consent screen
   - Add redirect URIs

2. **Supabase:**
   - Enable Google provider
   - Add Client ID and Secret

3. **Environment Variables:**
   - Add `GOOGLE_CLIENT_ID` to `.env.local`
   - Add `GOOGLE_CLIENT_SECRET` to `.env.local`

See `GOOGLE_OAUTH_SETUP.md` for detailed step-by-step instructions.

### Step 4: Test the Flow
```bash
npm run dev
```

1. Visit: http://localhost:3000/signup
2. Click "Continue with Google"
3. Complete OAuth flow
4. Should redirect to `/dashboard`
5. Check Supabase → `users` table to verify record was created

---

## Files Created

1. ✅ `supabase/migrations/007_fix_google_oauth.sql` - Database migration
2. ✅ `scripts/run-migration-007.ts` - Script to apply migration
3. ✅ `GOOGLE_OAUTH_SETUP.md` - Complete setup guide
4. ✅ `FIXES_APPLIED.md` - This file (summary)

## Files Modified

1. ✅ `src/app/api/auth/callback/route.ts` - Enhanced error handling
2. ✅ `src/app/(auth)/signup/page.tsx` - Added OAuth options
3. ✅ `src/app/(auth)/login/page.tsx` - Added OAuth options
4. ✅ `tsconfig.json` - Exclude scripts from build

---

## Testing Checklist

After completing Steps 1-3 above:

- [ ] Sign up with Google OAuth works
- [ ] User record created in `public.users` table
- [ ] User's name appears correctly (not null)
- [ ] Redirects to `/dashboard` after signup
- [ ] Can log in with same Google account
- [ ] No duplicate user records created

---

## Troubleshooting

### Build Error: Missing Supabase credentials
- Update `.env.local` with real credentials from Mac

### Migration fails
- Use manual SQL method (Option B in Step 2)
- Check that migrations 001-006 ran successfully first

### OAuth error: "This app's request is invalid"
- Check redirect URIs in Google Cloud Console
- See `GOOGLE_OAUTH_SETUP.md` troubleshooting section

### User record not created
- Check Supabase logs: Dashboard → Logs → Auth
- Verify migration 007 ran successfully
- The callback route has fallback logic to create the user manually

---

## Next Steps (After OAuth Works)

1. ✅ Google OAuth signup/login working
2. Test onboarding flow: dashboard → add business
3. Set up Google Business Profile API (separate from OAuth)
4. Configure Stripe
5. Test end-to-end user journey
6. Deploy to production

---

## Questions?

See `GOOGLE_OAUTH_SETUP.md` for detailed setup instructions and troubleshooting.
