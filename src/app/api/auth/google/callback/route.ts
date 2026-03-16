import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");
    const state = searchParams.get("state"); // business_id
    const appUrl = process.env.NEXT_PUBLIC_APP_URL!;

    if (!code || !state) {
      return NextResponse.redirect(
        `${appUrl}/dashboard?error=missing_params`
      );
    }

    // Exchange code for tokens
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        redirect_uri: `${appUrl}/api/auth/google/callback`,
        grant_type: "authorization_code",
      }),
    });

    const tokens = await tokenResponse.json();

    if (!tokens.refresh_token) {
      return NextResponse.redirect(
        `${appUrl}/dashboard?error=no_refresh_token`
      );
    }

    // Get Google account info
    const accountResponse = await fetch(
      "https://mybusinessaccountmanagement.googleapis.com/v1/accounts",
      {
        headers: { Authorization: `Bearer ${tokens.access_token}` },
      }
    );
    const accountData = await accountResponse.json();
    const googleAccountId = accountData.accounts?.[0]?.name ?? null;

    // Update business with Google credentials
    const supabase = createClient();
    const { error } = await supabase
      .from("businesses")
      .update({
        google_refresh_token: tokens.refresh_token,
        google_account_id: googleAccountId,
      })
      .eq("id", state);

    if (error) {
      return NextResponse.redirect(
        `${appUrl}/dashboard?error=update_failed`
      );
    }

    return NextResponse.redirect(
      `${appUrl}/dashboard/${state}?connected=true`
    );
  } catch (error) {
    console.error("Google OAuth callback error:", error);
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?error=oauth_failed`
    );
  }
}
