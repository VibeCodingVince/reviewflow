"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import {
  Star,
  ArrowLeft,
  Sparkles,
  Check,
  RotateCw,
  SkipForward,
  Upload,
  Loader2,
  FileText,
  Wand2,
  Send,
} from "lucide-react";
import type { Business, Review, ReplyStatus } from "@/lib/types";

export default function BusinessReviewsPage() {
  const params = useParams();
  const businessId = params.businessId as string;
  const [business, setBusiness] = useState<Business | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [editingReply, setEditingReply] = useState<Record<string, string>>({});
  const [processingReview, setProcessingReview] = useState<string | null>(null);
  const [bulkGenerating, setBulkGenerating] = useState(false);
  const [csvUploading, setCsvUploading] = useState(false);
  const supabase = createClient();
  const { toast } = useToast();

  const fetchData = useCallback(async () => {
    const [bizResult, reviewsResult] = await Promise.all([
      supabase.from("businesses").select("*").eq("id", businessId).single(),
      supabase
        .from("reviews")
        .select("*")
        .eq("business_id", businessId)
        .order("review_date", { ascending: false }),
    ]);

    if (bizResult.data) setBusiness(bizResult.data);
    if (reviewsResult.data) setReviews(reviewsResult.data);
    setLoading(false);
  }, [supabase, businessId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredReviews =
    activeTab === "all"
      ? reviews
      : reviews.filter((r) => r.reply_status === activeTab);

  async function generateReply(reviewId: string) {
    setProcessingReview(reviewId);
    try {
      const res = await fetch("/api/reviews/generate-reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ review_id: reviewId }),
      });
      const data = await res.json();

      if (res.ok) {
        setReviews((prev) =>
          prev.map((r) =>
            r.id === reviewId ? { ...r, ai_reply: data.ai_reply } : r
          )
        );
        toast({ title: "Reply generated!" });
      } else {
        toast({
          title: "Error",
          description: data.error,
          variant: "destructive",
        });
      }
    } catch {
      toast({
        title: "Error",
        description: "Failed to generate reply",
        variant: "destructive",
      });
    }
    setProcessingReview(null);
  }

  async function bulkGenerate() {
    setBulkGenerating(true);
    try {
      const res = await fetch("/api/reviews/generate-bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ business_id: businessId }),
      });
      const data = await res.json();

      if (res.ok) {
        toast({
          title: "Bulk generation complete",
          description: `Generated ${data.generated} of ${data.total} replies`,
        });
        fetchData();
      } else {
        toast({
          title: "Error",
          description: data.error,
          variant: "destructive",
        });
      }
    } catch {
      toast({
        title: "Error",
        description: "Failed to generate replies",
        variant: "destructive",
      });
    }
    setBulkGenerating(false);
  }

  async function updateStatus(
    reviewId: string,
    status: ReplyStatus,
    editedReply?: string
  ) {
    setProcessingReview(reviewId);
    try {
      const res = await fetch("/api/reviews/update-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          review_id: reviewId,
          status,
          edited_reply: editedReply,
        }),
      });

      if (res.ok) {
        setReviews((prev) =>
          prev.map((r) =>
            r.id === reviewId
              ? {
                  ...r,
                  reply_status: status,
                  ...(editedReply !== undefined
                    ? { edited_reply: editedReply }
                    : {}),
                }
              : r
          )
        );

        if (status === "posted") {
          // Also post the reply
          await fetch("/api/reviews/post-reply", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ review_id: reviewId }),
          });
        }
      }
    } catch {
      toast({
        title: "Error",
        description: "Failed to update status",
        variant: "destructive",
      });
    }
    setProcessingReview(null);
  }

  async function handleCsvUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setCsvUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("business_id", businessId);

    try {
      const res = await fetch("/api/reviews/import-csv", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

      if (res.ok) {
        toast({
          title: "Import complete",
          description: data.message,
        });
        fetchData();
      } else {
        toast({
          title: "Import failed",
          description: data.error,
          variant: "destructive",
        });
      }
    } catch {
      toast({
        title: "Error",
        description: "Failed to import CSV",
        variant: "destructive",
      });
    }
    setCsvUploading(false);
    e.target.value = "";
  }

  function StarRating({ rating }: { rating: number }) {
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((s) => (
          <Star
            key={s}
            className={`w-4 h-4 ${
              s <= rating
                ? "fill-amber-400 text-amber-400"
                : "fill-gray-200 text-gray-200"
            }`}
          />
        ))}
      </div>
    );
  }

  function statusColor(status: string) {
    const colors: Record<string, string> = {
      pending: "bg-amber-50 text-amber-700 border-amber-200",
      approved: "bg-blue-50 text-blue-700 border-blue-200",
      posted: "bg-emerald-50 text-emerald-700 border-emerald-200",
      skipped: "bg-gray-50 text-gray-600 border-gray-200",
      failed: "bg-red-50 text-red-700 border-red-200",
    };
    return colors[status] || "";
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48 rounded-xl" />
        <Skeleton className="h-20 rounded-2xl" />
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-48 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!business) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground font-body">Business not found</p>
        <Link href="/dashboard">
          <Button variant="link" className="mt-2 font-body text-primary">
            Back to Dashboard
          </Button>
        </Link>
      </div>
    );
  }

  const pendingCount = reviews.filter(
    (r) => r.reply_status === "pending"
  ).length;

  return (
    <div className="space-y-6 opacity-0 animate-fade-in">
      {/* Back link + header */}
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground font-body hover:text-foreground transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Dashboard
      </Link>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-display text-3xl text-foreground">
              {business.business_name}
            </h1>
            <Badge
              variant="outline"
              className="capitalize rounded-full text-xs font-body"
            >
              {business.tone}
            </Badge>
            {business.auto_reply && (
              <Badge className="bg-primary/10 text-primary border-0 rounded-full text-xs font-body">
                Auto-reply ON
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground font-body mt-1">
            {business.business_type} &middot; {reviews.length} reviews &middot;{" "}
            {pendingCount} pending
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            className="h-9 rounded-xl font-body text-sm border-gray-200"
            onClick={bulkGenerate}
            disabled={bulkGenerating}
          >
            {bulkGenerating ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Wand2 className="w-4 h-4 mr-2" />
            )}
            Generate All Replies
          </Button>

          <label>
            <input
              type="file"
              accept=".csv"
              className="hidden"
              onChange={handleCsvUpload}
            />
            <Button
              variant="outline"
              className="h-9 rounded-xl font-body text-sm border-gray-200 cursor-pointer"
              asChild
              disabled={csvUploading}
            >
              <span>
                {csvUploading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Upload className="w-4 h-4 mr-2" />
                )}
                Import CSV
              </span>
            </Button>
          </label>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-gray-100/80 rounded-xl p-1 h-auto">
          {[
            { value: "all", label: "All", count: reviews.length },
            {
              value: "pending",
              label: "Pending",
              count: reviews.filter((r) => r.reply_status === "pending").length,
            },
            {
              value: "approved",
              label: "Approved",
              count: reviews.filter((r) => r.reply_status === "approved").length,
            },
            {
              value: "posted",
              label: "Posted",
              count: reviews.filter((r) => r.reply_status === "posted").length,
            },
            {
              value: "skipped",
              label: "Skipped",
              count: reviews.filter((r) => r.reply_status === "skipped").length,
            },
          ].map((tab) => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className="rounded-lg font-body text-xs data-[state=active]:bg-white data-[state=active]:shadow-sm px-4 py-2"
            >
              {tab.label}
              <span className="ml-1.5 text-[10px] text-muted-foreground">
                {tab.count}
              </span>
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          {filteredReviews.length === 0 ? (
            <Card className="rounded-2xl border-dashed border-2 border-gray-200">
              <CardContent className="p-12 text-center">
                <FileText className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground font-body">
                  No reviews in this category
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredReviews.map((review) => {
                const isProcessing = processingReview === review.id;
                const currentReply =
                  editingReply[review.id] ??
                  review.edited_reply ??
                  review.ai_reply ??
                  "";

                return (
                  <Card
                    key={review.id}
                    className="rounded-2xl border-gray-100 shadow-none hover:shadow-[0_4px_20px_rgba(0,0,0,0.04)] transition-shadow"
                  >
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-emerald-200 flex items-center justify-center text-primary font-body font-semibold text-sm">
                            {review.reviewer_name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")
                              .slice(0, 2)
                              .toUpperCase()}
                          </div>
                          <div>
                            <p className="font-body font-semibold text-sm text-foreground">
                              {review.reviewer_name}
                            </p>
                            <div className="flex items-center gap-2">
                              <StarRating rating={review.rating} />
                              <span className="text-xs text-muted-foreground font-body">
                                {new Date(
                                  review.review_date
                                ).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </div>
                        <Badge
                          variant="outline"
                          className={`capitalize rounded-full text-[10px] font-body ${statusColor(review.reply_status)}`}
                        >
                          {review.reply_status}
                        </Badge>
                      </div>

                      <p className="text-sm text-foreground/80 font-body leading-relaxed mb-4 pl-[52px]">
                        &ldquo;{review.review_text}&rdquo;
                      </p>

                      {/* Reply section */}
                      <div className="pl-[52px]">
                        {review.ai_reply || editingReply[review.id] ? (
                          <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                            <div className="flex items-center gap-2">
                              <Sparkles className="w-3.5 h-3.5 text-primary" />
                              <span className="text-xs font-body font-medium text-primary uppercase tracking-wider">
                                {review.edited_reply
                                  ? "Edited Reply"
                                  : "AI Reply"}
                              </span>
                            </div>
                            <Textarea
                              value={currentReply}
                              onChange={(e) =>
                                setEditingReply({
                                  ...editingReply,
                                  [review.id]: e.target.value,
                                })
                              }
                              className="min-h-[80px] rounded-lg font-body text-sm resize-none border-gray-200 focus:border-primary bg-white"
                            />
                            <div className="flex items-center gap-2 flex-wrap">
                              {review.reply_status !== "posted" && (
                                <>
                                  <Button
                                    size="sm"
                                    className="h-8 rounded-lg bg-primary text-white font-body text-xs hover:bg-primary/90"
                                    onClick={() => {
                                      const reply = editingReply[review.id];
                                      updateStatus(
                                        review.id,
                                        "posted",
                                        reply !== undefined ? reply : undefined
                                      );
                                    }}
                                    disabled={isProcessing}
                                  >
                                    {isProcessing ? (
                                      <Loader2 className="w-3 h-3 animate-spin mr-1" />
                                    ) : (
                                      <Send className="w-3 h-3 mr-1" />
                                    )}
                                    Approve & Post
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-8 rounded-lg font-body text-xs border-gray-200"
                                    onClick={() => {
                                      const reply = editingReply[review.id];
                                      if (reply !== undefined) {
                                        updateStatus(
                                          review.id,
                                          "approved",
                                          reply
                                        );
                                        const newEditing = { ...editingReply };
                                        delete newEditing[review.id];
                                        setEditingReply(newEditing);
                                      } else {
                                        updateStatus(review.id, "approved");
                                      }
                                    }}
                                    disabled={isProcessing}
                                  >
                                    <Check className="w-3 h-3 mr-1" />
                                    Approve
                                  </Button>
                                </>
                              )}
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 rounded-lg font-body text-xs border-gray-200"
                                onClick={() => generateReply(review.id)}
                                disabled={isProcessing}
                              >
                                <RotateCw className="w-3 h-3 mr-1" />
                                Regenerate
                              </Button>
                              {review.reply_status !== "skipped" && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-8 rounded-lg font-body text-xs text-muted-foreground"
                                  onClick={() =>
                                    updateStatus(review.id, "skipped")
                                  }
                                  disabled={isProcessing}
                                >
                                  <SkipForward className="w-3 h-3 mr-1" />
                                  Skip
                                </Button>
                              )}
                            </div>
                          </div>
                        ) : (
                          <Button
                            variant="outline"
                            className="h-9 rounded-xl font-body text-sm border-primary/20 text-primary hover:bg-primary/5"
                            onClick={() => generateReply(review.id)}
                            disabled={isProcessing}
                          >
                            {isProcessing ? (
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            ) : (
                              <Sparkles className="w-4 h-4 mr-2" />
                            )}
                            Generate Reply
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
