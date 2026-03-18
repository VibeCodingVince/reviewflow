"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
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
  CalendarCheck,
  Sparkles,
  Check,
  SkipForward,
  Loader2,
  Send,
  FileText,
  Edit3,
  Lightbulb,
  Image,
  Clock,
  Tag,
  MessageSquare,
  LayoutGrid,
} from "lucide-react";
import type { Business, OptimizationTask, TaskType } from "@/lib/types";

const taskTypeIcons: Record<TaskType, typeof FileText> = {
  post: FileText,
  service_update: Tag,
  description_update: Edit3,
  photo: Image,
  qa: MessageSquare,
  hours_update: Clock,
  category_update: LayoutGrid,
};

const taskTypeLabels: Record<TaskType, string> = {
  post: "GBP Post",
  service_update: "Service Update",
  description_update: "Description",
  photo: "Photos",
  qa: "Q&A",
  hours_update: "Hours",
  category_update: "Categories",
};

function getMonday(date: Date): string {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  return d.toISOString().split("T")[0];
}

export default function PlannerPage() {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [selectedBiz, setSelectedBiz] = useState<string>("");
  const [tasks, setTasks] = useState<OptimizationTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingDraft, setEditingDraft] = useState<Record<string, string>>({});
  const [processingTask, setProcessingTask] = useState<string | null>(null);
  const [weekOf, setWeekOf] = useState(getMonday(new Date()));
  const supabase = createClient();
  const { toast } = useToast();

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

  const fetchTasks = useCallback(async () => {
    if (!selectedBiz) return;

    try {
      const res = await fetch(`/api/tasks?business_id=${selectedBiz}&week_of=${weekOf}`);
      if (res.ok) {
        const data = await res.json();
        setTasks(data.tasks || []);
      }
    } catch {
      // silently handle
    }
  }, [selectedBiz, weekOf]);

  useEffect(() => {
    fetchBusinesses();
  }, [fetchBusinesses]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  async function updateTask(taskId: string, status: string, aiDraft?: string) {
    setProcessingTask(taskId);
    try {
      const res = await fetch("/api/tasks", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          task_id: taskId,
          status,
          ...(aiDraft !== undefined ? { ai_draft: aiDraft } : {}),
        }),
      });

      if (res.ok) {
        setTasks((prev) =>
          prev.map((t) =>
            t.id === taskId
              ? {
                  ...t,
                  status: status as OptimizationTask["status"],
                  ...(aiDraft !== undefined ? { ai_draft: aiDraft } : {}),
                }
              : t
          )
        );
        toast({
          title: status === "approved" ? "Task approved" : status === "skipped" ? "Task skipped" : "Task updated",
        });
      } else {
        toast({ title: "Error", description: "Failed to update task", variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "Failed to update task", variant: "destructive" });
    }
    setProcessingTask(null);
  }

  async function publishPost(taskId: string) {
    setProcessingTask(taskId);
    try {
      const draft = editingDraft[taskId];
      if (draft !== undefined) {
        // Save the edited draft first
        await fetch("/api/tasks", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ task_id: taskId, ai_draft: draft }),
        });
      }

      const res = await fetch("/api/posts/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ task_id: taskId }),
      });

      if (res.ok) {
        setTasks((prev) =>
          prev.map((t) =>
            t.id === taskId ? { ...t, status: "published" } : t
          )
        );
        toast({ title: "Post published to Google!" });
      } else {
        const data = await res.json();
        toast({ title: "Error", description: data.error, variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "Failed to publish", variant: "destructive" });
    }
    setProcessingTask(null);
  }

  // Generate week navigation
  const weeks: string[] = [];
  for (let i = -2; i <= 1; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i * 7);
    weeks.push(getMonday(d));
  }

  const completedCount = tasks.filter((t) => t.status === "published" || t.status === "approved").length;
  const totalCount = tasks.length;

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48 rounded-xl" />
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-48 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  if (businesses.length === 0) {
    return (
      <div className="text-center py-20">
        <CalendarCheck className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <h2 className="font-display text-2xl text-foreground mb-2">No businesses yet</h2>
        <p className="text-sm text-muted-foreground font-body">
          Add a business from the Dashboard to start the AI Planner.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 opacity-0 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl text-foreground">Action Planner</h1>
          <p className="text-sm text-muted-foreground font-body mt-1">
            AI-generated weekly tasks to optimize your Google Business Profile
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/planner/posts">
            <Button variant="outline" className="h-9 rounded-xl font-body text-sm border-gray-200">
              <FileText className="w-4 h-4 mr-2" />
              Published Posts
            </Button>
          </Link>
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
      </div>

      {/* Week selector */}
      <div className="flex items-center gap-2">
        {weeks.map((w) => {
          const weekDate = new Date(w + "T00:00:00");
          const isThisWeek = w === getMonday(new Date());
          return (
            <Button
              key={w}
              variant={w === weekOf ? "default" : "outline"}
              size="sm"
              className={`h-8 rounded-lg font-body text-xs ${
                w === weekOf ? "bg-primary text-white" : "border-gray-200"
              }`}
              onClick={() => setWeekOf(w)}
            >
              {isThisWeek ? "This Week" : `Week of ${weekDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`}
            </Button>
          );
        })}
      </div>

      {/* Progress card */}
      {tasks.length > 0 && (
        <Card className="rounded-2xl border-gray-100">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Lightbulb className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-body font-semibold text-sm text-foreground">
                    {completedCount} of {totalCount} tasks completed
                  </p>
                  <p className="text-xs text-muted-foreground font-body">
                    Week of {new Date(weekOf + "T00:00:00").toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                  </p>
                </div>
              </div>
              <div className="w-32 h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all"
                  style={{ width: `${totalCount > 0 ? (completedCount / totalCount) * 100 : 0}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tasks */}
      {tasks.length === 0 ? (
        <Card className="rounded-2xl border-dashed border-2 border-gray-200">
          <CardContent className="p-12 text-center">
            <CalendarCheck className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground font-body">
              No tasks generated for this week yet. Tasks are auto-generated every Monday.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {tasks.map((task) => {
            const isProcessing = processingTask === task.id;
            const Icon = taskTypeIcons[task.task_type] || FileText;
            const currentDraft = editingDraft[task.id] ?? task.ai_draft ?? "";
            const isCompleted = task.status === "published" || task.status === "approved" || task.status === "skipped";

            return (
              <Card
                key={task.id}
                className={`rounded-2xl border-gray-100 transition-all ${
                  isCompleted ? "opacity-60" : ""
                }`}
              >
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    {/* Status checkbox */}
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-1 ${
                      task.status === "published" ? "bg-emerald-100" :
                      task.status === "approved" ? "bg-blue-100" :
                      task.status === "skipped" ? "bg-gray-100" :
                      "bg-primary/10"
                    }`}>
                      {task.status === "published" ? (
                        <Check className="w-4 h-4 text-emerald-600" />
                      ) : task.status === "approved" ? (
                        <Check className="w-4 h-4 text-blue-600" />
                      ) : task.status === "skipped" ? (
                        <SkipForward className="w-4 h-4 text-gray-500" />
                      ) : (
                        <Icon className="w-4 h-4 text-primary" />
                      )}
                    </div>

                    <div className="flex-1 space-y-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-body font-semibold text-sm text-foreground">
                              {task.title}
                            </h3>
                            <Badge variant="outline" className="text-[10px] font-body rounded-full capitalize">
                              {taskTypeLabels[task.task_type]}
                            </Badge>
                            <Badge
                              variant="outline"
                              className={`text-[10px] font-body rounded-full ${
                                task.priority <= 2 ? "bg-red-50 text-red-700 border-red-200" :
                                task.priority === 3 ? "bg-amber-50 text-amber-700 border-amber-200" :
                                "bg-gray-50 text-gray-600 border-gray-200"
                              }`}
                            >
                              P{task.priority}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground font-body mt-1">
                            {task.description}
                          </p>
                        </div>
                        <Badge
                          variant="outline"
                          className={`capitalize rounded-full text-[10px] font-body shrink-0 ${
                            task.status === "published" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                            task.status === "approved" ? "bg-blue-50 text-blue-700 border-blue-200" :
                            task.status === "failed" ? "bg-red-50 text-red-700 border-red-200" :
                            task.status === "skipped" ? "bg-gray-50 text-gray-600 border-gray-200" :
                            "bg-amber-50 text-amber-700 border-amber-200"
                          }`}
                        >
                          {task.status}
                        </Badge>
                      </div>

                      {/* AI Draft */}
                      {task.ai_draft && (
                        <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                          <div className="flex items-center gap-2">
                            <Sparkles className="w-3.5 h-3.5 text-primary" />
                            <span className="text-xs font-body font-medium text-primary uppercase tracking-wider">
                              AI Draft
                            </span>
                          </div>
                          {task.status === "pending" ? (
                            <Textarea
                              value={currentDraft}
                              onChange={(e) =>
                                setEditingDraft({
                                  ...editingDraft,
                                  [task.id]: e.target.value,
                                })
                              }
                              className="min-h-[100px] rounded-lg font-body text-sm resize-none border-gray-200 focus:border-primary bg-white"
                            />
                          ) : (
                            <p className="text-sm text-foreground/80 font-body leading-relaxed whitespace-pre-wrap">
                              {task.ai_draft}
                            </p>
                          )}
                        </div>
                      )}

                      {/* Impact note */}
                      {task.impact_note && (
                        <p className="text-xs text-muted-foreground font-body italic">
                          Expected impact: {task.impact_note}
                        </p>
                      )}

                      {/* Actions */}
                      {task.status === "pending" && (
                        <div className="flex items-center gap-2">
                          {task.task_type === "post" && (
                            <Button
                              size="sm"
                              className="h-8 rounded-lg bg-primary text-white font-body text-xs hover:bg-primary/90"
                              onClick={() => publishPost(task.id)}
                              disabled={isProcessing}
                            >
                              {isProcessing ? (
                                <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                              ) : (
                                <Send className="w-3 h-3 mr-1" />
                              )}
                              Publish to Google
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 rounded-lg font-body text-xs border-gray-200"
                            onClick={() => {
                              const draft = editingDraft[task.id];
                              updateTask(task.id, "approved", draft !== undefined ? draft : undefined);
                            }}
                            disabled={isProcessing}
                          >
                            <Check className="w-3 h-3 mr-1" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 rounded-lg font-body text-xs text-muted-foreground"
                            onClick={() => updateTask(task.id, "skipped")}
                            disabled={isProcessing}
                          >
                            <SkipForward className="w-3 h-3 mr-1" />
                            Skip
                          </Button>
                        </div>
                      )}
                    </div>
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
