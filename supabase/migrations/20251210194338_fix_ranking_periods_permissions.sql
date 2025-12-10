-- =============================================
-- POKER MANAGER - FIX RANKING PERIODS PERMISSIONS
-- =============================================
-- Migration: Fix RLS policies for ranking_periods to allow INSERT
-- Date: 2025-12-10
-- =============================================

-- Drop the existing admin policy
DROP POLICY IF EXISTS "admins_manage_tenant_periods" ON poker.ranking_periods;

-- Recreate with WITH CHECK clause for INSERT operations
-- Admins can manage (create, update, delete) ranking periods for their tenant
CREATE POLICY "admins_manage_tenant_periods" ON poker.ranking_periods
  FOR ALL
  USING (
    tenant_id IN (
      SELECT ut.tenant_id 
      FROM poker.user_tenants ut
      JOIN poker.users u ON u.id = ut.user_id
      WHERE u.email = auth.jwt()->>'email'
        AND ut.role = 'admin'
    )
  )
  WITH CHECK (
    tenant_id IN (
      SELECT ut.tenant_id 
      FROM poker.user_tenants ut
      JOIN poker.users u ON u.id = ut.user_id
      WHERE u.email = auth.jwt()->>'email'
        AND ut.role = 'admin'
    )
  );

-- =============================================
-- MIGRATION COMPLETE
-- =============================================
-- Fixed: Admins can now INSERT ranking periods
-- =============================================
