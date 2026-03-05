import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const protectedPaths = ['/kanban', '/debate', '/api/jobs', '/api/kanban', '/api/debates'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  const isProtected = protectedPaths.some(path => pathname.startsWith(path));
  
  if (isProtected) {
    const session = request.cookies.get('cc_session');
    
    // Simple verification for now: check if exists
    // In a real scenario, we'd verify the HMAC signature here
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
