# Fix for "permission denied for schema poker" Error

## Problem Description

You're encountering the following error when trying to fetch user data or perform database operations:

```
Error fetching user: {
  code: '42501',
  details: null,
  hint: null,
  message: 'permission denied for schema poker'
}
```

This error occurs even though the `poker` schema is exposed in the Supabase Dashboard's "Exposed schemas" setting.

## Root Cause

The error happens because the PostgreSQL roles (`anon`, `authenticated`, `service_role`) that Supabase uses don't have the necessary permissions to access tables in the `poker` schema. Simply exposing the schema in the API settings is not enough - you must also grant explicit database permissions.

## Solution

Follow these steps **in order** to fix the issue:

### Step 1: Verify Schema Setup

First, check if your tables are in the `poker` schema or the `public` schema.

1. Go to Supabase Dashboard → SQL Editor
2. Run this query:

```sql
SELECT table_schema, table_name 
FROM information_schema.tables 
WHERE table_name IN ('users', 'tenants', 'players', 'sessions')
ORDER BY table_schema, table_name;
```

3. Check the results:
   - If tables are in `public` schema → Go to Step 2
   - If tables are in `poker` schema → Skip to Step 3

### Step 2: Migrate Tables to Poker Schema (if needed)

If your tables are still in the `public` schema, run the migration:

1. Go to Supabase Dashboard → SQL Editor
2. Open and run the file: `db/migrate_to_poker_schema.sql`
3. Wait for the migration to complete (should take a few seconds)

### Step 3: Fix Permissions

This is the **critical step** that fixes the permission error:

1. Go to Supabase Dashboard → SQL Editor
2. Open and run the file: `db/fix_poker_schema_permissions.sql`
3. Verify the permissions were applied by running:

```sql
SELECT 
  grantee, 
  privilege_type, 
  table_name 
FROM information_schema.role_table_grants 
WHERE grantee IN ('anon', 'authenticated', 'service_role') 
  AND table_schema = 'poker'
ORDER BY table_name, grantee, privilege_type;
```

You should see `SELECT` permissions for `anon` and multiple permissions for `authenticated` and `service_role`.

### Step 4: Verify Exposed Schema Setting

Ensure the poker schema is exposed in the API:

1. Go to Supabase Dashboard → Settings → API → API Settings
2. Find "Exposed schemas" configuration
3. Ensure it includes `poker` (example: `public, graphql_public, poker`)
4. Save if you made changes

### Step 5: Test the Fix

1. Clear your browser cache and cookies
2. Try logging in to the application
3. Check browser console for any errors
4. **Verify permissions** by running: `db/verify_poker_schema_permissions.sql`
   - This script checks all permissions are correctly set
   - All checks should pass with no errors
5. If you still see errors, check Supabase logs in Dashboard → Logs

## What Each Permission Does

- **`anon` role**: Used for unauthenticated API requests (e.g., initial page loads)
  - Needs: `USAGE` on schema, `SELECT` on tables (read-only)
  
- **`authenticated` role**: Used after user login
  - Needs: Full CRUD permissions (`SELECT`, `INSERT`, `UPDATE`, `DELETE`)
  
- **`service_role` role**: Used by server-side code (bypasses RLS)
  - Needs: All privileges (full access)

## Troubleshooting

### If you still get permission errors:

1. **Check RLS policies**: Row Level Security policies might be blocking access
   ```sql
   SELECT tablename, policyname, permissive, roles, cmd 
   FROM pg_policies 
   WHERE schemaname = 'poker';
   ```

2. **Verify schema ownership**:
   ```sql
   SELECT schema_name, schema_owner 
   FROM information_schema.schemata 
   WHERE schema_name = 'poker';
   ```

3. **Check if tables exist in poker schema**:
   ```sql
   SELECT table_name 
   FROM information_schema.tables 
   WHERE table_schema = 'poker';
   ```

4. **Review Supabase logs**: Go to Dashboard → Logs → Postgres Logs

### If tables are not in poker schema:

Run the migration script first:
```sql
-- db/migrate_to_poker_schema.sql
```

### If you get "relation does not exist" errors:

This means your application is looking for tables in the wrong schema. Verify:

1. Your Supabase client configuration includes `db: { schema: 'poker' }`
2. The tables actually exist in the poker schema (not public)

## Code References

The application is already configured to use the poker schema:

- `lib/supabaseClient.ts` - line 22: `schema: 'poker'`
- `lib/supabaseServer.ts` - line 26: `schema: 'poker'`

These configurations tell Supabase to look for tables in the `poker` schema instead of the default `public` schema.

## Additional Notes

- The permissions are set to automatically apply to future tables/sequences/functions created in the poker schema
- If you modify or recreate tables, you may need to re-run the permissions script
- RLS policies are still enforced and provide row-level security on top of these permissions
- The `service_role` key bypasses RLS and should be kept secret (never exposed in client-side code)

## Summary

The fix involves:
1. ✅ Tables in `poker` schema (migrate if needed)
2. ✅ Proper permissions granted to PostgreSQL roles
3. ✅ Schema exposed in Supabase API settings
4. ✅ Application configured to use `poker` schema

After completing all steps, the "permission denied for schema poker" error should be resolved.
