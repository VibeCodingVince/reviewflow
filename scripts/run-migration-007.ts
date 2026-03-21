/**
 * Run migration 007 - Fix Google OAuth user creation
 *
 * This script applies the migration to fix the handle_new_user trigger
 * so it properly extracts the user's name from Google OAuth metadata.
 *
 * Usage: npx tsx scripts/run-migration-007.ts
 */

import { readFileSync } from "fs";
import { join } from "path";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error("❌ Missing Supabase credentials in .env.local");
  console.error("Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

async function runMigration() {
  const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_KEY!);

  console.log("🔄 Running migration 007...");

  // Read migration file
  const migrationPath = join(process.cwd(), "supabase", "migrations", "007_fix_google_oauth.sql");
  const sql = readFileSync(migrationPath, "utf-8");

  try {
    // Execute migration
    const { error } = await supabase.rpc("exec_sql", { sql });

    if (error) {
      // If exec_sql doesn't exist, try direct query
      const { error: directError } = await supabase.from("_migrations").select("*").limit(1);

      if (directError) {
        console.log("⚠️  exec_sql RPC not available, running SQL directly...");

        // Split SQL into statements and execute
        const statements = sql
          .split(";")
          .map(s => s.trim())
          .filter(s => s.length > 0);

        for (const statement of statements) {
          const { error: stmtError } = await supabase.rpc("exec", { sql: statement });
          if (stmtError) {
            throw stmtError;
          }
        }
      } else {
        throw error;
      }
    }

    console.log("✅ Migration 007 applied successfully!");
    console.log("\n📝 What changed:");
    console.log("   - Updated handle_new_user() trigger function");
    console.log("   - Now properly extracts name from Google OAuth metadata");
    console.log("   - Falls back to email username if no name provided");
    console.log("\n🎉 Google OAuth signup should now work correctly!");

  } catch (err) {
    console.error("❌ Migration failed:", err);
    console.log("\n📋 Manual steps:");
    console.log("1. Go to: https://supabase.com/dashboard/project/vdkujkrurjqklkpofpmz/sql");
    console.log("2. Copy and paste the SQL from: supabase/migrations/007_fix_google_oauth.sql");
    console.log("3. Click 'Run' to execute the migration");
    process.exit(1);
  }
}

runMigration();
