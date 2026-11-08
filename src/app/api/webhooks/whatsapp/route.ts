// WhatsApp Cloud API webhook — verification handshake + live AI auto-replies.
// Your public URL: https://YOUR_DOMAIN/api/webhooks/whatsapp
import { NextRequest, NextResponse } from 'next/server';
import { all, run } from '@/lib/db';
import { getSetting } from '@/lib/settings';
import { aiChat } from '@/lib/ai';
import { parseIncoming, sendWhatsAppText } from '@/lib/integrations/whatsapp';

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams;
  const mode = q.get('hub.mode');
  const token = q.get('hub.verify_token');
  const challenge = q.get('hub.challenge');
  const expected = process.env.WHATSAPP_VERIFY_TOKEN || 'shadow-verify-token';
  if (mode === 'subscribe' && token === expected) {
    return new NextResponse(challenge ?? '', { status: 200, headers: { 'Content-Type': 'text/plain' } });
  }
  return new NextResponse('Verification failed', { status: 403 });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const incoming = body ? parseIncoming(body) : null;
  if (!incoming) return NextResponse.json({ status: 'ignored' });

  await run(`INSERT INTO interactions (channel, handle, direction, text, ai_replied) VALUES ('whatsapp', ?, 'in', ?, 0)`,
    [`${incoming.profileName} (${incoming.from})`, incoming.text]);

  const biz = (await getSetting('business_name')) || 'our store';
  const catalog = await all<{ name: string; sell_price: number; stock: number }>(
    `SELECT name, sell_price, stock FROM products WHERE stock > 0 ORDER BY sell_price ASC LIMIT 12`);
  const catalogText = catalog.map((p) => `- ${p.name}: ₹${Math.round(p.sell_price)}`).join('\n');

  // Try cloud AI; fall back to a solid offline template reply
  let reply = '';
  try {
    const r = await aiChat(
      `You are ${biz}'s WhatsApp sales assistant (Indian Meesho reseller). Customer chatted you. Reply in Hinglish, warm & concise, MAX 60 words. Answer price/stock/delivery questions ONLY from this catalog (free delivery, COD available, 2-6 day delivery):\n${catalogText}\nIf they want to order: ask for full address + pincode and confirm order. Never invent products or prices not in the catalog. If unsure, say our team will call them shortly.`,
      incoming.text,
      0.7,
      300,
    );
    reply = r.text;
  } catch {
    reply = '';
  }
  if (!reply) {
    reply = `Namaste ${incoming.profileName}! 🙏 ${biz} mein aapka swagat hai.\n${catalog.slice(0, 4).map((p) => `🛍️ ${p.name.slice(0, 45)} — ₹${Math.round(p.sell_price)}`).join('\n')}\n\nFree delivery + COD available hai. Order ke liye apna full address aur pincode bhejiye! 😊`;
  }

  const token = await getSetting('whatsapp_access_token');
  const phoneId = await getSetting('whatsapp_phone_number_id');
  let sent = false;
  if (token && phoneId) {
    try {
      await sendWhatsAppText(token, phoneId, incoming.from, reply);
      sent = true;
    } catch (e: any) {
      await run(`INSERT INTO interactions (channel, handle, direction, text, ai_replied) VALUES ('whatsapp', ?, 'out', ?, 1)`,
        [`${incoming.profileName} (${incoming.from})`, `[SEND FAILED] ${(e?.message ?? '').slice(0, 200)}`]);
    }
  }
  await run(`INSERT INTO interactions (channel, handle, direction, text, ai_replied) VALUES ('whatsapp', ?, 'out', ?, 1)`,
    [`${incoming.profileName} (${incoming.from})`, reply]);

  return NextResponse.json({ status: 'ok', replied: sent });
}
