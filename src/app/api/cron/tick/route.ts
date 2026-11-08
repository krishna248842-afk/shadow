// Cron endpoint — publishes scheduled posts whose time has come.
// Hit it every 5 minutes from any free cron service (e.g. cron-job.org):
//   https://YOUR_DOMAIN/api/cron/tick?secret=YOUR_CRON_SECRET
// Fails closed: if CRON_SECRET is not set on the server, the endpoint refuses to run.
import { NextRequest, NextResponse } from 'next/server';
import { publishDuePosts } from '@/lib/publisher';

export async function GET(req: NextRequest) {
  const expected = process.env.CRON_SECRET || '';
  if (!expected) return NextResponse.json({ error: 'CRON_SECRET is not set on the server — scheduled publishing disabled. Set it in your host env vars (any random string), then use https://YOUR_DOMAIN/api/cron/tick?secret=YOUR_CRON_SECRET' }, { status: 503 });
  const secret = req.nextUrl.searchParams.get('secret') || req.headers.get('authorization')?.replace(/^Bearer\s+/i, '') || '';
  if (secret !== expected) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const result = await publishDuePosts();
  return NextResponse.json({ status: 'ok', ...result, at: new Date().toISOString() });
}

export const POST = GET;
