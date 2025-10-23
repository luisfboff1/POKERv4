# Fix for Login Redirect Race Condition

## Problem

Users experienced an infinite redirect loop after successful login:
- Console showed "Auth state changed: SIGNED_IN" (login was successful)
- URL showed `/login?redirect=%2Fdashboard` but stayed on login page
- Network tab showed 307 redirect from `/dashboard?_rsc=5c339` back to login
- React DevTools warning: "Unsupported React renderer" (React 19 production mode - not related to the issue)

## Root Cause

**Race condition between authentication and middleware**:

1. User submits login credentials
2. `supabase.auth.signInWithPassword()` sets authentication cookies asynchronously
3. Client code immediately calls `router.push('/dashboard')` to navigate
4. Next.js middleware intercepts the navigation request
5. **Problem**: Cookies might not be fully written/readable yet
6. Middleware's `getSession()` doesn't find the session → redirects back to `/login?redirect=%2Fdashboard`
7. Creates an infinite redirect loop

The middleware was properly configured to read cookies, but there was a timing issue between when Supabase set the cookies and when the client attempted navigation.

## Solution

### 1. Password Login (contexts/auth-context.tsx)

Added three layers of protection against the race condition:

**Layer 1: Initial Delay**
```typescript
await new Promise(resolve => setTimeout(resolve, 300));
```
- Wait 300ms after successful authentication
- Gives cookies time to be written to the browser

**Layer 2: Session Verification with Retries**
```typescript
let verifiedSession = null;
for (let i = 0; i < 3; i++) {
  const { data: { session } } = await supabase.auth.getSession();
  if (session) {
    verifiedSession = session;
    break;
  }
  await new Promise(resolve => setTimeout(resolve, 100));
}
```
- Verify session is readable before navigation
- Retry up to 3 times with 100ms delay between attempts
- Only navigate if session is confirmed readable

**Layer 3: Seamless Navigation**
```typescript
router.replace(redirect);
```
- Use `router.replace()` instead of `router.push()`
- Doesn't add to history, prevents back button issues

### 2. OAuth Login (Google & Microsoft)

Added redirect parameter preservation through OAuth flow:

```typescript
// Get redirect parameter from URL
const urlParams = new URLSearchParams(window.location.search);
const redirectParam = urlParams.get('redirect');

// Validate and construct callback URL with redirect parameter
let callbackUrl = `${window.location.origin}/api/auth/callback`;
if (redirectParam && typeof redirectParam === 'string') {
  if (redirectParam.startsWith('/') && !redirectParam.startsWith('//')) {
    if (!redirectParam.includes('://') && !redirectParam.includes('//')) {
      callbackUrl += `?next=${encodeURIComponent(redirectParam)}`;
    }
  }
}
```

- Extracts redirect parameter from current URL
- Validates it's a safe relative path
- Passes it to OAuth callback as `next` parameter
- OAuth callback route uses `next` parameter to redirect after authentication

### 3. Security Enhancements

**Comprehensive URL Validation**:
```typescript
let redirect = '/dashboard';
if (redirectParam && typeof redirectParam === 'string') {
  // Must start with / and not with //
  if (redirectParam.startsWith('/') && !redirectParam.startsWith('//')) {
    // Additional check: ensure no protocol or domain
    if (!redirectParam.includes('://') && !redirectParam.includes('//')) {
      redirect = redirectParam;
    }
  }
}
```

Protection against:
- Open redirect attacks
- Protocol-relative URLs (`//evil.com`)
- Absolute URLs (`https://evil.com`)
- Only allows relative paths starting with `/`

## Files Changed

### contexts/auth-context.tsx
- **login()**: Added 300ms delay + retry mechanism + enhanced validation
- **loginWithGoogle()**: Added redirect parameter support with validation
- **loginWithMicrosoft()**: Added redirect parameter support with validation

## Security

✅ **CodeQL Scan: 0 vulnerabilities**

All security checks passed:
- No client-side unvalidated URL redirection
- Proper input validation on all redirect parameters
- Safe URL encoding when passing parameters
- No open redirect vulnerabilities

## Testing

### Manual Testing Required

1. **Test Password Login Redirect**:
   - Log out completely
   - Try to access `https://poker.luisfboff.com/dashboard`
   - Should redirect to `/login?redirect=%2Fdashboard`
   - Enter credentials and login
   - Should successfully redirect to `/dashboard` (not loop)

2. **Test Direct Login**:
   - Go to `https://poker.luisfboff.com/login`
   - Enter valid credentials
   - Should redirect to `/dashboard`

3. **Test OAuth Login with Redirect**:
   - Log out
   - Try to access a protected page
   - Redirected to `/login?redirect=<page>`
   - Click Google or Microsoft login
   - After OAuth flow, should redirect to original protected page

4. **Test Already Authenticated User**:
   - While logged in, visit `https://poker.luisfboff.com/login`
   - Should automatically redirect to `/dashboard`

5. **Test Invalid Redirect Parameter (Security)**:
   - Log out
   - Visit `/login?redirect=//evil.com/phishing`
   - After login, should redirect to `/dashboard` (NOT evil.com)
   - Visit `/login?redirect=https://evil.com/phishing`
   - After login, should redirect to `/dashboard` (NOT evil.com)

### Automated Testing

All checks passed:
- ✅ Type checking: No errors
- ✅ Linting: Passed (1 pre-existing warning in unrelated component)
- ✅ Build: Successful
- ✅ Security scan: 0 vulnerabilities

## Why This Fix Works

### The Timing Problem
Before this fix, the flow was:
1. Login → Sets cookies (async)
2. Navigate immediately (sync)
3. Middleware checks cookies → Not found yet
4. Redirect back to login → Loop

### The Solution Flow
After this fix:
1. Login → Sets cookies (async)
2. **Wait 300ms** → Cookies settle
3. **Verify session readable** → Confirm cookies are set
4. **Retry if needed** → Give more time if necessary
5. Navigate → Middleware finds cookies ✅
6. Success!

The key insight is that cookie setting is asynchronous and the browser needs time to:
- Write cookies to storage
- Make them available for reading
- Have them included in the next HTTP request

By adding a small delay and verification, we ensure the middleware will always see the authenticated session on the first try.

## Performance Impact

- **300ms delay**: User-imperceptible for login flow
- **Up to 2 additional 100ms delays**: Only if first verification fails (rare)
- **Total worst case**: 500ms delay (still acceptable for login)
- **Typical case**: 300ms delay (good user experience)

This is a good trade-off between reliability and performance. Users won't notice the delay as it happens while the "Entrando..." loading indicator is shown.

## Related Files

- `middleware.ts` - Already properly configured to read cookies
- `app/login/page.tsx` - Login UI component
- `app/api/auth/callback/route.ts` - OAuth callback handler
- `stores/authStore.ts` - Authentication state management

## Notes

- The "Unsupported React renderer" warning is from React 19 DevTools in production mode and is not related to this issue
- The middleware cookie reading was already correct (from previous fix)
- This fix addresses the timing/race condition specifically
- OAuth flow naturally has delays built-in, so the issue was primarily with password login
- The retry mechanism provides extra reliability in slow network conditions
