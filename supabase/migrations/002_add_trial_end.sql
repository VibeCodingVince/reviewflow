-- Add trial_end column to users table
ALTER TABLE users ADD COLUMN trial_end timestamptz;
