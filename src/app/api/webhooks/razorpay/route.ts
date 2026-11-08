// Razorpay payment-link webhook — marks orders paid automatically when the
// customer completes payment. Configure in Razorpay Dashboard → Webhooks:
// URL: https://YOUR_DOMAIN/api/webhooks/razorpay   Events: payment_link.paid
import { NextRequest, NextResponse } from 'next/server';
import { run, get } from '@/lib/db';
import { verifyRazorpaySignature } from '@/lib/integrations/razorpay';

export async function POST(req: NextRequest) {
  const raw = await req.text();
  const signature = req.headers.get('x-razorpay-signature') ?? '';
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET || process.env.RAZORPAY_KEY_SECRET || '';
  if (secret && !verifyRazorpaySignature(raw, signature, secret)) {
    return NextResponse.json({ error: 'invalid signature' }, { status: 400 });
  }
  let body: any = null;
  try { body = JSON.parse(raw); } catch { return NextResponse.json({ error: 'bad json' }, { status: 400 }); }

  const reference: string = body?.payload?.payment_link?.entity?.reference_id ?? '';
  const match = reference.match(/^shadow-order-(\d+)$/);
  if (body?.event === 'payment_link.paid' && match) {
    const orderId = Number(match[1]);
    const o = await get('SELECT id, product_name, total FROM orders WHERE id = ?', [orderId]);
    if (o) {
      await run(`UPDATE orders SET payment_status='paid', updated_at=datetime('now') WHERE id=?`, [orderId]);
      await run(`INSERT INTO interactions (channel, handle, direction, text, ai_replied) VALUES ('razorpay', ?, 'in', ?, 0)`,
        ['payment', `Payment received via Razorpay link — order #${orderId} (${o.product_name}) ₹${Math.round(o.total)}`]);
    }
  }
  return NextResponse.json({ status: 'ok' });
}
