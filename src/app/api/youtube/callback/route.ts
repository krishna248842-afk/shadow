// YouTube OAuth callback — stores the refresh token securely in the DB.
import { NextRequest, NextResponse } from 'next/server';
import { getSetting, setSetting } from '@/lib/settings';
import { get } from '@/lib/db';
import { exchangeYoutubeCode, verifyYouTube } from '@/lib/integrations/youtube';

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams;
  const code = q.get('code');
  const state = q.get('state');
  const stored = await get<{ value: string }>(`SELECT value FROM settings WHERE key='yt_oauth_state'`);
  if (!code || !state || !stored || stored.value !== state) {
    return NextResponse.redirect(new URL('/connectors?yt=state-mismatch', req.url));
  }
  try {
    const clientId = await getSetting('youtube_client_id');
    const clientSecret = await getSetting('youtube_client_secret');
    const base = process.env.APP_BASE_URL || req.nextUrl.origin;
    const redirectUri = `${base.replace(/\/+$/, '')}/api/youtube/callback`;
    const { refreshToken } = await exchangeYoutubeCode(clientId, clientSecret, code, redirectUri);
    if (!refreshToken) throw new Error('Google did not return a refresh token. Revoke app access in your Google account and reconnect.');
    await setSetting('youtube_refresh_token', refreshToken);
    try {
      const r = await verifyYouTube(clientId, clientSecret, refreshToken);
      await setSetting('youtube_channel_name', r.channelTitle);
    } catch { /* token saved; channel name will show on next test */ }
    return NextResponse.redirect(new URL('/connectors?yt=ok', req.url));
  } catch (e: any) {
    const msg = encodeURIComponent((e?.message ?? String(e)).slice(0, 200));
    return NextResponse.redirect(new URL(`/connectors?yt=error&msg=${msg}`, req.url));
  }
}
