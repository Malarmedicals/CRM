import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Redis } from '@upstash/redis'
import { Ratelimit } from '@upstash/ratelimit'

// Fallback in-memory store for rate limiting (used if Redis is not configured)
const fallbackRateLimit = new Map<string, { count: number, resetTime: number }>();

const WINDOW_MS = 60 * 1000; // 1 minute

const LIMITS = {
  email: 5,
  whatsapp: 5,
  users: 10,
  default: 100
};

// Initialize Upstash Redis Ratelimits if credentials exist
let redis: Redis | null = null;
let limiters: Record<string, Ratelimit> = {};

if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
  redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  });
  
  limiters = {
    email: new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(LIMITS.email, "1 m") }),
    whatsapp: new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(LIMITS.whatsapp, "1 m") }),
    users: new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(LIMITS.users, "1 m") }),
    default: new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(LIMITS.default, "1 m") }),
  };
}

export async function middleware(request: NextRequest) {
  // Only apply to API routes
  if (request.nextUrl.pathname.startsWith('/api/')) {
    const ip = request.ip || request.headers.get('x-forwarded-for') || '127.0.0.1';
    
    // Determine which limit applies
    let limitType = 'default';
    let maxRequests = LIMITS.default;
    
    if (request.nextUrl.pathname.includes('/api/send-email')) {
      limitType = 'email';
      maxRequests = LIMITS.email;
    } else if (request.nextUrl.pathname.includes('/api/send-whatsapp')) {
      limitType = 'whatsapp';
      maxRequests = LIMITS.whatsapp;
    } else if (request.nextUrl.pathname.includes('/api/users')) {
      limitType = 'users';
      maxRequests = LIMITS.users;
    }
    
    if (redis && limiters[limitType]) {
      // Use Redis
      const { success } = await limiters[limitType].limit(`${ip}_${limitType}`);
      if (!success) {
        return new NextResponse(
          JSON.stringify({ error: 'Too Many Requests' }),
          { status: 429, headers: { 'Content-Type': 'application/json' } }
        );
      }
    } else {
      // Use fallback
      const now = Date.now();
      const fallbackKey = `${ip}_${limitType}`;
      const record = fallbackRateLimit.get(fallbackKey);
      
      if (!record || record.resetTime < now) {
        fallbackRateLimit.set(fallbackKey, { count: 1, resetTime: now + WINDOW_MS });
      } else {
        record.count += 1;
        if (record.count > maxRequests) {
          return new NextResponse(
            JSON.stringify({ error: 'Too Many Requests' }),
            { status: 429, headers: { 'Content-Type': 'application/json' } }
          );
        }
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
