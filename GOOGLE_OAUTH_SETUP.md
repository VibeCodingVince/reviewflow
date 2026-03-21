# Google OAuth Setup Guide

## Overview
This guide walks you through setting up Google OAuth for ReviewFlow authentication.

## Prerequisites
- Supabase project created and configured
- Google Cloud Console access

---

## Part 1: Google Cloud Console Setup

### 1. Create a Google Cloud Project (if you don't have one)
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click "Select a project" → "New Project"
3. Name: `ReviewFlow` (or your preferred name)
4. Click "Create"

### 2. Enable Google+ API (required for OAuth)
1. In your project, go to "APIs & Services" → "Library"
2. Search for "Google+ API"
3. Click on it and click "Enable"

### 3. Configure OAuth Consent Screen
1. Go to "APIs & Services" → "OAuth consent screen"
2. Choose "External" (unless you have a Google Workspace)
3. Click "Create"

**App Information:**
- App name: `ReviewFlow`
- User support email: Your email
- App logo: (optional)

**App domain:**
- Application home page: `http://localhost:3000` (for dev)
- Application privacy policy: (optional for dev)
- Application terms of service: (optional for dev)

**Authorized domains:**
- Add: `localhost` (for development)
- Add your production domain later (e.g., `reviewflow.com`)

**Developer contact information:**
- Add your email

Click "Save and Continue"

**Scopes:**
- Click "Add or Remove Scopes"
- Add these scopes:
  - `.../auth/userinfo.email` (See your email address)
  - `.../auth/userinfo.profile` (See your personal info)
- Click "Update" then "Save and Continue"

**Test users (while in development):**
- Click "Add Users"
- Add your Google email addresses (you and any testers)
- Click "Save and Continue"

Click "Back to Dashboard"

### 4. Create OAuth Credentials
1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "OAuth client ID"
3. Application type: "Web application"
4. Name: `ReviewFlow Web Client`

**Authorized JavaScript origins:**
- `http://localhost:3000` (for dev)
- Add production URL later (e.g., `https://reviewflow.com`)

**Authorized redirect URIs:**
- `http://localhost:3000/api/auth/callback`
- `https://vdkujkrurjqklkpofpmz.supabase.co/auth/v1/callback` (your Supabase project)

For production, add:
- `https://your-domain.com/api/auth/callback`
- `https://vdkujkrurjqklkpofpmz.supabase.co/auth/v1/callback`

5. Click "Create"
6. **Copy the Client ID and Client Secret** (you'll need these next)

---

## Part 2: Supabase Configuration

### 1. Enable Google Provider in Supabase
1. Go to your Supabase project: https://supabase.com/dashboard/project/vdkujkrurjqklkpofpmz
2. Navigate to: "Authentication" → "Providers"
3. Find "Google" in the list
4. Toggle it to **Enabled**

**Configure the provider:**
- Client ID: Paste the Client ID from Google Cloud Console
- Client Secret: Paste the Client Secret from Google Cloud Console
- Authorized Client IDs: (leave empty for now)
- Skip nonce check: Leave unchecked

5. Click "Save"

### 2. Configure Redirect URLs (if not already done)
1. Still in "Authentication" settings
2. Go to "URL Configuration"
3. Under "Redirect URLs", add:
   - `http://localhost:3000/api/auth/callback`
   - Add production URL later

---

## Part 3: Environment Variables

### Update `.env.local` on Windows
Add the Google OAuth credentials:

```bash
# Google OAuth
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
```

### Update `.env.local` on Mac (if using)
Same as above - add to your Mac's `.env.local` too.

---

## Part 4: Run Database Migration

The migration fixes the user creation trigger to properly handle Google OAuth metadata.

### Option A: Using the Script
```bash
npx tsx scripts/run-migration-007.ts
```

### Option B: Manual SQL (if script fails)
1. Go to: https://supabase.com/dashboard/project/vdkujkrurjqklkpofpmz/sql
2. Open: `supabase/migrations/007_fix_google_oauth.sql`
3. Copy the entire SQL content
4. Paste into Supabase SQL editor
5. Click "Run"

---

## Part 5: Test the OAuth Flow

### Start the Dev Server
```bash
npm run dev
```

### Test Signup
1. Go to: http://localhost:3000/signup
2. Click "Continue with Google"
3. Select a Google account
4. Grant permissions
5. You should be redirected to `/dashboard`

### Verify User Record
1. Go to Supabase Dashboard → Table Editor → `users`
2. You should see your user record with:
   - `id`: Your auth user ID
   - `email`: Your Google email
   - `full_name`: Your name from Google (or email username)
   - `subscription_status`: `free`

---

## Troubleshooting

### Error: "Access blocked: This app's request is invalid"
- Check that you added `http://localhost:3000` to Authorized JavaScript origins
- Check that you added the Supabase callback URL to Authorized redirect URIs

### Error: "This app is blocked"
- Your OAuth consent screen is not verified
- For development: Add your email to "Test users" in the consent screen
- For production: Submit app for verification

### Error: "User creation failed"
- Run migration 007 if you haven't already
- Check that the trigger exists: Go to Supabase Dashboard → Database → Functions
- Look for `handle_new_user` function

### User record not created in `public.users` table
- Check auth.users table - if the user exists there but not in public.users:
- Run migration 007 to fix the trigger
- Or manually create the user record in the callback (the updated callback.ts does this)

### Redirect loop or callback error
- Verify the redirect URL in both Google Console and Supabase matches exactly
- Check browser console for errors
- Check Supabase logs: Dashboard → Logs → Auth logs

---

## Production Checklist

When deploying to production:

1. **Update Google Cloud Console:**
   - Add production domain to Authorized JavaScript origins
   - Add production callback URL to Authorized redirect URIs
   - Update OAuth consent screen with production URLs

2. **Update Supabase:**
   - Add production redirect URL to allowed URLs

3. **Environment Variables:**
   - Add Google OAuth credentials to Vercel/production env vars
   - Ensure `NEXT_PUBLIC_APP_URL` is set to production domain

4. **OAuth Consent Screen:**
   - Consider submitting for verification (required for >100 users)
   - Or keep in "Testing" mode with specific test users

5. **Test thoroughly:**
   - Test signup with Google
   - Test login with Google
   - Verify user records are created correctly
   - Check that all metadata is populated

---

## Next Steps

After Google OAuth is working:

1. Test the complete signup → onboarding → add business flow
2. Set up Google Business Profile API credentials (separate from OAuth)
3. Configure Stripe for payments
4. Test the full user journey
