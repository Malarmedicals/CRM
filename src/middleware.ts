import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// In-memory store for rate limiting (Note: In Vercel this is per-isolate. For global limit use Redis/Upstash)
const rateLimit = new Map<string, { count: number, resetTime: number }>();

const WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS_API = 100;

export async function middleware(request: NextRequest) {
  // Only apply to API routes
  if (request.nextUrl.pathname.startsWith('/api/')) {
    const ip = request.ip || request.headers.get('x-forwarded-for') || '127.0.0.1';
    const now = Date.now();
    const windowStart = now - WINDOW_MS;

    const record = rateLimit.get(ip);
    
    if (!record || record.resetTime < now) {
      // New record or window expired
      rateLimit.set(ip, { count: 1, resetTime: now + WINDOW_MS });
    } else {
      // Increment count
      record.count += 1;
      
      if (record.count > MAX_REQUESTS_API) {
        return new NextResponse(
          JSON.stringify({ error: 'Too Many Requests' }),
          { status: 429, headers: { 'Content-Type': 'application/json' } }
        );
      }
    }

    // API route defense-in-depth
    const isAuthRoute = request.nextUrl.pathname.startsWith('/api/auth');
    const isIntegrationRoute = request.nextUrl.pathname.startsWith('/api/integration');
    
    if (!isAuthRoute && !isIntegrationRoute) {
      const sessionCookie = request.cookies.get('crm-auth-session');
      if (!sessionCookie || !sessionCookie.value || sessionCookie.value === 'true') {
        return new NextResponse(
          JSON.stringify({ error: 'Unauthorized: Missing or invalid session cookie' }),
          { status: 401, headers: { 'Content-Type': 'application/json' } }
        );
      }
    }
  }

  // Dashboard route protection
  if (request.nextUrl.pathname.startsWith('/dashboard')) {
    const sessionCookie = request.cookies.get('crm-auth-session');
    if (!sessionCookie || !sessionCookie.value || sessionCookie.value === 'true') {
      return NextResponse.redirect(new URL('/', request.url));
    }

    try {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL || '',
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
        { auth: { persistSession: false, autoRefreshToken: false } }
      );
      
      const { data: { user }, error } = await supabase.auth.getUser(sessionCookie.value);
      
      if (error || !user) {
        return NextResponse.redirect(new URL('/', request.url));
      }
    } catch (err) {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/api/:path*', '/dashboard/:path*'],
}
