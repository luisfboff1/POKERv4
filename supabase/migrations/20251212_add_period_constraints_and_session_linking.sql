-- =============================================
-- POKER MANAGER - RANKING PERIODS ENHANCEMENTS
-- =============================================
-- Migration: Add overlapping constraint and session linking
-- Date: 2025-12-12
-- =============================================

-- =============================================
-- 1. ADD CONSTRAINT TO PREVENT OVERLAPPING PERIODS
-- =============================================
-- Enable btree_gist extension (required for exclusion constraints)
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- Drop existing unique constraint on (tenant_id, name) to recreate it after
ALTER TABLE poker.ranking_periods
  DROP CONSTRAINT IF EXISTS unique_tenant_period;

-- Create exclusion constraint to prevent overlapping date ranges
-- This ensures no two periods for the same tenant can have overlapping dates
ALTER TABLE poker.ranking_periods
  ADD CONSTRAINT no_overlapping_periods
  EXCLUDE USING gist (
    tenant_id WITH =,
    daterange(start_date, end_date, '[]') WITH &&
  );

-- Re-add unique name constraint (good practice)
ALTER TABLE poker.ranking_periods
  ADD CONSTRAINT unique_tenant_period_name UNIQUE(tenant_id, name);

-- =============================================
-- 2. ADD RANKING_PERIOD_ID TO SESSIONS
-- =============================================
-- Add nullable foreign key column
ALTER TABLE poker.sessions
  ADD COLUMN IF NOT EXISTS ranking_period_id INTEGER
  REFERENCES poker.ranking_periods(id) ON DELETE SET NULL;

-- Add index for performance when filtering sessions by period
CREATE INDEX IF NOT EXISTS idx_sessions_ranking_period
  ON poker.sessions(ranking_period_id);

-- Add compound index for tenant + period lookups
CREATE INDEX IF NOT EXISTS idx_sessions_tenant_period
  ON poker.sessions(tenant_id, ranking_period_id);

-- =============================================
-- 3. HELPER FUNCTION: FIND PERIOD FOR A DATE
-- =============================================
-- Returns the ID of the active ranking period that contains a given date
-- Returns NULL if no matching period exists
CREATE OR REPLACE FUNCTION poker.find_period_for_date(
  p_tenant_id INTEGER,
  p_date DATE
)
RETURNS INTEGER AS $$
DECLARE
  v_period_id INTEGER;
BEGIN
  SELECT id INTO v_period_id
  FROM poker.ranking_periods
  WHERE tenant_id = p_tenant_id
    AND p_date >= start_date
    AND p_date <= end_date
    AND is_active = true
  ORDER BY created_at DESC
  LIMIT 1;

  RETURN v_period_id;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- 4. HELPER FUNCTION: GET CURRENT PERIOD
-- =============================================
-- Returns the ranking period that contains today's date (if any)
-- Used by frontend to show current period statistics
CREATE OR REPLACE FUNCTION poker.get_current_period(p_tenant_id INTEGER)
RETURNS TABLE(
  id INTEGER,
  name VARCHAR,
  description TEXT,
  start_date DATE,
  end_date DATE
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    rp.id,
    rp.name,
    rp.description,
    rp.start_date,
    rp.end_date
  FROM poker.ranking_periods rp
  WHERE rp.tenant_id = p_tenant_id
    AND CURRENT_DATE >= rp.start_date
    AND CURRENT_DATE <= rp.end_date
    AND rp.is_active = true
  ORDER BY rp.created_at DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- 5. TRIGGER: AUTO-ASSIGN PERIOD ON SESSION INSERT
-- =============================================
-- Automatically assigns ranking_period_id when a new session is created
-- based on the session's date
CREATE OR REPLACE FUNCTION poker.auto_assign_period_to_session()
RETURNS TRIGGER AS $$
DECLARE
  v_period_id INTEGER;
BEGIN
  -- Find matching period for session date
  v_period_id := poker.find_period_for_date(NEW.tenant_id, NEW.date);

  -- Assign if found (leave NULL if no matching period)
  IF v_period_id IS NOT NULL THEN
    NEW.ranking_period_id := v_period_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS trigger_auto_assign_period ON poker.sessions;

-- Create trigger on INSERT
CREATE TRIGGER trigger_auto_assign_period
  BEFORE INSERT ON poker.sessions
  FOR EACH ROW
  EXECUTE FUNCTION poker.auto_assign_period_to_session();

-- =============================================
-- 6. GRANT PERMISSIONS
-- =============================================
-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION poker.find_period_for_date(INTEGER, DATE) TO authenticated;
GRANT EXECUTE ON FUNCTION poker.get_current_period(INTEGER) TO authenticated;

-- =============================================
-- 7. COMMENTS FOR DOCUMENTATION
-- =============================================
COMMENT ON COLUMN poker.sessions.ranking_period_id IS
  'Foreign key to ranking_periods. Automatically assigned based on session date. NULL means session is not associated with any period.';

COMMENT ON CONSTRAINT no_overlapping_periods ON poker.ranking_periods IS
  'Prevents creating periods with overlapping date ranges for the same tenant.';

COMMENT ON FUNCTION poker.find_period_for_date(INTEGER, DATE) IS
  'Finds the active ranking period that contains the given date for a tenant. Returns period ID or NULL.';

COMMENT ON FUNCTION poker.get_current_period(INTEGER) IS
  'Returns the current active ranking period (that contains today) for a tenant.';

-- =============================================
-- MIGRATION COMPLETE
-- =============================================
-- Summary of changes:
-- ✅ Exclusion constraint prevents overlapping periods
-- ✅ Sessions now have ranking_period_id column
-- ✅ Automatic period assignment on session creation
-- ✅ Helper functions for current period queries
-- ✅ Indexes for optimized queries
-- =============================================
