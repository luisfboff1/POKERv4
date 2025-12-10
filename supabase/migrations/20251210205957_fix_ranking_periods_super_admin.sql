-- =============================================
-- POKER MANAGER - FIX RANKING PERIODS PERMISSIONS (SUPER_ADMIN)
-- =============================================
-- Migration: Fix RLS policies to include super_admin role
-- Date: 2025-12-10
-- =============================================

-- Drop the existing admin policy
DROP POLICY IF EXISTS "admins_manage_tenant_periods" ON poker.ranking_periods;

-- Recreate with WITH CHECK clause and super_admin support
-- Admins and super_admins can manage (create, update, delete) ranking periods for their tenant
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
-- MIGRATION COMPLETE
-- =============================================
-- Fixed: Admins AND super_admins can now INSERT ranking periods
-- =============================================
