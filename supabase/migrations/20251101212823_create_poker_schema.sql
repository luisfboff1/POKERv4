-- =============================================
-- POKER MANAGER - CREATE POKER SCHEMA
-- =============================================
-- Migration: Create poker schema
-- Date: 2025-11-01
-- =============================================

-- Create poker schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS poker;

-- Grant usage on schema to authenticated users
GRANT USAGE ON SCHEMA poker TO authenticated;
GRANT USAGE ON SCHEMA poker TO anon;
