// ─────────────────────────────────────────────────────────────────────────────
// YouTube Data API v3 — OAuth2 (refresh token) + resumable uploads.
// Setup: Google Cloud Console → enable "YouTube Data API v3" → OAuth Web client.
// ─────────────────────────────────────────────────────────────────────────────
const SCOPES = 'https://www.googleapis.com/auth/youtube.upload https://www.googleapis.com/auth/youtube.readonly';

export function youtubeAuthUrl(clientId: string, redirectUri: string, state: string) {
  const q = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: SCOPES,
    access_type: 'offline',
    prompt: 'consent',
    state,
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${q.toString()}`;
}

export async function exchangeYoutubeCode(clientId: string, clientSecret: string, code: string, redirectUri: string) {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ client_id: clientId, client_secret: clientSecret, code, grant_type: 'authorization_code', redirect_uri: redirectUri }),
    signal: AbortSignal.timeout(30_000),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json?.error_description || json?.error || `YouTube token exchange failed (${res.status})`);
  return { refreshToken: json.refresh_token as string, accessToken: json.access_token as string };
}

async function accessTokenFromRefresh(clientId: string, clientSecret: string, refreshToken: string) {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ client_id: clientId, client_secret: clientSecret, refresh_token: refreshToken, grant_type: 'refresh_token' }),
    signal: AbortSignal.timeout(30_000),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json?.error_description || `YouTube token refresh failed (${res.status})`);
  return json.access_token as string;
}

export async function verifyYouTube(clientId: string, clientSecret: string, refreshToken: string) {
  const accessToken = await accessTokenFromRefresh(clientId, clientSecret, refreshToken);
  const res = await fetch('https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true', {
    headers: { Authorization: `Bearer ${accessToken}` },
    signal: AbortSignal.timeout(30_000),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json?.error?.message || `YouTube API error ${res.status}`);
  const item = json?.items?.[0];
  return { channelTitle: item?.snippet?.title ?? 'YouTube account connected' };
}

export interface YoutubeUpload {
  title: string;
  description: string;
  tags: string[];
  privacy: 'public' | 'unlisted' | 'private';
}

/** Resumable upload. `bytes` is the whole video in memory (keep Shorts < 60MB). */
export async function uploadYouTubeVideo(
  clientId: string, clientSecret: string, refreshToken: string,
  meta: YoutubeUpload, bytes: Buffer, mimeType: string,
): Promise<string> {
  const accessToken = await accessTokenFromRefresh(clientId, clientSecret, refreshToken);
  const snippet = {
    title: meta.title.slice(0, 100),
    description: meta.description,
    tags: meta.tags.slice(0, 15),
    categoryId: '22', // People & Blogs
  };
  const status = { privacyStatus: meta.privacy, selfDeclaredMadeForKids: false };
  const init = await fetch('https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json; charset=UTF-8',
      'X-Upload-Content-Length': String(bytes.length),
      'X-Upload-Content-Type': mimeType,
    },
    body: JSON.stringify({ snippet, status }),
    signal: AbortSignal.timeout(60_000),
  });
  if (!init.ok) {
    const err = await init.text().catch(() => '');
    throw new Error(`YouTube upload init failed (${init.status}): ${err.slice(0, 300)}`);
  }
  const uploadUrl = init.headers.get('location');
  if (!uploadUrl) throw new Error('YouTube did not return an upload URL');
  const put = await fetch(uploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': mimeType, 'Content-Length': String(bytes.length) },
    body: new Uint8Array(bytes),
    signal: AbortSignal.timeout(600_000),
  });
  const json = await put.json().catch(() => ({}));
  if (!put.ok) throw new Error(json?.error?.message || `YouTube upload failed (${put.status})`);
  return json?.id as string;
}
