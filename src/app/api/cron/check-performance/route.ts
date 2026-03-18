import { createAdminClient } from "@/lib/supabase/admin";
import { isSubscriptionActive } from "@/lib/subscription";
import { getAccessToken, fetchPerformanceMetrics } from "@/lib/google";
import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createAdminClient();

    // Get businesses with radar enabled and Pro tier
    const { data: businesses, error: bizError } = await supabase
      .from("businesses")
      .select("*, users!inner(*)")
      .eq("radar_enabled", true)
      .eq("is_active", true)
      .not("google_refresh_token", "is", null);

    if (bizError || !businesses) {
      return NextResponse.json({ error: "Failed to fetch businesses" }, { status: 500 });
    }

    const results = [];

    for (const business of businesses) {
      try {
        if (!isSubscriptionActive(business.users) || business.users.subscription_tier !== "pro") {
          continue;
        }

        await new Promise((resolve) => setTimeout(resolve, 200));

        const accessToken = await getAccessToken(business.google_refresh_token!);
        const metrics = await fetchPerformanceMetrics(accessToken, business.google_account_id!);

        const today = new Date();
        const snapshotDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

        // Upsert today's snapshot
        await supabase.from("performance_snapshots").upsert(
          {
            business_id: business.id,
            snapshot_date: snapshotDate,
            website_clicks: metrics.websiteClicks,
            call_clicks: metrics.callClicks,
            direction_requests: metrics.directionRequests,
            bookings: metrics.bookings,
            search_impressions: metrics.searchImpressions,
            maps_impressions: metrics.mapsImpressions,
            photo_views: metrics.photoViews,
          },
          { onConflict: "business_id,snapshot_date" }
        );

        // Get last 7 days for comparison
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        const weekAgoStr = `${weekAgo.getFullYear()}-${String(weekAgo.getMonth() + 1).padStart(2, "0")}-${String(weekAgo.getDate()).padStart(2, "0")}`;

        const { data: recentSnapshots } = await supabase
          .from("performance_snapshots")
          .select("*")
          .eq("business_id", business.id)
          .gte("snapshot_date", weekAgoStr)
          .order("snapshot_date", { ascending: false });

        // Detect anomalies
        const alerts = [];
        if (recentSnapshots && recentSnapshots.length >= 2) {
          const current = recentSnapshots[0];
          // Average of previous days (excluding today)
          const previous = recentSnapshots.slice(1);

          const metricKeys = [
            { key: "website_clicks", label: "Website Clicks" },
            { key: "call_clicks", label: "Phone Calls" },
            { key: "direction_requests", label: "Direction Requests" },
            { key: "search_impressions", label: "Search Impressions" },
            { key: "maps_impressions", label: "Maps Impressions" },
          ] as const;

          for (const { key, label } of metricKeys) {
            const prevAvg = previous.reduce((sum: number, s: Record<string, number>) => sum + (s[key] || 0), 0) / previous.length;
            const currentVal = current[key] || 0;

            if (prevAvg > 0) {
              const changePct = ((currentVal - prevAvg) / prevAvg) * 100;

              if (changePct <= -20) {
                alerts.push({
                  metric_name: label,
                  metric_previous: Math.round(prevAvg),
                  metric_current: currentVal,
                  metric_change_pct: Math.round(changePct),
                  type: "metric_drop" as const,
                  severity: changePct <= -50 ? "critical" as const : "warning" as const,
                });
              } else if (changePct >= 50) {
                alerts.push({
                  metric_name: label,
                  metric_previous: Math.round(prevAvg),
                  metric_current: currentVal,
                  metric_change_pct: Math.round(changePct),
                  type: "metric_spike" as const,
                  severity: "info" as const,
                });
              }
            }
          }
        }

        // Generate AI alerts for anomalies
        for (const alert of alerts) {
          await new Promise((resolve) => setTimeout(resolve, 200));

          const message = await anthropic.messages.create({
            model: "claude-sonnet-4-20250514",
            max_tokens: 400,
            system: `You are a Google Business Profile performance analyst. Generate a brief, actionable alert for a business owner. Respond with ONLY valid JSON:
{
  "title": "Short alert title",
  "description": "2-3 sentence plain-English explanation of what happened and why it might matter",
  "recommendations": ["action 1", "action 2", "action 3"]
}`,
            messages: [
              {
                role: "user",
                content: `Business: ${business.business_name} (${business.business_type})
Metric: ${alert.metric_name}
Previous avg (7d): ${alert.metric_previous}
Current: ${alert.metric_current}
Change: ${alert.metric_change_pct}%
Type: ${alert.type === "metric_drop" ? "DECLINE" : "INCREASE"}`,
              },
            ],
          });

          const text = message.content[0].type === "text" ? message.content[0].text : "{}";
          try {
            const parsed = JSON.parse(text);
            await supabase.from("alerts").insert({
              business_id: business.id,
              alert_type: alert.type,
              severity: alert.severity,
              title: parsed.title || `${alert.metric_name} ${alert.type === "metric_drop" ? "dropped" : "spiked"}`,
              description: parsed.description || "",
              recommendations: parsed.recommendations || [],
              metric_name: alert.metric_name,
              metric_previous: alert.metric_previous,
              metric_current: alert.metric_current,
              metric_change_pct: alert.metric_change_pct,
            });
          } catch {
            // Silently skip malformed AI response
          }
        }

        // Compute health score (0-100)
        const healthScore = computeHealthScore(recentSnapshots || []);
        await supabase
          .from("businesses")
          .update({ health_score: healthScore })
          .eq("id", business.id);

        results.push({
          business: business.business_name,
          snapshotSaved: true,
          alertsGenerated: alerts.length,
          healthScore,
        });
      } catch (err) {
        console.error(`Cron: Performance check failed for ${business.id}:`, err);
        results.push({
          business: business.business_name,
          error: "Processing failed",
        });
      }
    }

    return NextResponse.json({ results });
  } catch (error) {
    console.error("Cron check-performance error:", error);
    return NextResponse.json({ error: "Cron job failed" }, { status: 500 });
  }
}

function computeHealthScore(snapshots: Array<Record<string, number>>): number {
  if (snapshots.length === 0) return 50;

  // Score based on: presence of activity, trends, and magnitude
  let score = 50; // Base score

  const latest = snapshots[0];
  const totalActivity =
    (latest.website_clicks || 0) +
    (latest.call_clicks || 0) +
    (latest.direction_requests || 0) +
    (latest.search_impressions || 0) +
    (latest.maps_impressions || 0);

  // Activity bonus (up to +25)
  if (totalActivity > 0) score += Math.min(25, Math.floor(totalActivity / 10));

  // Trend bonus/penalty (up to ±25)
  if (snapshots.length >= 3) {
    const recent = snapshots.slice(0, 3);
    const older = snapshots.slice(3);
    if (older.length > 0) {
      const recentAvg = recent.reduce((s, r) =>
        s + (r.website_clicks || 0) + (r.call_clicks || 0) + (r.direction_requests || 0), 0) / recent.length;
      const olderAvg = older.reduce((s, r) =>
        s + (r.website_clicks || 0) + (r.call_clicks || 0) + (r.direction_requests || 0), 0) / older.length;

      if (olderAvg > 0) {
        const trend = ((recentAvg - olderAvg) / olderAvg) * 100;
        score += Math.max(-25, Math.min(25, Math.round(trend / 4)));
      }
    }
  }

  return Math.max(0, Math.min(100, score));
}
