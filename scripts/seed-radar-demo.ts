/**
 * Seed script for Radar demo data.
 *
 * Usage: npx tsx scripts/seed-radar-demo.ts
 *
 * Requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { resolve } from "path";

// Parse .env.local manually (no dotenv dependency)
const envPath = resolve(__dirname, "../.env.local");
const envContent = readFileSync(envPath, "utf-8");
for (const line of envContent.split("\n")) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) continue;
  const eqIdx = trimmed.indexOf("=");
  if (eqIdx === -1) continue;
  const key = trimmed.slice(0, eqIdx).trim();
  const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, "");
  if (!process.env[key]) process.env[key] = val;
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !serviceKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey);

async function seed() {
  console.log("🌱 Seeding Radar demo data...\n");

  // 1. Find existing user, or bail
  const { data: users, error: userErr } = await supabase
    .from("users")
    .select("*")
    .limit(1);

  if (userErr || !users?.length) {
    console.error("No users found. Sign up first at /login, then re-run this script.");
    process.exit(1);
  }

  const user = users[0];
  console.log(`Found user: ${user.email} (${user.id})`);

  // 2. Upgrade user to Pro
  const { error: upgradeErr } = await supabase
    .from("users")
    .update({
      subscription_status: "active",
      subscription_tier: "pro",
    })
    .eq("id", user.id);

  if (upgradeErr) {
    console.error("Failed to upgrade user:", upgradeErr.message);
    process.exit(1);
  }
  console.log("✅ User upgraded to Pro tier\n");

  // 3. Find or create a demo business
  let { data: businesses } = await supabase
    .from("businesses")
    .select("*")
    .eq("user_id", user.id)
    .limit(1);

  let businessId: string;

  if (businesses?.length) {
    businessId = businesses[0].id;
    console.log(`Found existing business: ${businesses[0].business_name} (${businessId})`);
  } else {
    const { data: newBiz, error: bizErr } = await supabase
      .from("businesses")
      .insert({
        user_id: user.id,
        business_name: "The Green Bean Café",
        business_type: "restaurant",
        tone: "friendly",
        radar_enabled: true,
        review_shield_enabled: true,
        action_planner_enabled: true,
      })
      .select()
      .single();

    if (bizErr || !newBiz) {
      console.error("Failed to create business:", bizErr?.message);
      process.exit(1);
    }
    businessId = newBiz.id;
    console.log(`Created demo business: The Green Bean Café (${businessId})`);
  }

  // Enable radar + set health score on business
  await supabase
    .from("businesses")
    .update({ radar_enabled: true, health_score: 74 })
    .eq("id", businessId);

  console.log("✅ Business configured with radar_enabled + health_score: 74\n");

  // 4. Seed 30 days of performance snapshots
  console.log("📊 Generating 30 days of performance snapshots...");

  // Delete existing snapshots for clean demo
  await supabase
    .from("performance_snapshots")
    .delete()
    .eq("business_id", businessId);

  const snapshots = [];
  const today = new Date();

  // Base metrics with a realistic "dip" story
  const baseMetrics = {
    website_clicks: 45,
    call_clicks: 12,
    direction_requests: 18,
    bookings: 5,
    search_impressions: 320,
    maps_impressions: 210,
    photo_views: 85,
  };

  for (let i = 29; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split("T")[0];

    // Create a story: steady → dip around day 10-15 → recovery
    let multiplier = 1.0;
    if (i >= 15 && i <= 20) {
      // Dip period (10-15 days ago)
      multiplier = 0.6 + Math.random() * 0.15;
    } else if (i >= 10 && i < 15) {
      // Recovery
      multiplier = 0.75 + Math.random() * 0.15;
    } else {
      // Normal with some variance
      multiplier = 0.9 + Math.random() * 0.25;
    }

    // Weekend dip
    const dayOfWeek = date.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      multiplier *= 0.7;
    }

    snapshots.push({
      business_id: businessId,
      snapshot_date: dateStr,
      website_clicks: Math.round(baseMetrics.website_clicks * multiplier),
      call_clicks: Math.round(baseMetrics.call_clicks * multiplier),
      direction_requests: Math.round(baseMetrics.direction_requests * multiplier),
      bookings: Math.round(baseMetrics.bookings * multiplier),
      search_impressions: Math.round(baseMetrics.search_impressions * multiplier),
      maps_impressions: Math.round(baseMetrics.maps_impressions * multiplier),
      photo_views: Math.round(baseMetrics.photo_views * multiplier),
    });
  }

  const { error: snapErr } = await supabase
    .from("performance_snapshots")
    .insert(snapshots);

  if (snapErr) {
    console.error("Failed to insert snapshots:", snapErr.message);
    process.exit(1);
  }
  console.log(`✅ Inserted ${snapshots.length} performance snapshots\n`);

  // 5. Seed alerts
  console.log("🚨 Creating demo alerts...");

  await supabase
    .from("alerts")
    .delete()
    .eq("business_id", businessId);

  const alertData = [
    {
      business_id: businessId,
      alert_type: "metric_drop",
      severity: "critical",
      title: "Website Clicks Down 38%",
      description:
        "Website clicks dropped from 48 to 30 compared to the previous period. This is a significant decline that could indicate a search ranking change or a competitor gaining visibility.",
      recommendations: [
        "Check your Google Business Profile for any pending verifications or policy warnings",
        "Review recent changes to your business description or categories",
        "Post a Google Update with a strong CTA to drive website traffic",
        "Consider adding new photos to boost engagement signals",
      ],
      metric_name: "Website Clicks",
      metric_previous: 48,
      metric_current: 30,
      metric_change_pct: -38,
      is_read: false,
      is_dismissed: false,
      created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
    },
    {
      business_id: businessId,
      alert_type: "metric_drop",
      severity: "warning",
      title: "Direction Requests Declining",
      description:
        "Direction requests have been trending down over the past 7 days, dropping 22% below your 30-day average. This may indicate reduced foot traffic intent.",
      recommendations: [
        "Verify your business address and pin location are accurate on Google Maps",
        "Add or update your service area if you serve nearby neighborhoods",
        "Encourage recent customers to leave reviews mentioning their visit",
      ],
      metric_name: "Direction Requests",
      metric_previous: 18,
      metric_current: 14,
      metric_change_pct: -22,
      is_read: false,
      is_dismissed: false,
      created_at: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(), // 8 hours ago
    },
    {
      business_id: businessId,
      alert_type: "metric_spike",
      severity: "info",
      title: "Photo Views Up 15%",
      description:
        "Your photo views increased by 15% this week. This is a positive engagement signal — users are browsing your visual content more than usual.",
      recommendations: [
        "Keep the momentum going — add 2-3 new high-quality photos this week",
        "Consider adding photos of your most popular menu items or services",
      ],
      metric_name: "Photo Views",
      metric_previous: 78,
      metric_current: 90,
      metric_change_pct: 15,
      is_read: true,
      is_dismissed: false,
      created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
    },
    {
      business_id: businessId,
      alert_type: "review_surge",
      severity: "warning",
      title: "Unusual Review Activity Detected",
      description:
        "3 new reviews were posted within a 2-hour window, which is unusual for your business. Review Shield is analyzing them for authenticity.",
      recommendations: [
        "Check Review Shield for spam analysis results",
        "Respond promptly to legitimate reviews to show engagement",
        "If reviews appear fake, use the Flag tool to report them to Google",
      ],
      metric_name: null,
      metric_previous: null,
      metric_current: null,
      metric_change_pct: null,
      is_read: false,
      is_dismissed: false,
      created_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), // 4 hours ago
    },
  ];

  const { error: alertErr } = await supabase.from("alerts").insert(alertData);

  if (alertErr) {
    console.error("Failed to insert alerts:", alertErr.message);
    process.exit(1);
  }
  console.log(`✅ Inserted ${alertData.length} alerts (3 unread, 1 read)\n`);

  // Summary
  console.log("═══════════════════════════════════════════════");
  console.log("🎉 Demo data seeded successfully!");
  console.log("═══════════════════════════════════════════════");
  console.log("");
  console.log("To see the demo:");
  console.log("  1. npm run dev");
  console.log("  2. Log in with your account");
  console.log("  3. Navigate to /radar");
  console.log("");
  console.log("You'll see:");
  console.log("  • Health score: 74 (amber zone)");
  console.log("  • 30 days of performance data with a visible dip");
  console.log("  • 4 alerts: 1 critical, 2 warnings, 1 info");
  console.log("  • Unread badges + dismiss/read interactions");
}

seed().catch(console.error);
