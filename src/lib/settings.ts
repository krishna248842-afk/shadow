// ─────────────────────────────────────────────────────────────────────────────
// Settings: business profile, AI provider and all integration credentials.
// Values come from the `settings` table; env vars act as fallback defaults.
// Secrets never leave the server — UI receives masked values only.
// ─────────────────────────────────────────────────────────────────────────────
import { all, get, run } from './db';

export const SETTING_KEYS = [
  // business profile
  'business_name', 'business_phone', 'business_upi', 'business_bank', 'business_gst',
  'business_city', 'default_margin_pct', 'content_language',
  // ai provider (OpenAI-compatible)
  'ai_base_url', 'ai_api_key', 'ai_model',
  // meta (facebook page + instagram business) & ads
  'meta_access_token', 'meta_page_id', 'meta_ig_user_id', 'meta_ad_account_id',
  // whatsapp cloud api
  'whatsapp_access_token', 'whatsapp_phone_number_id',
  // youtube (oauth)
  'youtube_client_id', 'youtube_client_secret', 'youtube_refresh_token', 'youtube_channel_name',
  // x / twitter (oauth 1.0a)
  'x_api_key', 'x_api_secret', 'x_access_token', 'x_access_secret',
  // razorpay payments
  'razorpay_key_id', 'razorpay_key_secret',
  // cached ai daily brief
  'ai_brief', 'ai_brief_at',
] as const;

export type SettingKey = (typeof SETTING_KEYS)[number];

const ENV_FALLBACK: Partial<Record<SettingKey, string | undefined>> = {
  ai_base_url: process.env.AI_BASE_URL,
  ai_api_key: process.env.AI_API_KEY,
  ai_model: process.env.AI_MODEL,
  meta_access_token: process.env.META_ACCESS_TOKEN,
  meta_page_id: process.env.META_PAGE_ID,
  meta_ig_user_id: process.env.META_IG_USER_ID,
  meta_ad_account_id: process.env.META_AD_ACCOUNT_ID,
  whatsapp_access_token: process.env.WHATSAPP_ACCESS_TOKEN,
  whatsapp_phone_number_id: process.env.WHATSAPP_PHONE_NUMBER_ID,
  youtube_client_id: process.env.YOUTUBE_CLIENT_ID,
  youtube_client_secret: process.env.YOUTUBE_CLIENT_SECRET,
  x_api_key: process.env.X_API_KEY,
  x_api_secret: process.env.X_API_SECRET,
  x_access_token: process.env.X_ACCESS_TOKEN,
  x_access_secret: process.env.X_ACCESS_SECRET,
  razorpay_key_id: process.env.RAZORPAY_KEY_ID,
  razorpay_key_secret: process.env.RAZORPAY_KEY_SECRET,
};

export async function getSetting(key: SettingKey): Promise<string> {
  const row = await get<{ value: string }>('SELECT value FROM settings WHERE key = ?', [key]);
  if (row?.value) return row.value;
  return ENV_FALLBACK[key] ?? '';
}

export async function setSetting(key: SettingKey, value: string) {
  await run('INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value', [key, value]);
}

export async function getSettingsMap(): Promise<Record<SettingKey, string>> {
  const rows = await all<{ key: string; value: string }>('SELECT key, value FROM settings');
  const dbMap = Object.fromEntries(rows.map((r) => [r.key, r.value]));
  const out: any = {};
  for (const k of SETTING_KEYS) out[k] = dbMap[k] || ENV_FALLBACK[k] || '';
  return out;
}

const SECRET_KEYS = new Set<string>([
  'ai_api_key', 'meta_access_token', 'whatsapp_access_token',
  'youtube_client_secret', 'youtube_refresh_token',
  'x_api_key', 'x_api_secret', 'x_access_token', 'x_access_secret',
  'razorpay_key_secret',
]);

export function maskSecret(v: string): string {
  if (!v) return '';
  if (v.length <= 8) return '••••••••';
  return v.slice(0, 4) + '••••••••' + v.slice(-4);
}

/** Settings map safe to send to the client (secrets masked). */
export async function getMaskedSettings() {
  const map = await getSettingsMap();
  const out: any = {};
  for (const k of SETTING_KEYS) {
    out[k] = SECRET_KEYS.has(k) ? maskSecret(map[k]) : map[k];
  }
  return out as Record<SettingKey, string>;
}

export async function getAIConfig() {
  const base = (await getSetting('ai_base_url')) || 'https://api.openai.com/v1';
  const key = await getSetting('ai_api_key');
  const model = (await getSetting('ai_model')) || 'gpt-4o-mini';
  return { base: base.replace(/\/+$/, ''), key, model };
}
