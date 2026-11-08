// Start the YouTube OAuth flow (used by the Connectors page "Connect YouTube" button).
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { getSetting } from '@/lib/settings';
import { get, run } from '@/lib/db';
import { youtubeAuthUrl } from '@/lib/integrations/youtube';

export async function GET(req: NextRequest) {
  const clientId = await getSetting('youtube_client_id');
  if (!clientId) return NextResponse.redirect(new URL('/connectors?yt=missing', req.url));
  const state = crypto.randomBytes(16).toString('hex');
  await run(`INSERT INTO settings (key, value) VALUES ('yt_oauth_state', ?) ON CONFLICT(key) DO UPDATE SET value=excluded.value`, [state]);
  const base = process.env.APP_BASE_URL || req.nextUrl.origin;
  const redirectUri = `${base.replace(/\/+$/, '')}/api/youtube/callback`;
  return NextResponse.redirect(youtubeAuthUrl(clientId, redirectUri, state));
}
