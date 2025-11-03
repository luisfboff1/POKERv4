import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';

// Create Supabase client for middleware with optimized cookie handling
function createMiddlewareClient(request: NextRequest) {
  // Create a response to store cookies
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return request.cookies.get(name)?.value;
      },
      set(name: string, value: string, options: CookieOptions) {
        // Update request cookies for the current request
        request.cookies.set({
          name,
          value,
          ...options,
        });
        // Update response cookies for subsequent requests
        response = NextResponse.next({
          request: {
            headers: request.headers,
          },
        });
        response.cookies.set({
          name,
          value,
          ...options,
        });
      },
      remove(name: string, options: CookieOptions) {
        // Remove from request cookies
        request.cookies.set({
          name,
          value: '',
          ...options,
        });
        // Remove from response cookies
        response = NextResponse.next({
          request: {
            headers: request.headers,
          },
        });
        response.cookies.set({
          name,
          value: '',
          ...options,
        });
      },
    },
  });

  return { supabase, response };
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

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
    const { supabase, response } = createMiddlewareClient(request);

    // Get session from cookie - this will automatically refresh if needed
    const { data: { session }, error } = await supabase.auth.getSession();

    if (error) {
      console.error('[Middleware] Auth error:', error.message);
      return NextResponse.redirect(new URL('/login', request.url));
    }

    if (!session) {
      // No valid session, redirect to login
      return NextResponse.redirect(new URL('/login', request.url));
    }

    // User is authenticated, return response with updated cookies
    return response;
  } catch (error) {
    console.error('[Middleware] Unexpected error:', error);
    // On error, redirect to login for safety
    return NextResponse.redirect(new URL('/login', request.url));
  }
}

// Note: Middleware automatically runs on Edge Runtime for optimal performance

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
