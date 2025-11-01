-- =============================================
-- POKER MANAGER - DROP AND RECREATE POKER SCHEMA
-- =============================================
-- Migration: Drop and recreate poker schema
-- Date: 2025-10-30
-- =============================================

-- Drop poker schema if it exists (cascade to drop all objects)
DROP SCHEMA IF EXISTS poker CASCADE;

-- Create poker schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS poker;

-- Grant usage on schema to authenticated users
GRANT USAGE ON SCHEMA poker TO authenticated;
GRANT USAGE ON SCHEMA poker TO anon;
