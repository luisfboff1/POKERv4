# Fix for Login Redirect Issue

## Problem

When users tried to log in, they would get stuck at `/login?redirect=%2Fdashboard` and the page would not redirect them to the dashboard. The URL would show the redirect parameter, but the user remained on the login page.

### Issue Details

- User needs to be registered in both:
  1. Supabase Authentication (for authentication)
  2. `users` table in Supabase (for application data with `tenant_id`)
- After successful login with valid credentials, the page would not navigate away from `/login`
- The URL showed `https://poker.luisfboff.com/login?redirect=%2Fdashboard` but stayed on the login screen

## Root Cause

The middleware was creating a new Supabase client without reading session cookies, causing it to not detect authenticated sessions. Here's the flow:

1. User submits login credentials
2. Supabase Auth successfully creates a session and stores it in cookies
3. Login function calls `router.push('/dashboard')` to navigate
4. Next.js middleware intercepts the navigation request
5. **Problem**: Middleware creates a Supabase client with `persistSession: false` and no custom storage
6. The middleware's `getSession()` call doesn't read the cookies, returns `null`
7. Middleware redirects back to `/login?redirect=%2Fdashboard`
8. This creates a loop where the user is stuck on the login page

## Solution

Fixed the middleware to properly read Supabase session cookies by implementing a custom storage adapter.

### Files Changed

1. **`middleware.ts`** - Added custom storage to read cookies
2. **`contexts/auth-context.tsx`** - Added redirect parameter validation and handling
3. **`app/login/page.tsx`** - Added redirect for authenticated users with validation

## Changes in Detail

### 1. middleware.ts

Added a custom storage implementation to read Supabase session from request cookies:

```typescript
return createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
    storage: {
      getItem: (key: string) => {
        const cookie = req.cookies.get(key);
        return cookie?.value ?? null;
      },
      setItem: () => {},
      removeItem: () => {},
    },
  },
});
```

This allows the middleware to read the `sb-*-auth-token` cookies that Supabase stores after successful authentication.

### 2. contexts/auth-context.tsx

Updated the login function to respect and validate the redirect parameter:

```typescript
const urlParams = new URLSearchParams(window.location.search);
const redirectParam = urlParams.get('redirect');
// Validate that redirect is a relative path starting with / and not a full URL
const redirect = redirectParam && redirectParam.startsWith('/') && !redirectParam.startsWith('//') 
  ? redirectParam 
  : '/dashboard';
router.push(redirect);
```

### 3. app/login/page.tsx

Added a useEffect hook to redirect already-authenticated users:

```typescript
useEffect(() => {
  if (!authLoading && user) {
    const sp = new URLSearchParams(window.location.search);
    const redirectParam = sp.get('redirect');
    // Validate that redirect is a relative path starting with / and not a full URL
    const redirect = redirectParam && redirectParam.startsWith('/') && !redirectParam.startsWith('//') 
      ? redirectParam 
      : '/dashboard';
    router.push(redirect);
  }
}, [user, authLoading, router]);
```

## How It Works Now

### Successful Login Flow

1. User tries to access `/dashboard` without authentication
2. Middleware detects no session and redirects to `/login?redirect=%2Fdashboard`
3. User enters credentials and clicks "Entrar"
4. Supabase Auth validates credentials and creates a session
5. Session is stored in cookies (handled by Supabase JS client)
6. Login function reads the `redirect` parameter, validates it, and calls `router.push(redirect)`
7. Next.js attempts to navigate to `/dashboard`
8. **Middleware now reads the session from cookies successfully** ✅
9. Middleware allows the request to proceed
10. User lands on `/dashboard` ✅

### Already Authenticated Users

1. Authenticated user visits `/login`
2. The useEffect detects the user is already logged in
3. Automatically redirects to the target page or `/dashboard`
4. User doesn't see the login form

## Security

✅ **CodeQL scan passed with 0 vulnerabilities**

### Fixes Applied

1. **Client-side unvalidated URL redirection**: 
   - Added validation: redirect must start with `/` and not `//`
   - Prevents open redirect attacks to external sites

2. **Cross-site scripting (XSS)**:
   - Replaced `window.location.href` with `router.push()`
   - Added proper URL validation before navigation

### Validation Rules

The redirect parameter is validated with these rules:
- Must start with `/` (relative path)
- Must NOT start with `//` (prevents protocol-relative URLs)
- If validation fails, defaults to `/dashboard`

## Testing

✅ All checks passed:
- Type checking: No errors
- Linting: Passed (1 pre-existing warning in unrelated component)
- Build: Successful
- Security scan: 0 vulnerabilities

### Manual Testing Required

To verify the fix works:

1. **Test protected route access**:
   - Log out completely
   - Try to access `https://poker.luisfboff.com/dashboard`
   - Should redirect to `/login?redirect=%2Fdashboard`
   - After login, should land on `/dashboard`

2. **Test direct login**:
   - Go to `https://poker.luisfboff.com/login`
   - Enter valid credentials
   - Should redirect to `/dashboard`

3. **Test authenticated user**:
   - While logged in, visit `https://poker.luisfboff.com/login`
   - Should automatically redirect to `/dashboard`

4. **Test invalid redirect parameter**:
   - Log out
   - Visit `/login?redirect=//evil.com/phishing`
   - After login, should redirect to `/dashboard` (not to evil.com)

## Related Files

- `lib/supabaseClient.ts` - Client-side Supabase configuration
- `lib/supabaseServer.ts` - Server-side Supabase configuration
- `app/api/auth/user/route.ts` - API route for fetching user data
- `stores/authStore.ts` - Zustand store for auth state

## Notes

- This fix ensures the middleware can detect authenticated sessions
- The redirect parameter is properly validated for security
- Already-authenticated users are automatically redirected
- The solution is minimal and focused on the specific issue
