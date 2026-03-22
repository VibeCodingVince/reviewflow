"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  LayoutDashboard,
  Settings,
  LogOut,
  CreditCard,
  Clock,
  AlertTriangle,
  Activity,
  CalendarCheck,
  Bell,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { User } from "@/lib/types";
import { Logo } from "@/components/logo";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/radar", label: "Radar", icon: Activity, pro: true },
  { href: "/planner", label: "Planner", icon: CalendarCheck, pro: true },
  { href: "/settings", label: "Settings", icon: Settings },
  { href: "/pricing", label: "Pricing", icon: CreditCard },
];

function getTrialDaysLeft(trialEnd: string): number {
  const now = new Date();
  const end = new Date(trialEnd);
  const diff = end.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function TrialBanner({ user }: { user: User }) {
  if (!user.trial_end) return null;

  const daysLeft = getTrialDaysLeft(user.trial_end);
  const isExpired = daysLeft <= 0 && user.subscription_status !== "active";
  const isUrgent = daysLeft <= 3 && daysLeft > 0;

  // Don't show banner if trial_end exists but user has a paid (non-trial) subscription
  if (daysLeft <= 0 && user.subscription_status === "active") return null;

  if (isExpired) {
    return (
      <div className="bg-red-50 border-b border-red-200">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0" />
            <p className="text-sm font-body text-red-800">
              Your free trial has ended. Subscribe to continue using RankClerk.
            </p>
          </div>
          <Link href="/pricing">
            <Button
              size="sm"
              className="h-8 px-4 rounded-lg bg-primary text-white font-body text-xs hover:bg-primary/90"
            >
              Subscribe to continue
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  if (isUrgent) {
    return (
      <div className="bg-amber-50 border-b border-amber-200">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-600 flex-shrink-0" />
            <p className="text-sm font-body text-amber-800">
              Your free trial ends in{" "}
              <span className="font-semibold">
                {daysLeft} {daysLeft === 1 ? "day" : "days"}
              </span>
              . Upgrade to keep your auto-replies running.
            </p>
          </div>
          <Link href="/pricing">
            <Button
              size="sm"
              className="h-8 px-4 rounded-lg bg-primary text-white font-body text-xs hover:bg-primary/90"
            >
              Upgrade now
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // > 3 days left — subtle info banner
  return (
    <div className="bg-emerald-50/60 border-b border-emerald-100">
      <div className="max-w-7xl mx-auto px-6 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <p className="text-sm font-body text-emerald-800">
            You have{" "}
            <span className="font-semibold">
              {daysLeft} {daysLeft === 1 ? "day" : "days"}
            </span>{" "}
            left in your free trial.
          </p>
        </div>
        <Link
          href="/pricing"
          className="text-sm font-body font-medium text-primary hover:underline"
        >
          Upgrade
        </Link>
      </div>
    </div>
  );
}

export function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const supabase = createClient();
  const [user, setUser] = useState<User | null>(null);
  const [unreadAlerts, setUnreadAlerts] = useState(0);

  const fetchUser = useCallback(async () => {
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();
    if (authUser) {
      const { data } = await supabase
        .from("users")
        .select("*")
        .eq("id", authUser.id)
        .single();
      if (data) setUser(data);
    }
  }, [supabase]);

  const fetchUnreadAlerts = useCallback(async () => {
    if (!user || user.subscription_tier !== "pro") return;

    try {
      const res = await fetch("/api/alerts?unread=true");
      if (res.ok) {
        const data = await res.json();
        setUnreadAlerts((data.alerts || []).filter((a: { is_read: boolean }) => !a.is_read).length);
      }
    } catch {
      // silently ignore
    }
  }, [user]);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  useEffect(() => {
    fetchUnreadAlerts();
  }, [fetchUnreadAlerts]);

  async function handleSignOut() {
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  const isPro = user?.subscription_tier === "pro";

  return (
    <div className="min-h-screen bg-gray-50/50">
      {/* Top bar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-xl border-b border-gray-100/80 h-16">
        <div className="max-w-7xl mx-auto px-6 h-full flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <Logo />
          </Link>

          <div className="flex items-center gap-1">
            {navItems.map((item) => {
              // Hide pro-only nav items for non-pro users (still show but greyed)
              const isProItem = "pro" in item && item.pro;

              return (
                <Link key={item.href} href={isProItem && !isPro ? "/pricing" : item.href}>
                  <Button
                    variant="ghost"
                    className={cn(
                      "h-9 px-4 rounded-lg font-body text-sm",
                      pathname === item.href || pathname.startsWith(item.href + "/")
                        ? "bg-primary/5 text-primary"
                        : isProItem && !isPro
                          ? "text-muted-foreground/50 hover:text-muted-foreground"
                          : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <item.icon className="w-4 h-4 mr-2" />
                    {item.label}
                    {isProItem && !isPro && (
                      <span className="ml-1.5 text-[9px] font-semibold uppercase tracking-wider bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">
                        Pro
                      </span>
                    )}
                  </Button>
                </Link>
              );
            })}

            {/* Alert bell for Pro users */}
            {isPro && (
              <Link href="/radar">
                <Button
                  variant="ghost"
                  className="h-9 w-9 p-0 rounded-lg relative"
                >
                  <Bell className="w-4 h-4 text-muted-foreground" />
                  {unreadAlerts > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                      {unreadAlerts > 9 ? "9+" : unreadAlerts}
                    </span>
                  )}
                </Button>
              </Link>
            )}

            <Button
              variant="ghost"
              className="h-9 px-4 rounded-lg font-body text-sm text-muted-foreground hover:text-foreground"
              onClick={handleSignOut}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </nav>

      {/* Trial banner */}
      <div className="pt-16">
        {user && <TrialBanner user={user} />}
      </div>

      {/* Content */}
      <main className="pb-12 max-w-7xl mx-auto px-6 pt-8">{children}</main>
    </div>
  );
}
