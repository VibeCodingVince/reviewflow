"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  Save,
  CreditCard,
  Trash2,
  ExternalLink,
  Loader2,
  Building2,
  AlertTriangle,
} from "lucide-react";
import type { User, Business } from "@/lib/types";

export default function SettingsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingBusiness, setSavingBusiness] = useState<string | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);
  const supabase = createClient();
  const { toast } = useToast();

  const fetchData = useCallback(async () => {
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    if (authUser) {
      const [userResult, bizResult] = await Promise.all([
        supabase.from("users").select("*").eq("id", authUser.id).single(),
        supabase
          .from("businesses")
          .select("*")
          .order("created_at", { ascending: false }),
      ]);

      if (userResult.data) setUser(userResult.data);
      if (bizResult.data) setBusinesses(bizResult.data);
    }

    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function saveBusiness(business: Business) {
    setSavingBusiness(business.id);

    const { error } = await supabase
      .from("businesses")
      .update({
        business_name: business.business_name,
        business_type: business.business_type,
        tone: business.tone,
        auto_reply: business.auto_reply,
        review_reply_instructions: business.review_reply_instructions,
      })
      .eq("id", business.id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to save changes",
        variant: "destructive",
      });
    } else {
      toast({ title: "Saved", description: "Business settings updated" });
    }

    setSavingBusiness(null);
  }

  async function deleteBusiness(businessId: string) {
    if (!confirm("Are you sure? This will delete the business and all its reviews.")) {
      return;
    }

    const { error } = await supabase
      .from("businesses")
      .delete()
      .eq("id", businessId);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to delete business",
        variant: "destructive",
      });
    } else {
      setBusinesses((prev) => prev.filter((b) => b.id !== businessId));
      toast({ title: "Deleted", description: "Business removed" });
    }
  }

  async function openStripePortal() {
    setPortalLoading(true);
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" });
      const data = await res.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to open portal",
          variant: "destructive",
        });
      }
    } catch {
      toast({
        title: "Error",
        description: "Failed to open billing portal",
        variant: "destructive",
      });
    }
    setPortalLoading(false);
  }

  function connectGoogle(businessId: string) {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    const redirectUri = `${window.location.origin}/api/auth/google/callback`;
    const scope = encodeURIComponent(
      "https://www.googleapis.com/auth/business.manage"
    );
    const url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=${scope}&access_type=offline&prompt=consent&state=${businessId}`;
    window.location.href = url;
  }

  if (loading) {
    return (
      <div className="space-y-6 max-w-3xl">
        <Skeleton className="h-10 w-48 rounded-xl" />
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-48 rounded-2xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-3xl opacity-0 animate-fade-in">
      <div>
        <h1 className="font-display text-3xl text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground font-body mt-1">
          Manage your businesses, account, and subscription
        </p>
      </div>

      {/* Account */}
      <Card className="rounded-2xl border-gray-100">
        <CardHeader>
          <CardTitle className="font-display text-lg">Account</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-body font-medium text-foreground">
                Email
              </p>
              <p className="text-sm text-muted-foreground font-body">
                {user?.email}
              </p>
            </div>
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-body font-medium text-foreground">
                Subscription
              </p>
              <div className="flex items-center gap-2 mt-1">
                <Badge
                  variant="outline"
                  className={`capitalize rounded-full text-xs font-body ${
                    user?.subscription_status === "active"
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : "bg-gray-50 text-gray-600 border-gray-200"
                  }`}
                >
                  {user?.subscription_status}
                </Badge>
                {user?.subscription_tier && (
                  <Badge
                    variant="outline"
                    className="capitalize rounded-full text-xs font-body"
                  >
                    {user.subscription_tier} plan
                  </Badge>
                )}
              </div>
            </div>
            <Button
              variant="outline"
              className="h-9 rounded-xl font-body text-sm border-gray-200"
              onClick={openStripePortal}
              disabled={portalLoading || !user?.stripe_customer_id}
            >
              {portalLoading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <CreditCard className="w-4 h-4 mr-2" />
              )}
              Manage Billing
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Businesses */}
      <div className="space-y-4">
        <h2 className="font-display text-xl text-foreground">Businesses</h2>
        {businesses.map((business) => (
          <Card key={business.id} className="rounded-2xl border-gray-100">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-muted-foreground" />
                  <span className="font-body font-semibold text-foreground">
                    {business.business_name}
                  </span>
                </div>
                {business.google_refresh_token ? (
                  <Badge className="bg-emerald-50 text-emerald-700 border-0 rounded-full text-xs font-body">
                    Google Connected
                  </Badge>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 rounded-lg font-body text-xs border-gray-200"
                    onClick={() => connectGoogle(business.id)}
                  >
                    <ExternalLink className="w-3 h-3 mr-1" />
                    Connect Google
                  </Button>
                )}
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="font-body text-xs">Business Name</Label>
                  <Input
                    value={business.business_name}
                    onChange={(e) =>
                      setBusinesses((prev) =>
                        prev.map((b) =>
                          b.id === business.id
                            ? { ...b, business_name: e.target.value }
                            : b
                        )
                      )
                    }
                    className="h-10 rounded-lg font-body text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="font-body text-xs">Business Type</Label>
                  <Input
                    value={business.business_type}
                    onChange={(e) =>
                      setBusinesses((prev) =>
                        prev.map((b) =>
                          b.id === business.id
                            ? { ...b, business_type: e.target.value }
                            : b
                        )
                      )
                    }
                    className="h-10 rounded-lg font-body text-sm"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="font-body text-xs">Tone</Label>
                  <Select
                    value={business.tone}
                    onValueChange={(v) =>
                      setBusinesses((prev) =>
                        prev.map((b) =>
                          b.id === business.id ? { ...b, tone: v as Business["tone"] } : b
                        )
                      )
                    }
                  >
                    <SelectTrigger className="h-10 rounded-lg font-body text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="friendly">Friendly</SelectItem>
                      <SelectItem value="professional">Professional</SelectItem>
                      <SelectItem value="casual">Casual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end pb-1">
                  <div className="flex items-center gap-3">
                    <Switch
                      checked={business.auto_reply}
                      onCheckedChange={(checked) =>
                        setBusinesses((prev) =>
                          prev.map((b) =>
                            b.id === business.id
                              ? { ...b, auto_reply: checked }
                              : b
                          )
                        )
                      }
                      className="data-[state=checked]:bg-primary"
                    />
                    <Label className="font-body text-sm">
                      Auto-reply enabled
                    </Label>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="font-body text-xs">
                  Custom Reply Instructions (optional)
                </Label>
                <Textarea
                  value={business.review_reply_instructions || ""}
                  onChange={(e) =>
                    setBusinesses((prev) =>
                      prev.map((b) =>
                        b.id === business.id
                          ? {
                              ...b,
                              review_reply_instructions: e.target.value || null,
                            }
                          : b
                      )
                    )
                  }
                  placeholder="e.g. Always mention our weekend brunch special. Refer customers to manager@email.com for complaints."
                  className="min-h-[80px] rounded-lg font-body text-sm resize-none"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 rounded-lg font-body text-xs text-destructive hover:text-destructive hover:bg-destructive/5"
                  onClick={() => deleteBusiness(business.id)}
                >
                  <Trash2 className="w-3 h-3 mr-1" />
                  Delete Business
                </Button>
                <Button
                  size="sm"
                  className="h-9 px-4 rounded-lg bg-primary text-white font-body text-xs hover:bg-primary/90"
                  onClick={() => saveBusiness(business)}
                  disabled={savingBusiness === business.id}
                >
                  {savingBusiness === business.id ? (
                    <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                  ) : (
                    <Save className="w-3 h-3 mr-1" />
                  )}
                  Save Changes
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Danger zone */}
      <Card className="rounded-2xl border-destructive/20">
        <CardHeader>
          <CardTitle className="font-display text-lg flex items-center gap-2 text-destructive">
            <AlertTriangle className="w-5 h-5" />
            Danger Zone
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground font-body mb-4">
            Permanently delete your account and all associated data. This
            action cannot be undone.
          </p>
          <Button
            variant="outline"
            className="h-9 rounded-xl font-body text-sm text-destructive border-destructive/30 hover:bg-destructive/5"
            onClick={() => {
              toast({
                title: "Contact Support",
                description: "Please email support to delete your account.",
              });
            }}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete Account
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
