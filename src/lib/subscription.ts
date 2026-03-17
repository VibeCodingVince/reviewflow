import { SupabaseClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { User } from "@/lib/types";

export function isSubscriptionActive(user: User): boolean {
  if (
    user.subscription_status === "active" ||
    user.subscription_status === "free"
  ) {
    return true;
  }

  if (user.trial_end && new Date(user.trial_end) > new Date()) {
    return true;
  }

  return false;
}

export async function requireActiveSubscription(
  supabase: SupabaseClient,
  userId: string
): Promise<{ user: User } | { error: NextResponse }> {
  const { data: dbUser, error } = await supabase
    .from("users")
    .select("*")
    .eq("id", userId)
    .single();

  if (error || !dbUser) {
    return {
      error: NextResponse.json(
        { error: "User not found", code: "USER_NOT_FOUND" },
        { status: 404 }
      ),
    };
  }

  if (!isSubscriptionActive(dbUser as User)) {
    return {
      error: NextResponse.json(
        { error: "Subscription required", code: "SUBSCRIPTION_REQUIRED" },
        { status: 403 }
      ),
    };
  }

  return { user: dbUser as User };
}
