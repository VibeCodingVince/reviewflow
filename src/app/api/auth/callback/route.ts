import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error("Auth callback error:", error);
      return NextResponse.redirect(`${origin}/login?error=auth_failed`);
    }

    if (data.user) {
      // Ensure user record exists in public.users table
      // The trigger should handle this, but we verify it exists
      const { error: userError } = await supabase
        .from("users")
        .select("id")
        .eq("id", data.user.id)
        .single();

      if (userError && userError.code === "PGRST116") {
        // User record doesn't exist, create it manually (trigger might have failed)
        const fullName =
          data.user.user_metadata?.full_name ||
          data.user.user_metadata?.name ||
          data.user.email?.split("@")[0] ||
          "User";

        const { error: insertError } = await supabase.from("users").insert({
          id: data.user.id,
          email: data.user.email!,
          full_name: fullName,
        });

        if (insertError) {
          console.error("Failed to create user record:", insertError);
          return NextResponse.redirect(
            `${origin}/login?error=user_creation_failed`
          );
        }
      } else if (userError) {
        console.error("Error checking user record:", userError);
      }

      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_failed`);
}
