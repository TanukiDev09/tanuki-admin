import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Rutas protegidas
  if (request.nextUrl.pathname.startsWith('/dashboard')) {
    // Audit bypass (Development only)
    if (
      process.env.NODE_ENV !== 'production' &&
      request.nextUrl.searchParams.get('audit') === 'true'
    ) {
      return NextResponse.next();
    }

    const token = request.cookies.get('token');

    if (!token) {
      const loginUrl = new URL('/', request.url);
      loginUrl.searchParams.set('from', request.nextUrl.pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*'],
};
