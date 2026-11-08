// ─────────────────────────────────────────────────────────────────────────────
// X (Twitter) API v2 — OAuth 1.0a user-context signing, no SDK required.
// Keys from https://developer.x.com → your app → Keys and tokens (Read+Write).
// ─────────────────────────────────────────────────────────────────────────────
import crypto from 'crypto';

const enc = encodeURIComponent;
const pct = (s: string) => enc(s).replace(/[!'()*]/g, (c) => '%' + c.charCodeAt(0).toString(16).toUpperCase());

function oauthHeader(method: string, url: string, creds: {
  consumerKey: string; consumerSecret: string; accessToken: string; accessSecret: string;
}): string {
  const oauth: Record<string, string> = {
    oauth_consumer_key: creds.consumerKey,
    oauth_nonce: crypto.randomBytes(16).toString('hex'),
    oauth_signature_method: 'HMAC-SHA1',
    oauth_timestamp: String(Math.floor(Date.now() / 1000)),
    oauth_token: creds.accessToken,
    oauth_version: '1.0',
  };
  // For JSON bodies, only oauth_* params enter the signature base string.
  const paramString = Object.entries(oauth).sort(([a], [b]) => (a < b ? -1 : 1))
    .map(([k, v]) => `${pct(k)}=${pct(v)}`).join('&');
  const base = `${method.toUpperCase()}&${pct(url)}&${pct(paramString)}`;
  const signingKey = `${pct(creds.consumerSecret)}&${pct(creds.accessSecret)}`;
  const signature = crypto.createHmac('sha1', signingKey).update(base).digest('base64');
  oauth.oauth_signature = signature;
  return 'OAuth ' + Object.entries(oauth).map(([k, v]) => `${pct(k)}="${pct(v)}"`).join(', ');
}

export async function verifyX(creds: { consumerKey: string; consumerSecret: string; accessToken: string; accessSecret: string }) {
  const url = 'https://api.x.com/2/users/me';
  const res = await fetch(url, {
    headers: { Authorization: oauthHeader('GET', url, creds) },
    signal: AbortSignal.timeout(30_000),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json?.detail || json?.title || `X API error ${res.status}. Check keys have Read+Write and app permissions.`);
  return { username: json?.data?.username ?? 'OK', name: json?.data?.name ?? '' };
}

export async function postTweet(creds: { consumerKey: string; consumerSecret: string; accessToken: string; accessSecret: string }, text: string) {
  const url = 'https://api.x.com/2/tweets';
  const res = await fetch(url, {
    method: 'POST',
    headers: { Authorization: oauthHeader('POST', url, creds), 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: text.slice(0, 280) }),
    signal: AbortSignal.timeout(30_000),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json?.detail || json?.title || `X post failed (${res.status})`);
  return json?.data?.id as string;
}
