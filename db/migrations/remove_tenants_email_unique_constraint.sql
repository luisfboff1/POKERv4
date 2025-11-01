-- Remove unique constraint from tenants.email to allow users to participate in multiple tenants
-- Migration: remove_tenants_email_unique_constraint

-- Drop the unique constraint on tenants.email
ALTER TABLE poker.tenants DROP CONSTRAINT IF EXISTS tenants_email_key;

-- Add a comment explaining the change
COMMENT ON COLUMN poker.tenants.email IS 'Tenant contact email - not unique to allow users to participate in multiple tenants';