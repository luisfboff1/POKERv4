# Quick Fix: "permission denied for schema poker"

## Error You're Seeing
```
Error fetching user: {
  code: '42501',
  message: 'permission denied for schema poker'
}
```

## Why It Happens
Even though you've exposed the `poker` schema in Supabase Dashboard (in Settings → API → Exposed schemas), PostgreSQL needs **explicit permission grants** for the database roles to access the schema. The API settings make the schema accessible to the API layer, but the database itself still enforces its own permission model.

## The Fix (3 Steps)

### 1. Run Permission Fix
Open Supabase Dashboard → SQL Editor, and execute:
```sql
-- Copy and paste the entire content of this file:
db/fix_poker_schema_permissions.sql
```

### 2. Verify It Worked (Optional but Recommended)
In the same SQL Editor, run:
```sql
-- Copy and paste the entire content of this file:
db/verify_poker_schema_permissions.sql
```
All checks should pass without errors.

### 3. Test Your App
- Clear browser cache/cookies
- Reload the application
- Try logging in
- Should work! ✅

## After Fixing Permissions

If permissions are fixed but you still get **`User not found`** error:

This means you can authenticate but don't have a record in `poker.users`. 

**Quick Fix:**
1. Open `db/create_user_for_auth.sql`
2. Replace `seu-email@exemplo.com` with your login email (4 places)
3. Replace placeholder names with your info
4. Run in Supabase SQL Editor
5. Try login again ✅

📖 **See**: [`SYNC_AUTH_USERS.md`](./SYNC_AUTH_USERS.md) for full details.

## What the Fix Does

```sql
-- Grants read access to anon role (used for API requests)
GRANT USAGE ON SCHEMA poker TO anon;
GRANT SELECT ON ALL TABLES IN SCHEMA poker TO anon;

-- Grants full CRUD to authenticated role (logged-in users)
GRANT USAGE ON SCHEMA poker TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA poker TO authenticated;

-- Grants full access to service_role (server-side code)
GRANT ALL ON SCHEMA poker TO service_role;
GRANT ALL ON ALL TABLES IN SCHEMA poker TO service_role;

-- Plus sequences, functions, and default privileges for future objects
```

## Still Not Working?

### Check 1: Is poker in exposed schemas?
Dashboard → Settings → API → Exposed schemas should include `poker`
(This should show ✅ when properly configured)

### Check 2: Are tables in poker schema?
```sql
SELECT table_schema, table_name 
FROM information_schema.tables 
WHERE table_name IN ('users', 'tenants');
```
Should return `poker` as table_schema, not `public`.

If tables are in `public`, run first:
```sql
-- db/migrate_to_poker_schema.sql
```

### Check 3: Review Supabase Logs
Dashboard → Logs → Postgres Logs
Look for detailed error messages.

## Technical Details

**Roles in Supabase:**
- `anon` - Used for unauthenticated requests (e.g., public endpoints)
- `authenticated` - Used after user login  
- `service_role` - Used by server-side code (bypasses RLS)

**Why explicit grants are needed:**
PostgreSQL's default security model denies access unless explicitly granted. Exposing the schema in Supabase's API settings makes it **accessible to the API**, but the database itself still enforces its own permission model.

## Related Files
- 📖 `FIX_SCHEMA_PERMISSIONS.md` - Detailed troubleshooting guide
- 🔧 `db/fix_poker_schema_permissions.sql` - The fix script
- ✅ `db/verify_poker_schema_permissions.sql` - Verification script
- 🔄 `db/migrate_to_poker_schema.sql` - Migration from public to poker schema

## Need More Help?
See the comprehensive guide: [`FIX_SCHEMA_PERMISSIONS.md`](./FIX_SCHEMA_PERMISSIONS.md)
