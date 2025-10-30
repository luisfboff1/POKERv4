# Fix for Login 406 Error

## Problem

When users tried to login, the application received a `406 (Not Acceptable)` error when querying the `users` table:

```
GET https://jhodhxvvhohygijqcxbo.supabase.co/rest/v1/users?select=...&email=eq.flboff@gmail.com&is_active=eq.true 406 (Not Acceptable)
```

This prevented users from logging in successfully, leaving them stuck on the login page.

## Root Cause

The issue was caused by **Row Level Security (RLS) policies** in Supabase blocking direct client queries to the `users` table. 

The RLS policy requires:
```sql
CREATE POLICY "tenant_isolation_users_select" ON users
  FOR SELECT
  USING (
    auth.jwt() ->> 'role' = 'super_admin' OR
    tenant_id = NULLIF(auth.jwt() -> 'app_metadata' ->> 'tenant_id', '')::integer
  );
```

When a user first logs in:
1. Supabase Auth creates a session with a JWT token
2. The `onAuthStateChange` event fires
3. Client-side code tries to query the `users` table
4. **Problem**: The JWT doesn't have `app_metadata.tenant_id` set yet
5. RLS blocks the query → 406 error

## Solution

Created a new API route `/api/auth/user` that:
1. Verifies the authentication token
2. Uses the **service role client** to bypass RLS
3. Securely fetches user data from the database
4. Returns the data to the client

### Files Changed

1. **`app/api/auth/user/route.ts`** (NEW)
   - API route that handles user data fetching
   - Uses service role to bypass RLS
   - Validates authentication token before returning data

2. **`contexts/auth-context.tsx`**
   - Changed from direct Supabase query to API route call
   - Line 37-75: Now uses `fetch('/api/auth/user', ...)`

3. **`stores/authStore.ts`**
   - Changed from direct Supabase query to API route call
   - Line 68-98: Now uses `fetch('/api/auth/user', ...)`

## How It Works

### Before (Broken)
```
User Login → Supabase Auth → onAuthStateChange → 
Direct Query to users table → RLS blocks (no tenant_id in JWT) → 406 Error
```

### After (Fixed)
```
User Login → Supabase Auth → onAuthStateChange → 
API Route /api/auth/user → Verify Token → 
Service Role Query (bypasses RLS) → Return User Data → Success
```

## Security

- ✅ API route validates authentication token before fetching data
- ✅ Service role is only used on the server side (never exposed to client)
- ✅ CodeQL scan: 0 vulnerabilities
- ✅ Only authenticated users can access their own data

## Testing

To verify the fix works:

1. **Login with email/password:**
   - Go to https://poker.luisfboff.com/login
   - Enter email: flboff@gmail.com
   - Enter password
   - Should successfully redirect to /dashboard
   - No 406 error in console

2. **Login with Google OAuth:**
   - Click "Continue with Google"
   - Complete OAuth flow
   - Should successfully redirect to /dashboard
   - No 406 error in console

3. **Login with Microsoft OAuth:**
   - Click "Continue with Microsoft"
   - Complete OAuth flow
   - Should successfully redirect to /dashboard
   - No 406 error in console

## Console Output

Before fix:
```
auth state changed: SIGNED_IN
GET https://...supabase.co/rest/v1/users?select=... 406 (Not Acceptable)
```

After fix:
```
auth state changed: SIGNED_IN
(User data loaded successfully, redirects to dashboard)
```

## Related Files

- `lib/supabaseServer.ts` - Service role client configuration
- `app/api/auth/callback/route.ts` - Similar pattern for OAuth callback
- `db/supabase-schema.sql` - RLS policies definition
