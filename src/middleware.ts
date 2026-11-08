// Password gate. Set APP_PASSWORD to protect the app when deployed publicly.
import { NextRequest, NextResponse } from 'next/server';
import { hashPassword } from '@/lib/auth';

const PUBLIC = [
  '/login',
  '/api/auth/login',
  '/api/webhooks/whatsapp',
  '/api/webhooks/razorpay',
  '/api/cron/tick',
  '/manifest.webmanifest',
  '/icon.svg',
  '/favicon.ico',
];

export function middleware(req: NextRequest) {
  const password = process.env.APP_PASSWORD;
  if (!password) return NextResponse.next(); // local mode: open access

  const { pathname } = req.nextUrl;
  if (PUBLIC.some((p) => pathname === p || pathname.startsWith(p + '/'))) return NextResponse.next();
  if (pathname.startsWith('/_next')) return NextResponse.next();

  const expected = hashPassword(`shadow|${password}`);
  if (req.cookies.get('shadow_session')?.value === expected) return NextResponse.next();

  const url = req.nextUrl.clone();
  url.pathname = '/login';
  url.search = `?next=${encodeURIComponent(pathname)}`;
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|_next/data).*)'],
};
