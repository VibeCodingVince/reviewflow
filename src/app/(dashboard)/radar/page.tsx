"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
  Activity,
  TrendingDown,
  TrendingUp,
  Phone,
  Globe,
  MapPin,
  Eye,
  AlertTriangle,
  CheckCircle,
  Info,
  X,
  Heart,
} from "lucide-react";
import type { Business, PerformanceSnapshot, Alert } from "@/lib/types";

export default function RadarPage() {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [selectedBiz, setSelectedBiz] = useState<string>("");
  const [snapshots, setSnapshots] = useState<PerformanceSnapshot[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);
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

  const fetchData = useCallback(async () => {
    if (!selectedBiz) return;

    try {
      const [snapRes, alertRes] = await Promise.all([
        fetch(`/api/performance?business_id=${selectedBiz}&days=${days}`),
        fetch(`/api/alerts?business_id=${selectedBiz}`),
      ]);

      if (snapRes.ok) {
        const snapData = await snapRes.json();
        setSnapshots(snapData.snapshots || []);
      }

      if (alertRes.ok) {
        const alertData = await alertRes.json();
        setAlerts(alertData.alerts || []);
      }
    } catch {
      // silently handle
    }
  }, [selectedBiz, days]);

  useEffect(() => {
    fetchBusinesses();
  }, [fetchBusinesses]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function dismissAlert(alertId: string) {
    setAlerts((prev) => prev.filter((a) => a.id !== alertId));
    await fetch("/api/alerts", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ alert_id: alertId, is_dismissed: true }),
    });
  }

  async function markAlertRead(alertId: string) {
    setAlerts((prev) =>
      prev.map((a) => (a.id === alertId ? { ...a, is_read: true } : a))
    );
    await fetch("/api/alerts", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ alert_id: alertId, is_read: true }),
    });
  }

  const currentBiz = businesses.find((b) => b.id === selectedBiz);
  const healthScore = currentBiz?.health_score;

  // Compute summary metrics from latest snapshot
  const latestSnapshot = snapshots[snapshots.length - 1];
  const prevSnapshot = snapshots.length >= 2 ? snapshots[snapshots.length - 2] : null;

  function getChange(current: number, prev: number | null | undefined) {
    if (!prev || prev === 0) return null;
    return Math.round(((current - prev) / prev) * 100);
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48 rounded-xl" />
        <div className="grid grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32 rounded-2xl" />
          ))}
        </div>
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    );
  }

  if (businesses.length === 0) {
    return (
      <div className="text-center py-20">
        <Activity className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <h2 className="font-display text-2xl text-foreground mb-2">No businesses yet</h2>
        <p className="text-sm text-muted-foreground font-body">
          Add a business from the Dashboard to start monitoring performance.
        </p>
      </div>
    );
  }

  const unreadAlerts = alerts.filter((a) => !a.is_read);

  return (
    <div className="space-y-6 opacity-0 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl text-foreground">Early-Warning Radar</h1>
          <p className="text-sm text-muted-foreground font-body mt-1">
            Monitor your GBP performance and catch issues before they impact revenue
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={String(days)} onValueChange={(v) => setDays(Number(v))}>
            <SelectTrigger className="w-32 h-9 rounded-lg font-body text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">7 days</SelectItem>
              <SelectItem value="30">30 days</SelectItem>
              <SelectItem value="60">60 days</SelectItem>
              <SelectItem value="90">90 days</SelectItem>
            </SelectContent>
          </Select>
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

      {/* Health score + metric cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {/* Health score */}
        <Card className="rounded-2xl border-gray-100 col-span-2 md:col-span-1">
          <CardContent className="p-6 text-center">
            <Heart className="w-5 h-5 text-primary mx-auto mb-2" />
            <div className={`font-display text-4xl ${
              (healthScore || 0) >= 70 ? "text-emerald-600" :
              (healthScore || 0) >= 40 ? "text-amber-600" : "text-red-600"
            }`}>
              {healthScore ?? "—"}
            </div>
            <p className="text-xs text-muted-foreground font-body mt-1">Health Score</p>
          </CardContent>
        </Card>

        {[
          { label: "Website Clicks", value: latestSnapshot?.website_clicks, prev: prevSnapshot?.website_clicks, icon: Globe },
          { label: "Call Clicks", value: latestSnapshot?.call_clicks, prev: prevSnapshot?.call_clicks, icon: Phone },
          { label: "Directions", value: latestSnapshot?.direction_requests, prev: prevSnapshot?.direction_requests, icon: MapPin },
          { label: "Impressions", value: (latestSnapshot?.search_impressions || 0) + (latestSnapshot?.maps_impressions || 0), prev: prevSnapshot ? (prevSnapshot.search_impressions || 0) + (prevSnapshot.maps_impressions || 0) : null, icon: Eye },
        ].map((metric) => {
          const change = getChange(metric.value || 0, metric.prev);
          return (
            <Card key={metric.label} className="rounded-2xl border-gray-100">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <metric.icon className="w-4 h-4 text-muted-foreground" />
                  {change !== null && (
                    <span className={`text-xs font-body font-medium flex items-center gap-0.5 ${
                      change > 0 ? "text-emerald-600" : change < 0 ? "text-red-600" : "text-gray-500"
                    }`}>
                      {change > 0 ? <TrendingUp className="w-3 h-3" /> : change < 0 ? <TrendingDown className="w-3 h-3" /> : null}
                      {change > 0 ? "+" : ""}{change}%
                    </span>
                  )}
                </div>
                <div className="font-display text-2xl text-foreground">
                  {metric.value ?? "—"}
                </div>
                <p className="text-xs text-muted-foreground font-body mt-0.5">{metric.label}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Trend chart (simple ASCII/bar representation) */}
      {snapshots.length > 0 && (
        <Card className="rounded-2xl border-gray-100">
          <CardHeader>
            <CardTitle className="font-display text-lg">Performance Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-1">
              {["Website", "Calls", "Directions", "Bookings", "Search", "Maps", "Photos"].map((label) => (
                <div key={label} className="text-[10px] text-muted-foreground font-body text-center truncate">
                  {label}
                </div>
              ))}
            </div>
            <div className="space-y-1 mt-2">
              {snapshots.slice(-14).map((snap) => {
                const max = Math.max(
                  snap.website_clicks, snap.call_clicks, snap.direction_requests,
                  snap.bookings, snap.search_impressions, snap.maps_impressions, snap.photo_views, 1
                );
                return (
                  <div key={snap.snapshot_date} className="flex items-center gap-1">
                    <span className="text-[9px] text-muted-foreground font-body w-16 shrink-0">
                      {new Date(snap.snapshot_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </span>
                    <div className="grid grid-cols-7 gap-1 flex-1">
                      {[
                        snap.website_clicks,
                        snap.call_clicks,
                        snap.direction_requests,
                        snap.bookings,
                        snap.search_impressions,
                        snap.maps_impressions,
                        snap.photo_views,
                      ].map((val, i) => (
                        <div key={i} className="h-4 bg-gray-100 rounded-sm overflow-hidden">
                          <div
                            className="h-full bg-primary/60 rounded-sm transition-all"
                            style={{ width: `${Math.max(2, (val / max) * 100)}%` }}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Alerts feed */}
      <div className="space-y-4">
        <h2 className="font-display text-xl text-foreground">
          Alerts
          {unreadAlerts.length > 0 && (
            <Badge className="ml-2 bg-red-100 text-red-700 border-0 rounded-full text-xs font-body">
              {unreadAlerts.length} new
            </Badge>
          )}
        </h2>

        {alerts.length === 0 ? (
          <Card className="rounded-2xl border-dashed border-2 border-gray-200">
            <CardContent className="p-12 text-center">
              <CheckCircle className="w-10 h-10 text-emerald-400 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground font-body">
                No alerts right now. Your GBP is looking good!
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {alerts.map((alert) => (
              <Card
                key={alert.id}
                className={`rounded-2xl transition-all ${
                  !alert.is_read ? "border-l-4" : "border-gray-100"
                } ${
                  alert.severity === "critical"
                    ? "border-l-red-500"
                    : alert.severity === "warning"
                      ? "border-l-amber-500"
                      : "border-l-blue-500"
                }`}
                onClick={() => !alert.is_read && markAlertRead(alert.id)}
              >
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                        alert.severity === "critical"
                          ? "bg-red-100"
                          : alert.severity === "warning"
                            ? "bg-amber-100"
                            : "bg-blue-100"
                      }`}>
                        {alert.severity === "critical" ? (
                          <AlertTriangle className="w-4 h-4 text-red-600" />
                        ) : alert.severity === "warning" ? (
                          <TrendingDown className="w-4 h-4 text-amber-600" />
                        ) : (
                          <Info className="w-4 h-4 text-blue-600" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-body font-semibold text-sm text-foreground">
                            {alert.title}
                          </h3>
                          {!alert.is_read && (
                            <span className="w-2 h-2 rounded-full bg-primary" />
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground font-body mt-1 leading-relaxed">
                          {alert.description}
                        </p>
                        {alert.metric_name && (
                          <div className="flex items-center gap-4 mt-2">
                            <span className="text-xs font-body text-muted-foreground">
                              {alert.metric_name}: {alert.metric_previous} → {alert.metric_current}
                              <span className={`ml-1 font-medium ${
                                (alert.metric_change_pct || 0) < 0 ? "text-red-600" : "text-emerald-600"
                              }`}>
                                ({(alert.metric_change_pct || 0) > 0 ? "+" : ""}{alert.metric_change_pct}%)
                              </span>
                            </span>
                          </div>
                        )}
                        {alert.recommendations && alert.recommendations.length > 0 && (
                          <div className="mt-3 space-y-1">
                            <p className="text-xs font-body font-medium text-foreground">Recommendations:</p>
                            {alert.recommendations.map((rec, i) => (
                              <p key={i} className="text-xs text-muted-foreground font-body flex items-start gap-1.5">
                                <span className="mt-1.5 w-1 h-1 rounded-full bg-primary shrink-0" />
                                {rec}
                              </p>
                            ))}
                          </div>
                        )}
                        <p className="text-[10px] text-muted-foreground/60 font-body mt-2">
                          {new Date(alert.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 rounded-lg text-muted-foreground hover:text-foreground shrink-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        dismissAlert(alert.id);
                      }}
                    >
                      <X className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
