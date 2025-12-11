-- =============================================
-- POKER MANAGER - VERIFY AND FIX RANKING PERIODS PERMISSIONS
-- =============================================
-- Migration: Ensure RLS policies work correctly for super_admin
-- Date: 2025-12-11
-- =============================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "users_see_own_tenant_periods" ON poker.ranking_periods;
DROP POLICY IF EXISTS "admins_manage_tenant_periods" ON poker.ranking_periods;

-- =============================================
-- 1. POLICY FOR VIEWING RANKING PERIODS
-- =============================================
-- All users can see ranking periods from their own tenant
CREATE POLICY "users_see_own_tenant_periods" ON poker.ranking_periods
  FOR SELECT
  USING (
    tenant_id IN (
      SELECT ut.tenant_id
      FROM poker.user_tenants ut
      JOIN poker.users u ON u.id = ut.user_id
      WHERE u.email = auth.jwt()->>'email'
    )
  );

-- =============================================
-- 2. POLICY FOR MANAGING RANKING PERIODS
-- =============================================
-- Admins and super_admins can manage (create, update, delete) ranking periods
CREATE POLICY "admins_manage_tenant_periods" ON poker.ranking_periods
  FOR ALL
  USING (
    tenant_id IN (
      SELECT ut.tenant_id
      FROM poker.user_tenants ut
      JOIN poker.users u ON u.id = ut.user_id
      WHERE u.email = auth.jwt()->>'email'
        AND (ut.role = 'admin' OR u.role = 'super_admin')
    )
  )
  WITH CHECK (
    tenant_id IN (
      SELECT ut.tenant_id
      FROM poker.user_tenants ut
      JOIN poker.users u ON u.id = ut.user_id
      WHERE u.email = auth.jwt()->>'email'
        AND (ut.role = 'admin' OR u.role = 'super_admin')
    )
  );

-- =============================================
-- 3. VERIFY PERMISSIONS
-- =============================================
-- Grant necessary permissions
GRANT SELECT ON poker.ranking_periods TO authenticated;
GRANT INSERT, UPDATE, DELETE ON poker.ranking_periods TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE poker.ranking_periods_id_seq TO authenticated;

-- =============================================
-- MIGRATION COMPLETE
-- =============================================
-- Run this script in your Supabase SQL Editor to fix permissions
-- =============================================
