import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const protectedPaths = ['/kanban', '/debate', '/api/jobs', '/api/kanban', '/api/debates'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  const isProtected = protectedPaths.some(path => pathname.startsWith(path));
  
  if (isProtected) {
    // 1. Check for API key (x-springfield-key)
    const apiKey = request.headers.get('x-springfield-key');
    const validKey = process.env.HOMER_GATEWAY_TOKEN || "314e60bced474eb381ac8655eefd3525";

    if (apiKey === validKey) {
      return NextResponse.next();
    }

    // 2. Check for Session Cookie
    const session = request.cookies.get('cc_session');
    if (!session) {
      if (pathname.startsWith('/api/')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      return NextResponse.redirect(new URL(`/?next=${pathname}`, request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/kanban/:path*',
    '/debate/:path*',
    '/api/jobs/:path*',
    '/api/kanban/:path*',
    '/api/debates/:path*',
  ],
};
