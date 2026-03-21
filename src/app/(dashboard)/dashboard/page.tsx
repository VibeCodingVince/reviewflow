"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  Plus,
  Star,
  MessageSquare,
  Clock,
  TrendingUp,
  ExternalLink,
  Loader2,
  Circle,
  RefreshCw,
  Sparkles,
  AlertCircle,
  CheckCircle,
  Heart,
} from "lucide-react";
import type { Business } from "@/lib/types";

interface DashboardStats {
  totalReviews: number;
  repliedReviews: number;
  pendingReviews: number;
  avgRating: number;
}

interface BusinessWithStats extends Business {
  reviews: { id: string; rating: number; reply_status: string }[];
}

export default function DashboardPage() {
  const [businesses, setBusinesses] = useState<BusinessWithStats[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalReviews: 0,
    repliedReviews: 0,
    pendingReviews: 0,
    avgRating: 0,
  });
  const [loading, setLoading] = useState(true);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [newBusiness, setNewBusiness] = useState({
    business_name: "",
    business_type: "",
    tone: "friendly",
  });
  const [saving, setSaving] = useState(false);
  const [showCheckoutSuccess, setShowCheckoutSuccess] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();
  const { toast } = useToast();

  useEffect(() => {
    if (searchParams.get("checkout") === "success") {
      setShowCheckoutSuccess(true);
      window.history.replaceState({}, "", "/dashboard");
    }
  }, [searchParams]);

  const fetchData = useCallback(async () => {
    const { data: bizData } = await supabase
      .from("businesses")
      .select("*, reviews(id, rating, reply_status)")
      .order("created_at", { ascending: false });

    if (bizData) {
      setBusinesses(bizData as BusinessWithStats[]);

      const allReviews = bizData.flatMap((b: BusinessWithStats) => b.reviews || []);
      const totalReviews = allReviews.length;
      const repliedReviews = allReviews.filter(
        (r: { reply_status: string }) => r.reply_status === "posted"
      ).length;
      const pendingReviews = allReviews.filter(
        (r: { reply_status: string }) => r.reply_status === "pending"
      ).length;
      const avgRating =
        totalReviews > 0
          ? allReviews.reduce((sum: number, r: { rating: number }) => sum + r.rating, 0) / totalReviews
          : 0;

      setStats({ totalReviews, repliedReviews, pendingReviews, avgRating });
    }

    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function handleAddBusiness(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const { data: newBiz, error } = await supabase
      .from("businesses")
      .insert({
        user_id: user.id,
        business_name: newBusiness.business_name,
        business_type: newBusiness.business_type,
        tone: newBusiness.tone,
      })
      .select()
      .single();

    if (error || !newBiz) {
      toast({
        title: "Error",
        description: "Failed to add business",
        variant: "destructive",
      });
    } else {
      toast({ title: "Success", description: "Business added!" });
      setAddDialogOpen(false);
      setNewBusiness({ business_name: "", business_type: "", tone: "friendly" });
      router.push(`/dashboard/${newBiz.id}`);
    }

    setSaving(false);
  }

  async function toggleAutoReply(businessId: string, enabled: boolean) {
    await supabase
      .from("businesses")
      .update({ auto_reply: enabled })
      .eq("id", businessId);

    setBusinesses((prev) =>
      prev.map((b) =>
        b.id === businessId ? { ...b, auto_reply: enabled } : b
      )
    );
  }

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))}
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-48 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 opacity-0 animate-fade-in">
      {/* Checkout Success Modal */}
      <Dialog open={showCheckoutSuccess} onOpenChange={setShowCheckoutSuccess}>
        <DialogContent className="sm:max-w-md text-center">
          <div className="flex flex-col items-center py-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <CheckCircle className="w-8 h-8 text-primary" />
            </div>
            <DialogHeader>
              <DialogTitle className="font-display text-2xl text-center">Welcome aboard!</DialogTitle>
            </DialogHeader>
            <p className="text-muted-foreground font-body mt-2 leading-relaxed">
              Thank you for supporting us and believing in ReviewFlow. Your subscription is now active — let&apos;s grow your business together.
            </p>
            <div className="flex items-center gap-1.5 mt-4 text-sm text-primary font-body font-medium">
              <Heart className="w-4 h-4" />
              <span>We&apos;re glad to have you</span>
            </div>
            <Button
              className="mt-6 bg-primary text-white rounded-xl px-8 font-body"
              onClick={() => setShowCheckoutSuccess(false)}
            >
              Get Started
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground font-body mt-1">
            Overview of all your businesses and reviews
          </p>
        </div>
        <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="h-10 px-5 rounded-xl bg-primary text-white font-body font-medium hover:bg-primary/90">
              <Plus className="w-4 h-4 mr-2" />
              Add Business
            </Button>
          </DialogTrigger>
          <DialogContent className="rounded-2xl">
            <DialogHeader>
              <DialogTitle className="font-display text-xl">
                Add a Business
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAddBusiness} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label className="font-body text-sm">Business Name</Label>
                <Input
                  placeholder="e.g. The Green Table"
                  value={newBusiness.business_name}
                  onChange={(e) =>
                    setNewBusiness({ ...newBusiness, business_name: e.target.value })
                  }
                  required
                  className="h-11 rounded-xl font-body"
                />
              </div>
              <div className="space-y-2">
                <Label className="font-body text-sm">Business Type</Label>
                <Input
                  placeholder="e.g. Restaurant, Dental Office, Salon"
                  value={newBusiness.business_type}
                  onChange={(e) =>
                    setNewBusiness({ ...newBusiness, business_type: e.target.value })
                  }
                  required
                  className="h-11 rounded-xl font-body"
                />
              </div>
              <div className="space-y-2">
                <Label className="font-body text-sm">Reply Tone</Label>
                <Select
                  value={newBusiness.tone}
                  onValueChange={(v) =>
                    setNewBusiness({ ...newBusiness, tone: v })
                  }
                >
                  <SelectTrigger className="h-11 rounded-xl font-body">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="friendly">Friendly</SelectItem>
                    <SelectItem value="professional">Professional</SelectItem>
                    <SelectItem value="casual">Casual</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button
                type="submit"
                className="w-full h-11 rounded-xl bg-primary text-white font-body font-semibold"
                disabled={saving}
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  "Add Business"
                )}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          {
            label: "Total Reviews",
            value: stats.totalReviews,
            icon: MessageSquare,
            color: "text-blue-600 bg-blue-50",
          },
          {
            label: "Replied",
            value: stats.repliedReviews,
            icon: TrendingUp,
            color: "text-emerald-600 bg-emerald-50",
          },
          {
            label: "Pending",
            value: stats.pendingReviews,
            icon: Clock,
            color: "text-amber-600 bg-amber-50",
          },
          {
            label: "Avg Rating",
            value: stats.avgRating > 0 ? stats.avgRating.toFixed(1) : "—",
            icon: Star,
            color: "text-purple-600 bg-purple-50",
          },
        ].map((stat) => (
          <Card
            key={stat.label}
            className="rounded-2xl border-gray-100 shadow-none hover:shadow-[0_4px_20px_rgba(0,0,0,0.04)] transition-shadow"
          >
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-muted-foreground font-body uppercase tracking-wider">
                  {stat.label}
                </span>
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center ${stat.color}`}
                >
                  <stat.icon className="w-4 h-4" />
                </div>
              </div>
              <p className="font-display text-3xl text-foreground">
                {stat.value}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Businesses */}
      {businesses.length === 0 ? (
        <Card className="rounded-2xl border-gray-100">
          <CardContent className="p-8 md:p-12">
            <h3 className="font-display text-xl text-foreground mb-2 text-center">
              Get Started in 3 Steps
            </h3>
            <p className="text-sm text-muted-foreground font-body mb-8 text-center max-w-md mx-auto">
              You&apos;ll be replying to reviews with AI in minutes.
            </p>
            <div className="space-y-4 max-w-sm mx-auto">
              {/* Step 1 — Add business (active) */}
              <button
                onClick={() => setAddDialogOpen(true)}
                className="w-full flex items-center gap-4 p-4 rounded-xl border-2 border-primary/30 bg-primary/[0.03] hover:bg-primary/[0.06] transition-colors text-left"
              >
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <span className="font-display text-primary text-sm">1</span>
                </div>
                <div className="flex-1">
                  <p className="font-body font-semibold text-sm text-foreground">
                    Add your business
                  </p>
                  <p className="text-xs text-muted-foreground font-body">
                    Tell us your business name and type
                  </p>
                </div>
                <Plus className="w-5 h-5 text-primary shrink-0" />
              </button>

              {/* Step 2 — Connect Google (locked) */}
              <div className="flex items-center gap-4 p-4 rounded-xl border border-gray-200 bg-gray-50/50 opacity-60">
                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                  <span className="font-display text-gray-400 text-sm">2</span>
                </div>
                <div className="flex-1">
                  <p className="font-body font-semibold text-sm text-gray-400">
                    Connect Google Reviews
                  </p>
                  <p className="text-xs text-gray-400 font-body">
                    Import reviews from your Google Business Profile
                  </p>
                </div>
                <Circle className="w-5 h-5 text-gray-300 shrink-0" />
              </div>

              {/* Step 3 — Generate replies (locked) */}
              <div className="flex items-center gap-4 p-4 rounded-xl border border-gray-200 bg-gray-50/50 opacity-60">
                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                  <span className="font-display text-gray-400 text-sm">3</span>
                </div>
                <div className="flex-1">
                  <p className="font-body font-semibold text-sm text-gray-400">
                    Generate AI Replies
                  </p>
                  <p className="text-xs text-gray-400 font-body">
                    Let Claude craft perfect responses to every review
                  </p>
                </div>
                <Circle className="w-5 h-5 text-gray-300 shrink-0" />
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {businesses.map((business) => {
            const reviewCount = business.reviews?.length || 0;
            const pendingCount =
              business.reviews?.filter((r) => r.reply_status === "pending")
                .length || 0;
            const avgRating =
              reviewCount > 0
                ? (
                    business.reviews.reduce((s, r) => s + r.rating, 0) /
                    reviewCount
                  ).toFixed(1)
                : "—";

            return (
              <Card
                key={business.id}
                className="rounded-2xl border-gray-100 shadow-none hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] transition-all duration-300 hover:-translate-y-0.5"
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-display text-lg text-foreground">
                        {business.business_name}
                      </h3>
                      <p className="text-xs text-muted-foreground font-body">
                        {business.business_type}
                      </p>
                    </div>
                    <Badge
                      variant="outline"
                      className="capitalize rounded-full text-xs font-body"
                    >
                      {business.tone}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-3 gap-3 mb-4">
                    <div className="text-center p-2 rounded-lg bg-gray-50">
                      <p className="font-display text-xl text-foreground">
                        {reviewCount}
                      </p>
                      <p className="text-[10px] text-muted-foreground font-body uppercase tracking-wider">
                        Reviews
                      </p>
                    </div>
                    <div className="text-center p-2 rounded-lg bg-gray-50">
                      <p className="font-display text-xl text-foreground">
                        {pendingCount}
                      </p>
                      <p className="text-[10px] text-muted-foreground font-body uppercase tracking-wider">
                        Pending
                      </p>
                    </div>
                    <div className="text-center p-2 rounded-lg bg-gray-50">
                      <p className="font-display text-xl text-foreground">
                        {avgRating}
                      </p>
                      <p className="text-[10px] text-muted-foreground font-body uppercase tracking-wider">
                        Avg
                      </p>
                    </div>
                  </div>

                  {/* Contextual nudge */}
                  {!business.google_refresh_token ? (
                    <Link
                      href={`/dashboard/${business.id}`}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-50 border border-amber-200 text-amber-700 text-xs font-body hover:bg-amber-100 transition-colors"
                    >
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      Connect Google to get started
                    </Link>
                  ) : reviewCount === 0 ? (
                    <Link
                      href={`/dashboard/${business.id}`}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 text-xs font-body hover:bg-blue-100 transition-colors"
                    >
                      <RefreshCw className="w-3.5 h-3.5 shrink-0" />
                      Sync your reviews
                    </Link>
                  ) : pendingCount > 0 ? (
                    <Link
                      href={`/dashboard/${business.id}`}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/5 border border-primary/20 text-primary text-xs font-body hover:bg-primary/10 transition-colors"
                    >
                      <Sparkles className="w-3.5 h-3.5 shrink-0" />
                      {pendingCount} review{pendingCount !== 1 ? "s" : ""} need{pendingCount === 1 ? "s" : ""} replies
                    </Link>
                  ) : null}

                  <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={business.auto_reply}
                        onCheckedChange={(checked) =>
                          toggleAutoReply(business.id, checked)
                        }
                        className="data-[state=checked]:bg-primary"
                      />
                      <span className="text-xs text-muted-foreground font-body">
                        Auto-reply
                      </span>
                    </div>
                    <Link href={`/dashboard/${business.id}`}>
                      <Button
                        variant="ghost"
                        className="h-8 px-3 text-xs font-body text-primary hover:text-primary hover:bg-primary/5 rounded-lg"
                      >
                        View Reviews
                        <ExternalLink className="w-3 h-3 ml-1.5" />
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
