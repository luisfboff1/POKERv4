import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

// Create Supabase client for middleware
function createMiddlewareClient(req: NextRequest, res: NextResponse) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return req.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          res.cookies.set(name, value, options);
        });
      },
    },
  });
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Public routes that don't require authentication
  const publicRoutes = ['/', '/login', '/register', '/forgot-password', '/accept-invite'];
  const isPublicRoute = publicRoutes.some(route => pathname === route || (route !== '/' && pathname.startsWith(route)));

  // Allow all API routes to handle their own authentication
  if (pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

  // Allow public assets and static files
  if (pathname.startsWith('/_next') || pathname.startsWith('/icon.svg')) {
    return NextResponse.next();
  }

  // If it's a public route, allow access
  if (isPublicRoute) {
    return NextResponse.next();
  }

  // Check authentication for protected routes
  try {
    const res = NextResponse.next();
    const supabase = createMiddlewareClient(req, res);

    // Get session from cookie
    const { data: { session }, error } = await supabase.auth.getSession();

    console.log(`[Middleware] ${pathname} - Session:`, !!session, 'Cookies:', req.cookies.getAll().map(c => c.name).join(', '));

    if (error || !session) {
      // No valid session, redirect to login
      console.log(`[Middleware] Redirecting ${pathname} to /login - no session`);
      return NextResponse.redirect(new URL('/login', req.url));
    }

    // User is authenticated, allow access
    console.log(`[Middleware] Allowing access to ${pathname}`);
    return res;
  } catch (error) {
    console.error('Middleware error:', error);
    // On error, redirect to login for safety
    return NextResponse.redirect(new URL('/login', req.url));
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
