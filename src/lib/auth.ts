import { NextRequest, NextResponse } from 'next/server';

export function hashPassword(input: string): string {
  let h1 = 0xdeadbeef ^ 0, h2 = 0x41c6ce57 ^ 0;
  for (let i = 0; i < input.length; i++) {
    const ch = input.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (h2 >>> 0).toString(16).padStart(8, '0') + (h1 >>> 0).toString(16).padStart(8, '0');
}

export async function POST(req: NextRequest) {
  const password = process.env.APP_PASSWORD || '';
  const form = await req.formData();
  const attempt = String(form.get('password') || '');
  const next = String(form.get('next') || '/');
  if (!password || attempt === password) {
    const res = NextResponse.redirect(new URL(next.startsWith('/') ? next : '/', req.url));
    res.cookies.set('shadow_session', hashPassword(`shadow|${password}`), {
      httpOnly: true, sameSite: 'lax', path: '/', maxAge: 60 * 60 * 24 * 30,
    });
    return res;
  }
  const url = new URL('/login', req.url);
  url.searchParams.set('error', '1');
  return NextResponse.redirect(url);
}
