import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  const isAuthPage = request.nextUrl.pathname.startsWith('/login');
  const hasCookie = request.cookies.has('grocery_auth');

  if (!hasCookie && !isAuthPage) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (hasCookie && isAuthPage) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
