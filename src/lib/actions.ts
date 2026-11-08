'use server';
// ─────────────────────────────────────────────────────────────────────────────
// Shadow server actions — every mutation in the app goes through here.
// ─────────────────────────────────────────────────────────────────────────────
import { revalidatePath } from 'next/cache';
import { all, get, lastId, run } from './db';
import { getSettingsMap, getSetting, setSetting, SETTING_KEYS, SettingKey } from './settings';
import { generateDailyBrief, generateContent, type ContentKind } from './ai';
import { testMeta, testInstagram, createMetaCampaign, fetchCampaignInsights } from './integrations/meta';
import { testWhatsApp, sendWhatsAppText } from './integrations/whatsapp';
import { verifyX } from './integrations/x';
import { verifyYouTube } from './integrations/youtube';
import { createPaymentLink } from './integrations/razorpay';
import { publishPost } from './publisher';
import { redirect } from 'next/navigation';

const ok = (extra: Record<string, any> = {}) => ({ ok: true as const, ...extra });
const fail = (error: string) => ({ ok: false as const, error });
export type ActionResult = { ok: true; [k: string]: any } | { ok: false; error: string };

function safe<T extends any[]>(fn: (...args: T) => Promise<ActionResult>) {
  return async (...args: T): Promise<ActionResult> => {
    try {
      return await fn(...args);
    } catch (e: any) {
      return fail((e?.message ?? String(e)).slice(0, 400));
    }
  };
}

// ── Products ────────────────────────────────────────────────────────────────
export const saveProduct = safe(async (formData: FormData) => {
  const id = Number(formData.get('id') || 0);
  const name = String(formData.get('name') || '').trim();
  if (!name) return fail('Product name is required');
  const cost = Number(formData.get('cost_price') || 0);
  const sell = Number(formData.get('sell_price') || 0);
  const mrp = Number(formData.get('mrp') || sell);
  const fields = [
    name,
    String(formData.get('category') || 'General').trim(),
    String(formData.get('meesho_url') || '').trim(),
    String(formData.get('image_url') || '').trim(),
    String(formData.get('description') || '').trim(),
    String(formData.get('tags') || '').trim(),
    cost,
    sell,
    mrp,
    Number(formData.get('commission_pct') || 0),
    Number(formData.get('stock') || 0),
  ];
  if (id > 0) {
    await run(
      `UPDATE products SET name=?, category=?, meesho_url=?, image_url=?, description=?, tags=?,
       cost_price=?, sell_price=?, mrp=?, commission_pct=?, stock=?, updated_at=datetime('now') WHERE id=?`,
      [...fields, id],
    );
  } else {
    await run(
      `INSERT INTO products (name, category, meesho_url, image_url, description, tags, cost_price, sell_price, mrp, commission_pct, stock, is_sample)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,0)`,
      fields as any,
    );
  }
  revalidatePath('/products');
  revalidatePath('/');
  return ok();
});

export const deleteProduct = safe(async (id: number) => {
  await run('DELETE FROM products WHERE id = ?', [id]);
  revalidatePath('/products');
  return ok();
});

export const clearSampleProducts = safe(async () => {
  await run('DELETE FROM products WHERE is_sample = 1');
  revalidatePath('/products');
  return ok();
});

function parseCsv(text: string): Record<string, string>[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return [];
  const split = (line: string) => {
    const out: string[] = [];
    let cur = '', inQ = false;
    for (const ch of line) {
      if (ch === '"') { inQ = !inQ; continue; }
      if (ch === ',' && !inQ) { out.push(cur.trim()); cur = ''; continue; }
      cur += ch;
    }
    out.push(cur.trim());
    return out;
  };
  const headers = split(lines[0]).map((h) => h.toLowerCase().replace(/\s+/g, '_'));
  return lines.slice(1).map((l) => {
    const cells = split(l);
    const row: Record<string, string> = {};
    headers.forEach((h, i) => (row[h] = cells[i] ?? ''));
    return row;
  });
}

export const importProductsCSV = safe(async (csv: string) => {
  const rows = parseCsv(csv);
  if (!rows.length) return fail('No rows found. Expected header: name,cost_price,sell_price,mrp,category,meesho_url,image_url,stock,tags');
  let count = 0;
  for (const r of rows) {
    const name = r.name || r.product || '';
    if (!name) continue;
    await run(
      `INSERT INTO products (name, category, meesho_url, image_url, cost_price, sell_price, mrp, stock, tags, is_sample)
       VALUES (?,?,?,?,?,?,?,?,?,0)`,
      [name, r.category || 'General', r.meesho_url || '', r.image_url || '',
       Number(r.cost_price || r.cost || 0), Number(r.sell_price || r.price || 0), Number(r.mrp || 0),
       Number(r.stock || 50), r.tags || ''],
    );
    count++;
  }
  revalidatePath('/products');
  return ok({ count });
});

// ── Orders ──────────────────────────────────────────────────────────────────
export const saveOrder = safe(async (formData: FormData) => {
  const productId = Number(formData.get('product_id') || 0);
  const qty = Math.max(1, Number(formData.get('quantity') || 1));
  const paymentMode = String(formData.get('payment_mode') || 'cod');
  let productName = String(formData.get('product_name') || '');
  let cost = Number(formData.get('cost') || 0);
  let total = Number(formData.get('total') || 0);
  if (productId > 0) {
    const p = await get('SELECT name, cost_price, sell_price FROM products WHERE id = ?', [productId]);
    if (p) {
      productName = productName || p.name;
      if (!cost) cost = p.cost_price * qty;
      if (!total) total = p.sell_price * qty;
    }
  }
  const customer = String(formData.get('customer_name') || '').trim();
  if (!customer) return fail('Customer name is required');
  if (!total) total = Number(formData.get('total_manual') || 0);
  await run(
    `INSERT INTO orders (customer_name, phone, address, product_id, quantity, product_name, total, cost, channel, payment_mode, payment_status, notes)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
    [customer, String(formData.get('phone') || '').trim(), String(formData.get('address') || '').trim(),
     productId || null, qty, productName, total, cost, String(formData.get('channel') || 'instagram'),
     paymentMode, paymentMode === 'prepaid' ? 'pending' : 'cod', String(formData.get('notes') || '').trim()],
  );
  revalidatePath('/orders');
  revalidatePath('/');
  return ok();
});

const ORDER_FLOW: Record<string, string> = {
  new: 'confirmed',
  confirmed: 'ordered_on_meesho',
  ordered_on_meesho: 'shipped',
  shipped: 'delivered',
};

export const advanceOrder = safe(async (orderId: number) => {
  const o = await get('SELECT * FROM orders WHERE id = ?', [orderId]);
  if (!o) return fail('Order not found');
  const next = ORDER_FLOW[o.status];
  if (!next) return fail(o.status === 'delivered' ? 'Already delivered' : 'Cannot advance this order');
  await run(`UPDATE orders SET status=?, updated_at=datetime('now') WHERE id=?`, [next, orderId]);
  if (next === 'delivered' && !o.profit_credited) {
    const profit = Number(o.total) - Number(o.cost) - Number(o.total) * 0; // product cost incl. shipping in cost price
    await run(`INSERT INTO wallet_txns (type, amount, note, ref_id) VALUES ('order_profit', ?, ?, ?)`,
      [profit, `Profit — order #${orderId} (${o.product_name})`, orderId]);
    await run(`UPDATE orders SET profit_credited = 1 WHERE id = ?`, [orderId]);
  }
  revalidatePath('/orders');
  revalidatePath('/wallet');
  revalidatePath('/');
  return ok({ status: next });
});

export const setOrderStatus = safe(async (orderId: number, status: string) => {
  const allowed = ['new', 'confirmed', 'ordered_on_meesho', 'shipped', 'delivered', 'cancelled', 'returned'];
  if (!allowed.includes(status)) return fail('Invalid status');
  const o = await get('SELECT * FROM orders WHERE id = ?', [orderId]);
  if (!o) return fail('Order not found');
  await run(`UPDATE orders SET status=?, updated_at=datetime('now') WHERE id=?`, [status, orderId]);
  if (status === 'delivered' && !o.profit_credited) {
    const profit = Number(o.total) - Number(o.cost);
    await run(`INSERT INTO wallet_txns (type, amount, note, ref_id) VALUES ('order_profit', ?, ?, ?)`,
      [profit, `Profit — order #${orderId} (${o.product_name})`, orderId]);
    await run(`UPDATE orders SET profit_credited = 1 WHERE id = ?`, [orderId]);
  }
  revalidatePath('/orders');
  revalidatePath('/wallet');
  revalidatePath('/');
  return ok({ status });
});

export const markOrderPaid = safe(async (orderId: number) => {
  await run(`UPDATE orders SET payment_status='paid', updated_at=datetime('now') WHERE id=?`, [orderId]);
  revalidatePath('/orders');
  return ok();
});

export const sendOrderPaymentLink = safe(async (orderId: number) => {
  const o = await get('SELECT * FROM orders WHERE id = ?', [orderId]);
  if (!o) return fail('Order not found');
  const keyId = await getSetting('razorpay_key_id');
  const keySecret = await getSetting('razorpay_key_secret');
  if (!keyId || !keySecret) return fail('Razorpay not connected — add Key ID & Secret in Connectors.');
  const link = await createPaymentLink(keyId, keySecret, {
    amountInr: Number(o.total),
    description: `${o.product_name} (Order #${orderId}) — ${o.customer_name}`,
    customerName: o.customer_name,
    customerPhone: o.phone,
    referenceId: `shadow-order-${orderId}`,
  });
  await run(`UPDATE orders SET razorpay_link_id=?, razorpay_link_url=? WHERE id=?`, [link.id, link.shortUrl, orderId]);
  // Try WhatsApp delivery if connected (inside 24h customer-service window or via utility template)
  let waSent = false;
  try {
    const token = await getSetting('whatsapp_access_token');
    const phoneId = await getSetting('whatsapp_phone_number_id');
    if (token && phoneId && o.phone) {
      await sendWhatsAppText(token, phoneId, o.phone,
        `Namaste ${o.customer_name}! 🙏\nAapka order: *${o.product_name}* — ₹${Math.round(o.total)}\n💳 Payment link: ${link.shortUrl}\nDelivery 2-6 days mein, COD available hai. Shukriya!`);
      waSent = true;
    }
  } catch { /* link still created; user can share it manually */ }
  revalidatePath('/orders');
  return ok({ url: link.shortUrl, waSent });
});

// ── AI content ──────────────────────────────────────────────────────────────
export const generateContentAction = safe(async (kind: ContentKind, productId: number | null, brief: string) => {
  let product: any = null;
  if (productId) product = await get('SELECT * FROM products WHERE id = ?', [productId]);
  const r = await generateContent(kind, product, brief);
  return ok({ text: r.text, source: r.source, model: r.model ?? '' });
});

export const generateBriefAction = safe(async () => {
  const statsRow = await get(`
    SELECT
      (SELECT COUNT(*) FROM orders WHERE date(created_at) = date('now')) AS ordersToday,
      COALESCE((SELECT SUM(total) FROM orders WHERE date(created_at) = date('now') AND status != 'cancelled'), 0) AS revenueToday,
      (SELECT COUNT(*) FROM orders WHERE status IN ('new','confirmed')) AS pendingOrders,
      COALESCE((SELECT SUM(amount) FROM wallet_txns), 0) - COALESCE((SELECT SUM(amount) FROM withdrawals WHERE status='paid'), 0) AS walletBalance,
      COALESCE((SELECT SUM(spend) FROM campaigns), 0) AS adSpend
  `);
  const top = await get(`SELECT product_name AS n, COUNT(*) c FROM orders WHERE product_name != '' GROUP BY product_name ORDER BY c DESC LIMIT 1`);
  const r = await generateDailyBrief({
    ordersToday: Number(statsRow?.ordersToday ?? 0),
    revenueToday: Number(statsRow?.revenueToday ?? 0),
    walletBalance: Number(statsRow?.walletBalance ?? 0),
    pendingOrders: Number(statsRow?.pendingOrders ?? 0),
    topProduct: top?.n ?? null,
    adSpend: Number(statsRow?.adSpend ?? 0),
  });
  await setSetting('ai_brief', r.text);
  await setSetting('ai_brief_at', new Date().toISOString());
  revalidatePath('/');
  return ok({ text: r.text, source: r.source });
});

// ── Composer / posts ────────────────────────────────────────────────────────
export const savePost = safe(async (formData: FormData) => {
  const platform = String(formData.get('platform') || 'instagram');
  const content = String(formData.get('content') || '').trim();
  if (!content) return fail('Post content is empty');
  const productId = Number(formData.get('product_id') || 0) || null;
  const mediaUrl = String(formData.get('media_url') || '').trim();
  const intent = String(formData.get('intent') || 'draft'); // draft | now | scheduled
  const scheduledAt = String(formData.get('scheduled_at') || '');
  const ai = formData.get('ai_generated') === '1' ? 1 : 0;
  const inserted = await run(
    `INSERT INTO posts (product_id, platform, content, media_url, status, scheduled_at, ai_generated)
     VALUES (?,?,?,?,?,?,?)`,
    [productId, platform, content, mediaUrl,
     intent === 'scheduled' ? 'scheduled' : 'draft',
     intent === 'scheduled' && scheduledAt ? new Date(scheduledAt).toISOString().replace('T', ' ').slice(0, 19) : null,
     ai],
  );
  const id = await lastId();
  if (intent === 'now') {
    const r = await publishPost(id);
    if (!r.ok) return ok({ published: false, error: r.error });
    return ok({ published: true, externalId: r.externalId });
  }
  revalidatePath('/composer');
  return ok({ published: false });
});

export const publishPostNow = safe(async (postId: number) => {
  const r = await publishPost(postId);
  revalidatePath('/composer');
  revalidatePath('/');
  return r.ok ? ok({ externalId: r.externalId }) : fail(r.error ?? 'Publish failed');
});

export const deletePost = safe(async (postId: number) => {
  await run('DELETE FROM posts WHERE id = ?', [postId]);
  revalidatePath('/composer');
  return ok();
});

// ── Ads ─────────────────────────────────────────────────────────────────────
export const createCampaign = safe(async (formData: FormData) => {
  const name = String(formData.get('name') || '').trim() || 'Shadow Campaign';
  const productId = Number(formData.get('product_id') || 0) || null;
  const dailyBudget = Number(formData.get('daily_budget') || 100);
  const destinationUrl = String(formData.get('destination_url') || '').trim();
  const headline = String(formData.get('headline') || name).slice(0, 40);
  const primaryText = String(formData.get('primary_text') || '');
  const description = String(formData.get('description') || '').slice(0, 30);
  const pushToMeta = formData.get('push_to_meta') === '1';
  let metaCampaignId = '', metaAdsetId = '', metaAdId = '', metaError = '', status = 'paused';
  if (pushToMeta) {
    const token = await getSetting('meta_access_token');
    const adAccountId = await getSetting('meta_ad_account_id');
    const pageId = await getSetting('meta_page_id');
    if (!token || !adAccountId || !pageId) {
      metaError = 'Meta not fully connected (need token, Ad Account ID, Page ID). Saved locally as paused draft.';
    } else {
      const imageUrl = productId
        ? (await get<{ image_url: string }>('SELECT image_url FROM products WHERE id=?', [productId]))?.image_url ?? ''
        : '';
      try {
        const r = await createMetaCampaign(token, adAccountId, {
          name, dailyBudgetInr: dailyBudget, destinationUrl: destinationUrl || 'https://www.facebook.com',
          headline, primaryText, description, imageUrl, pageId,
        });
        metaCampaignId = r.campaignId; metaAdsetId = r.adsetId; metaAdId = r.adId;
      } catch (e: any) {
        metaError = (e?.message ?? String(e)).slice(0, 400);
      }
    }
  }
  await run(
    `INSERT INTO campaigns (product_id, name, daily_budget, destination_url, status, meta_campaign_id, meta_adset_id, meta_ad_id, meta_error)
     VALUES (?,?,?,?,?,?,?,?,?)`,
    [productId, name, dailyBudget, destinationUrl, status, metaCampaignId, metaAdsetId, metaAdId, metaError],
  );
  revalidatePath('/ads');
  revalidatePath('/');
  return metaError ? ok({ metaError }) : ok({ pushed: !!metaCampaignId });
});

export const syncCampaignInsights = safe(async () => {
  const token = await getSetting('meta_access_token');
  const adAccountId = await getSetting('meta_ad_account_id');
  if (!token || !adAccountId) return fail('Meta Ads not connected — add token & Ad Account ID in Connectors.');
  const insights = await fetchCampaignInsights(token, adAccountId);
  let updated = 0;
  for (const row of insights) {
    const spend = Number(row.spend || 0);
    const r = await run(
      `UPDATE campaigns SET spend=?, impressions=?, clicks=? WHERE meta_campaign_id=?`,
      [spend, Number(row.impressions || 0), Number(row.clicks || 0), row.campaign_id],
    );
    updated++;
  }
  revalidatePath('/ads');
  return ok({ updated });
});

export const logAdSpend = safe(async (campaignId: number, amount: number) => {
  if (!(amount > 0)) return fail('Enter a positive amount');
  await run(`UPDATE campaigns SET spend = spend + ? WHERE id = ?`, [amount, campaignId]);
  await run(`INSERT INTO wallet_txns (type, amount, note, ref_id) VALUES ('ad_spend', ?, ?, ?)`,
    [-Math.abs(amount), `Ad spend — campaign #${campaignId}`, campaignId]);
  revalidatePath('/ads');
  revalidatePath('/wallet');
  return ok();
});

export const deleteCampaign = safe(async (id: number) => {
  await run('DELETE FROM campaigns WHERE id = ?', [id]);
  revalidatePath('/ads');
  return ok();
});

// ── Wallet / withdrawals ────────────────────────────────────────────────────
export const requestWithdrawal = safe(async (formData: FormData) => {
  const amount = Number(formData.get('amount') || 0);
  const method = String(formData.get('method') || 'upi');
  const destination = String(formData.get('destination') || '').trim();
  if (!(amount > 0)) return fail('Enter a positive amount');
  if (!destination) return fail('Enter your UPI ID or bank account details');
  const bal = await walletBalance();
  if (amount > bal) return fail(`Insufficient balance. Available: ₹${Math.round(bal)}`);
  await run(`INSERT INTO withdrawals (amount, method, destination, status) VALUES (?,?,?,'paid')`, [amount, method, destination]);
  revalidatePath('/wallet');
  revalidatePath('/');
  return ok();
});

export async function walletBalance(): Promise<number> {
  const row = await get<{ b: number }>(`
    SELECT COALESCE((SELECT SUM(amount) FROM wallet_txns), 0)
         - COALESCE((SELECT SUM(amount) FROM withdrawals WHERE status='paid'), 0) AS b`);
  return Number(row?.b ?? 0);
}

// ── Connectors: test buttons (real API pings) ───────────────────────────────
export const testConnector = safe(async (kind: string) => {
  const s = await getSettingsMap();
  switch (kind) {
    case 'ai': {
      if (!s.ai_api_key) return fail('No AI key saved yet. Paste one above and save.');
      const base = (s.ai_base_url || 'https://api.openai.com/v1').replace(/\/+$/, '');
      const model = s.ai_model || 'gpt-4o-mini';
      const res = await fetch(`${base}/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${s.ai_api_key}` },
        body: JSON.stringify({ model, max_tokens: 5, messages: [{ role: 'user', content: 'ping' }] }),
        signal: AbortSignal.timeout(30_000),
      });
      if (!res.ok) return fail(`AI provider responded ${res.status}. Check base URL, key & model name.`);
      return ok({ message: `AI connected — ${model} is responding.` });
    }
    case 'meta': {
      if (!s.meta_access_token) return fail('No Meta token saved.');
      const r = await testMeta(s.meta_access_token, s.meta_page_id || undefined);
      return ok({ message: `Meta OK — signed in as ${r.user}${r.pageName ? ` · Page: ${r.pageName}` : ''}` });
    }
    case 'instagram': {
      if (!s.meta_access_token || !s.meta_ig_user_id) return fail('Meta token + IG User ID required.');
      const r = await testInstagram(s.meta_access_token, s.meta_ig_user_id);
      return ok({ message: `Instagram OK — @${r.username} · ${r.followers} followers` });
    }
    case 'whatsapp': {
      if (!s.whatsapp_access_token || !s.whatsapp_phone_number_id) return fail('WhatsApp token + Phone Number ID required.');
      const r = await testWhatsApp(s.whatsapp_access_token, s.whatsapp_phone_number_id);
      return ok({ message: `WhatsApp OK — ${r.number} (${r.name}) · quality: ${r.quality || 'n/a'}` });
    }
    case 'x': {
      if (!s.x_api_key || !s.x_access_token) return fail('X needs all 4 keys.');
      const r = await verifyX({ consumerKey: s.x_api_key, consumerSecret: s.x_api_secret, accessToken: s.x_access_token, accessSecret: s.x_access_secret });
      return ok({ message: `X OK — signed in as @${r.username}` });
    }
    case 'youtube': {
      if (!s.youtube_refresh_token) return fail('YouTube not linked yet. Click "Connect YouTube" first.');
      const r = await verifyYouTube(s.youtube_client_id, s.youtube_client_secret, s.youtube_refresh_token);
      return ok({ message: `YouTube OK — ${r.channelTitle}` });
    }
    case 'razorpay': {
      if (!s.razorpay_key_id || !s.razorpay_key_secret) return fail('Razorpay Key ID & Secret required.');
      const auth = Buffer.from(`${s.razorpay_key_id}:${s.razorpay_key_secret}`).toString('base64');
      const res = await fetch('https://api.razorpay.com/v1/payment_links?count=1', {
        headers: { Authorization: `Basic ${auth}` },
        signal: AbortSignal.timeout(30_000),
      });
      if (!res.ok) return fail(`Razorpay responded ${res.status} — check your keys.`);
      return ok({ message: 'Razorpay OK — keys are valid.' });
    }
    default:
      return fail('Unknown connector');
  }
});

// ── Settings save ───────────────────────────────────────────────────────────
export const saveSettings = safe(async (formData: FormData) => {
  for (const key of SETTING_KEYS) {
    const v = formData.get(key);
    if (v === null) continue;
    const val = String(v).trim();
    // For masked secrets: if the field still contains the mask bullets, keep existing value
    if (val.includes('••')) continue;
    if (val === '' && (key === 'ai_api_key' || key.includes('token') || key.includes('secret') || key.includes('key'))) {
      // allow explicit clearing only via clearSecret; empty means "keep"
      continue;
    }
    await setSetting(key as SettingKey, val);
  }
  revalidatePath('/settings');
  revalidatePath('/connectors');
  revalidatePath('/');
  return ok();
});

export const clearSecret = safe(async (key: SettingKey) => {
  await setSetting(key, '');
  revalidatePath('/settings');
  revalidatePath('/connectors');
  return ok();
});

export const resetStoreData = safe(async () => {
  for (const t of ['orders', 'posts', 'campaigns', 'interactions', 'wallet_txns', 'withdrawals']) {
    await run(`DELETE FROM ${t}`);
  }
  await run('DELETE FROM products WHERE is_sample = 0');
  revalidatePath('/');
  return ok();
});
