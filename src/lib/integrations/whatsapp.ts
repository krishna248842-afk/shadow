// ─────────────────────────────────────────────────────────────────────────────
// WhatsApp Cloud API (Meta) — send messages, test the connection and parse
// incoming webhook payloads. Docs: https://developers.facebook.com/docs/whatsapp/cloud-api
// ─────────────────────────────────────────────────────────────────────────────
const BASE = 'https://graph.facebook.com/v21.0';

export async function testWhatsApp(token: string, phoneNumberId: string) {
  const res = await fetch(`${BASE}/${phoneNumberId}?fields=display_phone_number,verified_name,quality_rating`, {
    headers: { Authorization: `Bearer ${token}` },
    signal: AbortSignal.timeout(30_000),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || json.error) throw new Error(json?.error?.message || `WhatsApp API error ${res.status}`);
  return { number: json.display_phone_number ?? 'OK', name: json.verified_name ?? '', quality: json.quality_rating ?? '' };
}

export async function sendWhatsAppText(token: string, phoneNumberId: string, to: string, body: string) {
  const wa = to.replace(/\D/g, '');
  const res = await fetch(`${BASE}/${phoneNumberId}/messages`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ messaging_product: 'whatsapp', to: wa, type: 'text', text: { body: body.slice(0, 4096) } }),
    signal: AbortSignal.timeout(30_000),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || json.error) throw new Error(json?.error?.message || `WhatsApp send failed (${res.status})`);
  return json?.messages?.[0]?.id as string;
}

export interface IncomingWa {
  from: string;
  text: string;
  profileName: string;
}

/** Extract the first text message from a webhook payload, or null for other events. */
export function parseIncoming(body: any): IncomingWa | null {
  try {
    const msg = body?.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
    if (!msg) return null;
    const text = msg?.text?.body ?? (msg?.button?.text ? String(msg.button.text) : '');
    if (!text) return null;
    const profileName = body?.entry?.[0]?.changes?.[0]?.value?.contacts?.[0]?.profile?.name ?? msg.from;
    return { from: String(msg.from), text: String(text), profileName: String(profileName) };
  } catch {
    return null;
  }
}
