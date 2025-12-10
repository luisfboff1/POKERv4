-- =============================================
-- POKER MANAGER - RANKING PERIODS
-- =============================================
-- Migration: Create ranking_periods table for historical rankings
-- Date: 2024-12-10
-- =============================================

-- =============================================
-- 1. CREATE RANKING_PERIODS TABLE
-- =============================================
-- This table stores custom ranking periods (semesters, quarters, etc.)
-- allowing admins to define date ranges for historical rankings
CREATE TABLE IF NOT EXISTS poker.ranking_periods (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER NOT NULL REFERENCES poker.tenants(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL, -- e.g., "1º Semestre 2024", "Novembro 2024"
  description TEXT, -- Optional description
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  is_active BOOLEAN DEFAULT true, -- Can be used to archive old periods
  created_by INTEGER REFERENCES poker.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure dates are valid (end_date must be after start_date)
  CONSTRAINT valid_date_range CHECK (end_date >= start_date),
  
  -- Prevent overlapping periods for the same tenant (optional, can be removed if overlaps are allowed)
  CONSTRAINT unique_tenant_period UNIQUE(tenant_id, name)
);

-- Indexes for ranking_periods
CREATE INDEX IF NOT EXISTS idx_ranking_periods_tenant_id ON poker.ranking_periods(tenant_id);
CREATE INDEX IF NOT EXISTS idx_ranking_periods_dates ON poker.ranking_periods(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_ranking_periods_is_active ON poker.ranking_periods(is_active);
CREATE INDEX IF NOT EXISTS idx_ranking_periods_created_by ON poker.ranking_periods(created_by);

-- =============================================
-- 2. ROW LEVEL SECURITY POLICIES
-- =============================================

-- Enable RLS on ranking_periods
ALTER TABLE poker.ranking_periods ENABLE ROW LEVEL SECURITY;

-- Users can see ranking periods from their own tenant
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
  );

-- =============================================
-- 3. GRANT PERMISSIONS
-- =============================================

-- Grant permissions on ranking_periods table
GRANT SELECT ON poker.ranking_periods TO authenticated;
GRANT INSERT, UPDATE, DELETE ON poker.ranking_periods TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE poker.ranking_periods_id_seq TO authenticated;

-- =============================================
-- 4. TRIGGER FOR UPDATED_AT
-- =============================================

-- Create trigger to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION poker.update_ranking_periods_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ranking_periods_updated_at
  BEFORE UPDATE ON poker.ranking_periods
  FOR EACH ROW
  EXECUTE FUNCTION poker.update_ranking_periods_updated_at();

-- =============================================
-- MIGRATION COMPLETE
-- =============================================
-- Admins can now create custom ranking periods
-- Users can view historical rankings by period
-- =============================================
