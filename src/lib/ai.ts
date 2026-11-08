// ─────────────────────────────────────────────────────────────────────────────
// Shadow AI engine — talks to any OpenAI-compatible cloud endpoint
// (OpenAI, DeepSeek, Groq, Gemini, OpenRouter, Together, local ollama...).
// If no key is configured, falls back to offline Hinglish templates so the
// app never dead-ends; results are clearly labelled as offline drafts.
// ─────────────────────────────────────────────────────────────────────────────
import { getAIConfig, getSetting } from './settings';

export interface AIResult {
  text: string;
  source: 'cloud' | 'offline';
  model?: string;
}

export async function aiChat(system: string, user: string, temperature = 0.8, maxTokens = 1200): Promise<AIResult> {
  const { base, key, model } = await getAIConfig();
  if (!key) {
    return { text: '', source: 'offline' };
  }
  const res = await fetch(`${base}/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model,
      temperature,
      max_tokens: maxTokens,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
    }),
    signal: AbortSignal.timeout(60_000),
  });
  if (!res.ok) {
    const err = await res.text().catch(() => String(res.status));
    throw new Error(`AI provider error ${res.status}: ${err.slice(0, 300)}`);
  }
  const json = await res.json();
  const text = json?.choices?.[0]?.message?.content?.trim() ?? '';
  return { text, source: 'cloud', model };
}

export async function aiConfigured(): Promise<boolean> {
  return !!(await getSetting('ai_api_key'));
}

// ── Language helper ──────────────────────────────────────────────────────────
export async function languageInstruction(): Promise<string> {
  const lang = (await getSetting('content_language')) || 'hinglish';
  switch (lang) {
    case 'english':
      return 'Write in fluent, punchy marketing English.';
    case 'hindi':
      return 'Write in pure Hindi (Devanagari script), natural conversational marketing Hindi.';
    default:
      return 'Write in Hinglish — Hindi written in Roman script mixed with English, the way Indian Instagram/WhatsApp marketing actually sounds. Example tone: "Ye offer mat miss karo! Free delivery aur COD available hai."';
  }
}

// ── Specialised generators (cloud first, offline template fallback) ─────────
export interface ProductLite {
  name: string;
  sell_price: number;
  mrp?: number | null;
  category?: string | null;
  tags?: string | null;
  cost_price?: number | null;
}

const inrShort = (n: number) => `₹${Math.round(n)}`;
const discountOf = (p: ProductLite) =>
  p.mrp && p.mrp > p.sell_price ? Math.round((1 - p.sell_price / p.mrp) * 100) : 0;

export type ContentKind =
  | 'instagram_caption'
  | 'facebook_post'
  | 'x_post'
  | 'whatsapp_broadcast'
  | 'youtube_shorts'
  | 'ad_copy'
  | 'seo_description'
  | 'hashtags'
  | 'customer_reply';

export async function generateContent(kind: ContentKind, product: ProductLite | null, brief = ''): Promise<AIResult> {
  const lang = await languageInstruction();
  const biz = (await getSetting('business_name')) || 'Shadow Store';
  const p = product;
  const discount = p ? discountOf(p) : 0;
  const priceLine = p ? `Selling price ${inrShort(p.sell_price)}${p.mrp && p.mrp > p.sell_price ? ` (MRP ${inrShort(p.mrp)}, ${discount}% OFF)` : ''}` : '';
  const productLine = p ? `Product: ${p.name}\nCategory: ${p.category ?? 'General'}\n${priceLine}\nTags: ${p.tags ?? '—'}` : '';

  const system = `You are Shadow AI, the marketing director of "${biz}", an Indian Meesho-based reseller selling on Instagram, Facebook, WhatsApp, YouTube and X. ${lang} Be specific, energetic, trustworthy. Never invent facts. Use emojis tastefully. Keep claims believable (COD available only if it is — assume COD + free delivery across India). Output ONLY the final content, no preamble.`;

  const prompts: Record<ContentKind, string> = {
    instagram_caption: `${productLine}\nWrite an Instagram caption for this product: hook line, 2-3 benefit lines, price + CTA ("DM to order" / "Link in bio"), then 8-12 relevant hashtags on a new line. Extra brief: ${brief || 'launch post'}`,
    facebook_post: `${productLine}\nWrite a Facebook page post: warmer, family-friendly tone, benefits, price, CTA to comment "ORDER" or message the page, 3-5 hashtags. Brief: ${brief || 'deal post'}`,
    x_post: `${productLine}\nWrite an X (Twitter) post under 280 characters. Punchy, one emoji hook, price, CTA, 2 hashtags max. Brief: ${brief || 'launch'}`,
    whatsapp_broadcast: `${productLine}\nWrite a WhatsApp broadcast message for the shop's customer list (relational, respectful, not spammy): greeting, short product pitch, price, "Reply ORDER to buy" / payment via Razorpay link mention. Max 60 words. Brief: ${brief || 'offer broadcast'}`,
    youtube_shorts: `${productLine}\nWrite a YouTube Shorts script (45-60 seconds): spoken lines with [frame cues] in brackets, hook in first 2 seconds, demo benefits, price reveal, CTA "Follow for daily deals". Also give: a title (under 60 chars), a 2-line description, 6 tags. Brief: ${brief || 'review/demo'}`,
    ad_copy: `${productLine}\nWrite Meta (Facebook/Instagram) ad copy: 3 variants. Each variant = Primary text (max 125 chars) + Headline (max 40 chars) + Description (max 30 chars). Angles: (1) price/value anchor, (2) social proof/COD fear removal, (3) urgency/limited stock. Brief: ${brief || 'performance ad'}`,
    seo_description: `${productLine}\nWrite a marketplace-ready product description: 1 catchy line, 4 bullet benefits, dimensions/material (generic-safe), COD + free delivery note, care instructions. 120-160 words. Brief: ${brief || 'catalog listing'}`,
    hashtags: `${productLine}\nGive 25 Instagram hashtags for this product in India: mix of broad (#fashion), niche (#kurtidesigner) and Hindi/Hinglish tags. Comma separated, no # duplicates, no banned tags. Brief: ${brief}`,
    customer_reply: `Context: A customer asked: "${brief}"\n${productLine}\nWrite a short, helpful Hinglish reply (max 50 words) answering accurately using only the product info above. If they ask price/delivery: ${priceLine}, free delivery, COD available, instant delivery in 2-6 days. Invite them to confirm the order with their full address + pincode.`,
  };

  const cloud = await aiChat(system, prompts[kind], 0.85, 1100);
  if (cloud.source === 'cloud' && cloud.text) return cloud;

  // ── Offline templates (used only when no AI key is configured) ──
  return { text: offlineTemplate(kind, product, biz, brief), source: 'offline' };
}

function offlineTemplate(kind: ContentKind, p: ProductLite | null, biz: string, brief: string): string {
  const name = p?.name ?? 'Product';
  const price = p ? inrShort(p.sell_price) : '₹---';
  const disc = p ? discountOf(p) : 0;
  const discLine = disc > 0 ? ` (${disc}% OFF aaj hi!)` : '';
  switch (kind) {
    case 'instagram_caption':
      return `${name} — ab aapki shopping list mein 🛒✨\n\n✅ Premium quality\n✅ Free delivery all over India\n✅ Cash on Delivery available\n✅ Easy 7-day returns\n\n💰 Sirf ${price}${discLine}\n\n📩 Order ke liye DM karo ya comment "ORDER"!\n\n#onlineshopping #india #meeshofinds #bestdeal #trending #shopping #cod #freedelivery #instashopping #dukan`;
    case 'facebook_post':
      return `${name} 🎉\n\n${biz} laaya hai aapke liye best quality at unbeatable price!\n\n💰 Sirf ${price}${discLine}\n🚚 Free delivery | 💵 COD available | 🔄 Easy returns\n\n👉 Comment "ORDER" ya message page — same day confirmation!\n\n#OnlineShopping #BestDeal #COD #FreeDelivery #DesiDeals`;
    case 'x_post':
      return `${name} — sirf ${price}${discLine}! ✅ Free delivery ✅ COD across India 📩 DM to order\n\n#OnlineShopping #Deals`;
    case 'whatsapp_broadcast':
      return `Namaste! 🙏 ${biz} ki taraf se special offer:\n\n🛍️ *${name}*\n💰 Sirf *${price}*${discLine}\n🚚 Free delivery | 💵 COD available\n\nOrder ke liye *ORDER* reply karein ya payment link ke liye boliye. Shukriya! 🙏`;
    case 'youtube_shorts':
      return `[0-2s] HOOK: "₹${p?.sell_price ?? '---'} mein ye deal? Wait karo!"\n[2-10s] Product reveal + 3 key features close-up\n[10-35s] Quality demo, who it's for\n[35-50s] Price reveal: sirf ${price} + free delivery + COD\n[50-60s] "Follow karo daily deals ke liye! ORDER ke liye description link"\n\nTITLE: ${name.slice(0, 55)} | Sirf ${price}\nDESC: Best quality, free delivery all India, COD available. DM to order!\nTAGS: shopping, meesho, deal, unboxing, india`;
    case 'ad_copy':
      return `Variant 1 (Value)\nPrimary: Sirf ${price} mein ${name} — free delivery + COD available. Aaj hi order karo!\nHeadline: ${disc > 0 ? `${disc}% OFF Today` : 'Best Price Online'}\nDescription: Free delivery across India\n\nVariant 2 (Trust)\nPrimary: 10,000+ happy customers. COD available — pehle dekho, phir pay karo!\nHeadline: COD Available\nDescription: Easy 7-day returns\n\nVariant 3 (Urgency)\nPrimary: Stock limited! ${name} sirf ${price} mein, aaj khatam hone se pehle grab karo ⏰\nHeadline: Limited Stock!\nDescription: Order now, pay on delivery`;
    case 'seo_description':
      return `${name} — premium quality at the best price online.\n\n✅ Superior fabric/material, long-lasting\n✅ Perfect for daily use & gifting\n✅ Free delivery all over India\n✅ Cash on Delivery (COD) available\n✅ Easy 7-day replace/return\n\nCare: Gentle wash, dry in shade.\n"${brief || 'Trusted by thousands of customers across India.'}"`;
    case 'hashtags':
      return `#MeeshoFinds, #OnlineShoppingIndia, #DesiDeals, #CODAvailable, #FreeDelivery, #ShoppingAddict, #BestPrice, #IndianFashion, #BudgetShopping, #TrendingNow, #DealOfTheDay, #ShopLocal, #EthnicWear, #FashionIndia, #InstaShopping, #HomeDecor, #SmartBuys, #OfferTime, #KudratKaKarishma, #DealsUnder500, #WomenFashion, #MenFashion, #KitchenEssentials, #GadgetDeals, #ValueForMoney`;
    case 'customer_reply':
      return `Ji! ${name} sirf ${price} mein available hai${discLine}. Free delivery + COD available hai, 2-6 days mein delivery milegi. Order confirm karne ke liye apna full address + pincode bhejo, main abhi booking kar deti/deta hoon! 😊`;
  }
}

// ── Daily business brief (cached in settings, regenerated on demand) ────────
export async function generateDailyBrief(stats: {
  ordersToday: number; revenueToday: number; walletBalance: number;
  pendingOrders: number; topProduct: string | null; adSpend: number;
}): Promise<AIResult> {
  const { base, key, model } = await getAIConfig();
  const biz = (await getSetting('business_name')) || 'Shadow Store';
  const prompt = `You are the COO of ${biz}, an Indian Meesho-reseller brand. Today's numbers: orders today=${stats.ordersToday}, revenue today=₹${stats.revenueToday}, wallet balance to withdraw=₹${stats.walletBalance}, orders pending action=${stats.pendingOrders}, best-selling product=${stats.topProduct ?? 'n/a'}, total ad spend=₹${stats.adSpend}. Give a 5-bullet executive brief in Hinglish: (1) what to celebrate, (2) risk/attention needed, (3) 2 concrete marketing actions for today (which product, which platform, what content), (4) inventory/order action, (5) one line on cash. Max 180 words. No preamble.`;
  if (!key) {
    return {
      source: 'offline',
      text: `📊 Offline brief (connect AI in Settings for a real-time COO brief)\n• Orders today: ${stats.ordersToday} | Revenue: ₹${Math.round(stats.revenueToday)}\n• Wallet balance: ₹${Math.round(stats.walletBalance)} — withdraw when needed\n• Pending orders: ${stats.pendingOrders} — confirm them today, COD returns hurt most\n• Push bestseller "${stats.topProduct ?? 'your top product'}" on Instagram + WhatsApp broadcast\n• Keep ad spend under 15% of revenue; pause anything below 1.5x ROAS`,
    };
  }
  const res = await fetch(`${base}/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
    body: JSON.stringify({ model, temperature: 0.7, max_tokens: 420, messages: [{ role: 'user', content: prompt }] }),
    signal: AbortSignal.timeout(45_000),
  });
  if (!res.ok) throw new Error(`AI provider error ${res.status}`);
  const json = await res.json();
  return { text: json?.choices?.[0]?.message?.content?.trim() ?? '', source: 'cloud', model };
}
