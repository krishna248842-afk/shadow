// ─────────────────────────────────────────────────────────────────────────────
// Razorpay — payment links API + webhook signature verification (HMAC-SHA256).
// Docs: https://razorpay.com/docs/api/payments/payment-links/
// ─────────────────────────────────────────────────────────────────────────────
import crypto from 'crypto';

export async function createPaymentLink(
  keyId: string, keySecret: string,
  opts: { amountInr: number; description: string; customerName: string; customerPhone?: string; referenceId?: string },
) {
  const auth = Buffer.from(`${keyId}:${keySecret}`).toString('base64');
  const res = await fetch('https://api.razorpay.com/v1/payment_links', {
    method: 'POST',
    headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      amount: Math.round(opts.amountInr * 100),
      currency: 'INR',
      accept_partial: false,
      description: opts.description.slice(0, 255),
      customer: { name: opts.customerName, contact: opts.customerPhone || undefined },
      notify: { sms: !!opts.customerPhone, email: false },
      reference_id: opts.referenceId,
      reminder_enable: true,
      notes: { source: 'shadow' },
    }),
    signal: AbortSignal.timeout(30_000),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json?.error?.description || `Razorpay error ${res.status}`);
  return { id: json.id as string, shortUrl: json.short_url as string };
}

/** Constant-time HMAC-SHA256 verification of Razorpay webhook payloads. */
export function verifyRazorpaySignature(rawBody: string, signature: string, secret: string): boolean {
  if (!secret || !signature) return false;
  const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
  const a = Buffer.from(expected, 'utf8');
  const b = Buffer.from(signature, 'utf8');
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
