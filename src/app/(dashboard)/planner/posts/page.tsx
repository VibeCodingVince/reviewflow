"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  FileText,
  Eye,
  MousePointer,
  Calendar,
  CheckCircle,
  XCircle,
} from "lucide-react";
import type { Business, GBPPost } from "@/lib/types";

export default function PostsPage() {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [selectedBiz, setSelectedBiz] = useState<string>("");
  const [posts, setPosts] = useState<GBPPost[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const fetchBusinesses = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("businesses")
      .select("*")
      .order("created_at", { ascending: false });

    if (data && data.length > 0) {
      setBusinesses(data);
      setSelectedBiz(data[0].id);
    }
    setLoading(false);
  }, [supabase]);

  const fetchPosts = useCallback(async () => {
    if (!selectedBiz) return;

    try {
      const res = await fetch(`/api/posts?business_id=${selectedBiz}`);
      if (res.ok) {
        const data = await res.json();
        setPosts(data.posts || []);
      }
    } catch {
      // silently handle
    }
  }, [selectedBiz]);

  useEffect(() => {
    fetchBusinesses();
  }, [fetchBusinesses]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48 rounded-xl" />
        <div className="grid md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-48 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 opacity-0 animate-fade-in">
      <Link
        href="/planner"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground font-body hover:text-foreground transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Planner
      </Link>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl text-foreground">Published Posts</h1>
          <p className="text-sm text-muted-foreground font-body mt-1">
            All posts published to your Google Business Profile
          </p>
        </div>
        {businesses.length > 1 && (
          <Select value={selectedBiz} onValueChange={setSelectedBiz}>
            <SelectTrigger className="w-48 h-9 rounded-lg font-body text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {businesses.map((b) => (
                <SelectItem key={b.id} value={b.id}>
                  {b.business_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {posts.length === 0 ? (
        <Card className="rounded-2xl border-dashed border-2 border-gray-200">
          <CardContent className="p-12 text-center">
            <FileText className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground font-body">
              No posts published yet. Approve tasks from the Planner to start publishing.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {posts.map((post) => (
            <Card key={post.id} className="rounded-2xl border-gray-100">
              <CardContent className="p-5 space-y-3">
                <div className="flex items-start justify-between">
                  <Badge
                    variant="outline"
                    className={`capitalize rounded-full text-[10px] font-body ${
                      post.status === "published"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : post.status === "failed"
                          ? "bg-red-50 text-red-700 border-red-200"
                          : "bg-gray-50 text-gray-600 border-gray-200"
                    }`}
                  >
                    {post.status === "published" ? (
                      <CheckCircle className="w-3 h-3 mr-1" />
                    ) : post.status === "failed" ? (
                      <XCircle className="w-3 h-3 mr-1" />
                    ) : null}
                    {post.status}
                  </Badge>
                  <Badge variant="outline" className="capitalize text-[10px] font-body rounded-full">
                    {post.post_type}
                  </Badge>
                </div>

                <p className="text-sm text-foreground/80 font-body leading-relaxed line-clamp-4">
                  {post.summary}
                </p>

                {post.call_to_action && (
                  <p className="text-xs text-primary font-body font-medium">
                    CTA: {post.call_to_action}
                  </p>
                )}

                <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1 text-xs text-muted-foreground font-body">
                      <Eye className="w-3 h-3" />
                      {post.views}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-muted-foreground font-body">
                      <MousePointer className="w-3 h-3" />
                      {post.clicks}
                    </span>
                  </div>
                  <span className="flex items-center gap-1 text-[10px] text-muted-foreground font-body">
                    <Calendar className="w-3 h-3" />
                    {post.published_at
                      ? new Date(post.published_at).toLocaleDateString()
                      : "Not published"}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
