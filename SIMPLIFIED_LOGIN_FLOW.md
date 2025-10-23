# Simplified Login Flow

## Overview

The login flow has been simplified to remove all redirect parameter complexity. Now the application only uses two routes:
- `/login` - Login page (no query parameters)
- `/dashboard` - Main application dashboard

## Changes Made

### 1. Middleware (`middleware.ts`)
- **Before**: Redirected to `/login?redirect=%2Fdashboard` with the original path
- **After**: Always redirects to `/login` (no query parameters)

### 2. Auth Context (`contexts/auth-context.tsx`)
- **Password Login**: Always redirects to `/dashboard` after successful authentication
- **Google OAuth**: Simplified callback URL (no redirect parameter)
- **Microsoft OAuth**: Simplified callback URL (no redirect parameter)

### 3. Login Page (`app/login/page.tsx`)
- Removed redirect parameter handling
- Always redirects authenticated users to `/dashboard`

### 4. OAuth Callback (`app/api/auth/callback/route.ts`)
- Removed `next` parameter handling
- Always redirects to `/dashboard` after successful OAuth authentication

## How It Works Now

### Password Login Flow
1. User visits a protected route (e.g., `/dashboard/ranking`)
2. Middleware detects no session → Redirects to `/login`
3. User enters credentials and submits
4. `supabase.auth.signInWithPassword()` authenticates
5. Session cookies are set
6. 300ms delay + retry mechanism ensures cookies are readable
7. Router navigates to `/dashboard`
8. User is now authenticated and can navigate to any protected route

### OAuth Login Flow (Google/Microsoft)
1. User visits `/login`
2. User clicks Google or Microsoft login button
3. OAuth provider authenticates user
4. Provider redirects to `/api/auth/callback?code=...`
5. Callback route exchanges code for session
6. User data is verified/created in database
7. Redirects to `/dashboard`

### Already Authenticated Users
1. Authenticated user visits `/login`
2. `useEffect` detects user is already logged in
3. Immediately redirects to `/dashboard`

## Supabase Configuration Required

The login flow uses Supabase Authentication with the following features:

### Environment Variables (.env.local)

```env
NEXT_PUBLIC_SUPABASE_URL=https://jhodhxvvhohygijqcxbo.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_JWT_SECRET=wjsrCQNHbvavr8rAOMwftEJeb6AZ03vZAQwlMZ+bUx8...

# Database connection (optional, for direct database access)
POSTGRES_URL=postgres://postgres.jhodhxvvhohygijqcxbo:affJLwPDtzPm0LYI@...
POSTGRES_PRISMA_URL=postgres://postgres.jhodhxvvhohygijqcxbo:affJLwPDtzPm0LYI@...
POSTGRES_URL_NON_POOLING=postgres://postgres.jhodhxvvhohygijqcxbo:affJLwPDtzPm0LYI@...
POSTGRES_USER=postgres
POSTGRES_HOST=db.jhodhxvvhohygijqcxbo.supabase.co
POSTGRES_PASSWORD=affJLwPDtzPm0LYI
POSTGRES_DATABASE=postgres
```

### Supabase Dashboard Configuration

#### 1. Authentication Providers (Sign In / Providers tab)

**Email Authentication:**
- ✅ Enable "Allow new users to sign up"
- ✅ Enable "Confirm email" if you want email verification
- Set up email templates (optional)

**Google OAuth (Optional):**
- Enable Google provider
- Add OAuth Client ID and Secret from Google Cloud Console
- Configure authorized redirect URLs:
  - Development: `http://localhost:3000/api/auth/callback`
  - Production: `https://poker.luisfboff.com/api/auth/callback`

**Microsoft OAuth (Optional):**
- Enable Azure provider
- Add Azure AD Application ID and Secret
- Configure authorized redirect URLs (same as above)

#### 2. URL Configuration (Configuration tab)

**Site URL:**
- Development: `http://localhost:3000`
- Production: `https://poker.luisfboff.com`

**Redirect URLs:**
Add the following URLs to the "Redirect URLs" allowlist:
- Development:
  - `http://localhost:3000/api/auth/callback`
  - `http://localhost:3000/dashboard`
- Production:
  - `https://poker.luisfboff.com/api/auth/callback`
  - `https://poker.luisfboff.com/dashboard`

#### 3. Session Management (Configuration tab)

**Refresh Tokens:**
- ✅ Enable "Detect and revoke potentially compromised refresh tokens"
- Set refresh token reuse interval: `10 seconds` (recommended)

**User Sessions:**
- Time-box user sessions: `0` (never expire, or set based on your security requirements)
- Inactivity timeout: `0` (never expire, or set based on your security requirements)

## Security Features

### Session Cookie Security
- Cookies are set by Supabase Auth automatically
- Middleware reads cookies to verify authentication
- 300ms delay + retry mechanism prevents race conditions

### No Redirect Vulnerabilities
- Removed all redirect parameter handling
- No risk of open redirect attacks
- No protocol-relative URL vulnerabilities
- Always redirects to `/dashboard` (hardcoded, safe)

## Benefits of Simplified Flow

1. **Easier to Understand**: No complex redirect parameter validation
2. **More Secure**: No open redirect vulnerabilities
3. **Better UX**: Clean URLs without query parameters
4. **Fewer Edge Cases**: No need to handle malformed redirect parameters
5. **Simpler Debugging**: Easier to track authentication issues

## Troubleshooting

### Login succeeds but doesn't redirect
**Symptoms**: Console shows "Auth state changed: SIGNED_IN" but stays on `/login`

**Solutions**:
1. Clear browser cookies and try again
2. Check that Supabase environment variables are correct
3. Verify redirect URLs are configured in Supabase dashboard
4. Check browser console for errors

### OAuth login fails
**Symptoms**: Error message after OAuth provider callback

**Solutions**:
1. Verify OAuth provider is enabled in Supabase dashboard
2. Check OAuth client ID and secret are correct
3. Ensure callback URL is in the allowlist
4. For production: Use HTTPS (OAuth providers require it)

### Infinite redirect loop
**Symptoms**: Browser keeps redirecting between `/login` and `/dashboard`

**Solutions**:
1. Clear all browser cookies
2. Check middleware configuration
3. Verify Supabase session cookies are being set
4. Check browser Network tab for cookie issues

## Next Steps

If you need additional Supabase configuration or want to customize the login flow:

1. **Email Templates**: Customize in Supabase Dashboard → Authentication → Email Templates
2. **Password Policy**: Configure in Supabase Dashboard → Authentication → Policies
3. **Rate Limiting**: Configure in Supabase Dashboard → Authentication → Rate Limits
4. **Multi-Factor Auth**: Enable in Supabase Dashboard → Authentication → MFA (Pro plan)

## Testing Checklist

- [ ] Test password login redirects to `/dashboard`
- [ ] Test OAuth login redirects to `/dashboard`
- [ ] Test already authenticated user visiting `/login` redirects to `/dashboard`
- [ ] Test unauthenticated user accessing protected route redirects to `/login`
- [ ] Test logout functionality
- [ ] Verify no redirect query parameters in URLs
- [ ] Check browser cookies are set after login
- [ ] Verify middleware properly reads session cookies
