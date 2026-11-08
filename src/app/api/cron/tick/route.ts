// Cron endpoint — publishes scheduled posts whose time has come.
// Hit it every 5 minutes from any free cron service (e.g. cron-job.org):
//   https://YOUR_DOMAIN/api/cron/tick?secret=YOUR_CRON_SECRET
// Default secret (override via CRON_SECRET env): shadow-cron-secret
import { NextRequest, NextResponse } from 'next/server';
import { publishDuePosts } from '@/lib/publisher';

export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get('secret') || req.headers.get('authorization')?.replace(/^Bearer\s+/i, '') || '';
  const expected = process.env.CRON_SECRET || 'shadow-cron-secret';
  if (secret !== expected) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const result = await publishDuePosts();
  return NextResponse.json({ status: 'ok', ...result, at: new Date().toISOString() });
}

export const POST = GET;
