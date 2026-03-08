import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('accessToken')?.value;
  const { pathname } = request.nextUrl;

  // 로그인 페이지는 항상 접근 가능
  if (pathname === '/login') {
    // 이미 로그인된 경우 대시보드로 리다이렉트
    if (token) {
      return NextResponse.redirect(new URL('/', request.url));
    }
    return NextResponse.next();
  }

  // 인증이 필요한 페이지에서 토큰이 없으면 로그인 페이지로
  if (!token) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/',
    '/users/:path*',
    '/races/:path*',
    '/results/:path*',
    '/kra',
    '/statistics/:path*',
    '/subscriptions/:path*',
    '/subscription-plans/:path*',
    '/single-purchase-config/:path*',
    '/ai-config/:path*',
    '/analytics/:path*',
    '/revenue/:path*',
    '/notifications/:path*',
    '/settings/:path*',
    '/login',
  ],
};
