-- Add supabase_user_id to poker.users for linking to auth.users
-- This allows us to maintain the relationship between Supabase Auth and our custom users table

ALTER TABLE poker.users
ADD COLUMN IF NOT EXISTS supabase_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_supabase_user_id ON poker.users(supabase_user_id);

-- Add unique constraint to ensure one-to-one relationship
ALTER TABLE poker.users
ADD CONSTRAINT unique_supabase_user_id UNIQUE (supabase_user_id);

COMMENT ON COLUMN poker.users.supabase_user_id IS 'Links to auth.users for Supabase authentication';
