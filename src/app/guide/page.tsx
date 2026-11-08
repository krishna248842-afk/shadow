import {
  Rocket, Cloud, ShoppingBag, Bot, Instagram, MessageCircle, Youtube, Twitter, CreditCard,
  ShieldCheck, IndianRupee, AlertTriangle, CircleCheck, ChevronDown, Smartphone, Globe, Server,
} from 'lucide-react';

export default function GuidePage() {
  return (
    <div className="space-y-6">
      <div>
        <p className="section-title">Setup Guide</p>
        <h1 className="mt-1 font-display text-2xl font-bold text-white sm:text-3xl">Zero → Live in <span className="gradient-text">30 Minutes</span></h1>
        <p className="mt-1 max-w-2xl text-xs leading-relaxed text-zinc-500">No fluff. This is exactly how Shadow goes from a Git repo to a money-printing, AI-run storefront — including the parts no one tells you (keys, approvals, COD returns, Meesho settlement).</p>
      </div>

      {/* MASTER CHECKLIST */}
      <div className="card border-lime-500/25 bg-gradient-to-br from-lime-500/[0.06] to-transparent p-5">
        <p className="section-title !text-lime-300/90">Master checklist — tick these in order</p>
        <ol className="mt-3 grid gap-2 text-[12px] text-zinc-300 sm:grid-cols-2">
          {[
            'Deploy Shadow to a public URL (Render, free) — Section 1',
            'Set APP_PASSWORD so only YOU can open it',
            'Add your AI key (DeepSeek ₹500 top-up or Groq free) — Connectors',
            'Add 5–10 real Meesho products with YOUR prices — Catalog',
            'Fill Business Profile: name, UPI, city — it powers every AI line',
            'Connect Meta token (FB Page + IG Business) — Connectors',
            'Set up WhatsApp webhook — AI now answers all DMs 24/7',
            'Generate your first 3 posts from AI Studio',
            'Post daily: 1 Reel + 1 Story + 1 WhatsApp broadcast',
            'First order → confirm → place on Meesho → track to delivered',
          ].map((t, i) => (
            <li key={i} className="flex items-start gap-2.5 rounded-xl border border-line bg-panel2 px-3 py-2.5">
              <span className="grid h-5 w-5 shrink-0 place-items-center rounded-md bg-lime-500/15 font-display text-[10px] font-bold text-lime-300">{i + 1}</span>
              <span className="leading-snug">{t}</span>
            </li>
          ))}
        </ol>
      </div>

      <Section id="deploy" icon={<Cloud size={18} className="text-sky-400" />} title="1 · Deploy to the cloud (free) — your phone becomes the control room">
        <p><b>Option A — Render (recommended, free tier):</b></p>
        <ol className="list-decimal space-y-1.5 pl-5">
          <li>Push is already done — the repo <code>krishna248842-afk/shadow</code> contains <code>render.yaml</code> (a Render Blueprint).</li>
          <li>Go to <Ext href="https://dashboard.render.com/blueprints">dashboard.render.com → Blueprints → New Blueprint Instance</Ext>.</li>
          <li>Connect GitHub → select <code>krishna248842-afk/shadow</code> → Render reads <code>render.yaml</code>: creates a Web Service with a <b>1 GB persistent disk</b> mounted at <code>/var/data</code> (your SQLite database lives there) and sets <code>DATABASE_PATH=/var/data/shadow.db</code>.</li>
          <li>When it asks for env vars, fill: <code>APP_PASSWORD</code> (make one up), <code>APP_BASE_URL</code> (the URL Render shows, e.g. <code>https://shadow-xxx.onrender.com</code>), <code>WHATSAPP_VERIFY_TOKEN</code>, <code>CRON_SECRET</code>.</li>
          <li>Click <b>Apply</b>. ~5 minutes later your store is live at that URL. Open it on your phone → Chrome menu → <b>Add to Home Screen</b> → it looks and opens like an app.</li>
        </ol>
        <p className="mt-2"><b>Option B — Docker (any VPS / Oracle Free Tier / Hostinger):</b> <code>docker build -t shadow . && docker run -p 3000:3000 -v shadow-data:/app/data -e APP_PASSWORD=yourpw -e APP_BASE_URL=https://yourdomain shadow</code></p>
        <p className="mt-2"><b>Option C — Railway / Fly.io:</b> same Dockerfile works; attach a volume at <code>/app/data</code>.</p>
        <p className="mt-2"><b>Vercel?</b> Shadow is a stateful SQLite app — Vercel’s serverless disk is ephemeral, so products/orders would vanish. Use Render/VPS (or wire Turso/Postgres later). Don’t fight the architecture.</p>
        <p className="mt-2 text-amber-200/90"><b>Keep it alive:</b> Render free tier sleeps after 15 min idle. For a store, use the free <code>UptimeRobot</code> ping every 10 min, or Render’s $7/mo starter. Set phone browser bookmark to the URL.</p>
        <p className="mt-2"><b>Scheduled posts 24/7:</b> create a free cron at <Ext href="https://cron-job.org">cron-job.org</Ext> hitting <code>{'https://YOUR-URL/api/cron/tick?secret=YOUR_CRON_SECRET'}</code> every 5 minutes. Otherwise posts publish whenever the dashboard/cron is hit — good enough, but cron is bulletproof.</p>
      </Section>

      <Section id="meesho" icon={<ShoppingBag size={18} className="text-pink-400" />} title="2 · The Meesho reality — how reselling ACTUALLY works in 2026">
        <div className="rounded-xl border border-amber-500/25 bg-amber-500/[0.06] p-3 text-[11px]">
          <p className="flex items-center gap-1.5 font-bold text-amber-300"><AlertTriangle size={13} /> Read this once, save lakhs in mistakes</p>
          <p className="mt-1.5">Meesho has <b>no public reseller API</b> and the old “share a link, keep margin” romantic era is over. Today there are exactly two legal ways to make money from Meesho:</p>
          <ol className="mt-1.5 list-decimal space-y-1 pl-5">
            <li><b>Reseller model (this app’s default):</b> You post Meesho products on YOUR socials at YOUR price. Customer pays you (COD on direct delivery, or Razorpay/UPI prepaid). You then buy that item on the Meesho app and enter the <b>customer’s address</b> as the delivery address. Meesho ships it directly. Your margin = customer price − Meesho price. COD via Razorpay/Meesho remittance settles to your bank.</li>
            <li><b>Supplier model (scale):</b> Register on <Ext href="https://supplier.meesho.com">supplier.meesho.com</Ext> with GST + bank, list your own catalog at Meesho’s prices, Meesho pushes your products to millions of buyers, they handle delivery + returns. You pay Meesho commission (1–15% by category) per delivered order. Shadow tracks this too — log orders manually from the supplier panel.</li>
          </ol>
        </div>
        <p className="mt-2"><b>The daily reseller loop (what Shadow automates):</b></p>
        <ol className="mt-1 list-decimal space-y-1 pl-5">
          <li>Find winning products on Meesho (sort by reviews, 500+ ratings, 4★+, fashion/home/kids sell fastest in Bihar &amp; UP tier-2/3).</li>
          <li>Copy its link into <b>Catalog → Add product</b> with your price (45–60% margin for COD, 30–40% for prepaid).</li>
          <li><b>AI Studio</b> writes caption + ad + Shorts script in Hinglish. <b>Composer</b> publishes to IG/FB/X or copies the WhatsApp broadcast.</li>
          <li>Customer says “ORDER” → <b>Orders → New order</b> (or WhatsApp AI captured it). Confirm on a 20-second call — <b>this kills 30–40% of fake COD orders</b>.</li>
          <li>Open Meesho app → place order → customer address → COD if cash, prepaid for prepaid orders. Status flows: New → Confirmed → Ordered → Shipped → Delivered.</li>
          <li>Delivered → Shadow auto-credits profit to your wallet. Weekly, withdraw. That’s the business.</li>
        </ol>
        <p className="mt-2"><b>Costs people forget:</b> COD returns (20–40% in fashion — price for it), Meesho supplier return shipping (if supplier model, per their policy), your ad spend (keep ≤15% of revenue), and GST if you cross the threshold (Section 6).</p>
      </Section>

      <Section id="ai" icon={<Bot size={18} className="text-violet-400" />} title="3 · AI Brain — what runs on the cloud">
        <p>Shadow’s AI (any OpenAI-compatible endpoint) does five real jobs: <b>(1)</b> captions/ads/scripts in your chosen language, <b>(2)</b> product catalog descriptions, <b>(3)</b> WhatsApp auto-replies grounded in YOUR catalog (never invents prices), <b>(4)</b> the COO daily brief — orders, wallet, what to push today, <b>(5)</b> hashtags + hashtag packs.</p>
        <p className="mt-1.5"><b>Recommended:</b> DeepSeek <code>deepseek-chat</code> (~₹15–25 per MILLION tokens — you could generate 5,000 captions for ₹100) or Groq free tier (Llama 3.3 70B, 30 req/min free). Set it in <Ext href="/connectors">Connectors → AI Brain</Ext>. Without a key, Shadow still works with clearly-labeled offline templates — you’ll feel the quality difference immediately.</p>
      </Section>

      <Section id="meta" icon={<Instagram size={18} className="text-pink-400" />} title="4 · Instagram + Facebook + Ads — the 15-minute connect">
        <p>Full click-by-click is inside <Ext href="/connectors">Connectors → Meta → “How to get these”</Ext>. Short version:</p>
        <ol className="mt-1 list-decimal space-y-1 pl-5">
          <li>Meta developer app (Business type) → add <b>Instagram Graph API</b> + <b>Marketing API</b>.</li>
          <li>IG = Business/Creator account, linked to your FB Page.</li>
          <li>Graph API Explorer → permissions <code>pages_manage_posts</code>, <code>pages_read_engagement</code>, <code>instagram_basic</code>, <code>instagram_content_publish</code>, <code>ads_management</code>, <code>ads_read</code> → generate long-lived token (60 days; refresh quarterly).</li>
          <li>Paste token + Page ID + IG User ID + Ad Account ID → <b>Test connection</b> shows “@yourhandle · N followers”.</li>
          <li><b>Posting:</b> Composer publishes real posts to Page &amp; IG. <b>Ads:</b> Ads page creates PAUSED campaign→adset→creative→ad; you review in Ads Manager and flip live. Nothing spends without your click — ever.</li>
        </ol>
        <p className="mt-2 text-[11px] text-zinc-500">First ad recipe for India: ₹200/day, Advantage+ traffic, tier-2/3 + interests (Online shopping, handloom, kurti), COD creative with UGC-style phone video. ₹3–6/click, 5–8× return if the product is a proven Meesho winner.</p>
      </Section>

      <Section id="whatsapp" icon={<MessageCircle size={18} className="text-emerald-400" />} title="5 · WhatsApp — the channel that closes Indian buyers">
        <ol className="list-decimal space-y-1 pl-5">
          <li>Meta app → WhatsApp → API Setup → copy Phone Number ID + System User token (permanent).</li>
          <li>Webhook URL: <code>/api/webhooks/whatsapp</code> on your deployed domain; verify token from your <code>WHATSAPP_VERIFY_TOKEN</code>.</li>
          <li>Set <code>WHATSAPP_APP_SECRET</code> (Meta app → Settings → Basic → App Secret). Shadow then verifies <code>X-Hub-Signature-256</code> on every webhook call — nobody can spoof customer messages or make your number send paid texts.</li>
          <li>Subscribe to <code>messages</code>. Now every inbound DM gets an AI reply grounded in your catalog — price, stock, COD, delivery ETA, “full address + pincode bhejo, abhi booking kar deta hoon”.</li>
          <li>Every conversation lands in your <b>Inbox (Dashboard activity)</b> so you can close manually anytime.</li>
          <li><b>Approved templates</b> (required for business-initiated messages): create “order_confirmation”, “out_for_delivery”, “payment_reminder” in Meta → WhatsApp → Message Templates, get them approved (24–48h), then automate with a small workflow. Direct broadcasts to cold lists stay manual — paste AI Studio copy into your Broadcast list.</li>
        </ol>
      </Section>

      <Section id="youtube" icon={<Youtube size={18} className="text-red-400" />} title="6 · YouTube Shorts — the free organic reach machine">
        <ol className="list-decimal space-y-1 pl-5">
          <li>Google Cloud → new project → enable <b>YouTube Data API v3</b> → OAuth consent (External, add yourself as test user).</li>
          <li>Credentials → OAuth Web client → redirect URI <code>YOUR-DOMAIN/api/youtube/callback</code>.</li>
          <li>Connectors → YouTube → paste ID/secret → <b>Connect YouTube</b> → consent → done.</li>
          <li>AI Studio → “YouTube Shorts Script” → record 45–60s (hook in 2 seconds, show the product, price reveal at the end) → upload directly from the same screen. Unlisted first; Public when you’re happy.</li>
          <li>Description formula: “COD available all India · Free delivery · DM on IG/WA to order” + your link.</li>
        </ol>
      </Section>

      <Section id="x" icon={<Twitter size={18} className="text-zinc-300" />} title="7 · X (Twitter) — launches & deal drops">
        <ol className="list-decimal space-y-1 pl-5">
          <li><Ext href="https://developer.x.com">developer.x.com</Ext> → free tier → project + app → User authentication: <b>Read and write</b>.</li>
          <li>Keys & tokens → API key/secret + Access token/secret (OAuth 1.0a). Paste 4 keys → <b>Test connection</b>.</li>
          <li>Composer posts land on X in one tap — perfect for deal-of-the-day drops and restock alerts.</li>
        </ol>
      </Section>

      <Section id="payments" icon={<CreditCard size={18} className="text-sky-300" />} title="8 · Razorpay + COD — collecting every rupee">
        <ol className="list-decimal space-y-1 pl-5">
          <li>KYC on Razorpay → Settings → API Keys → generate. Test keys (<code>rzp_test_</code>) work instantly — rehearse everything free.</li>
          <li>Orders board → “Link” button → payment link created for that order; Razorpay auto-SMSes/WhatsApps the customer.</li>
          <li>Webhook <code>/api/webhooks/razorpay</code> (event <code>payment_link.paid</code>) marks the order <b>PAID</b> automatically — zero manual reconciliation.</li>
          <li>COD still rules tier-2/3 fashion. Prepaid + 5% discount link beats COD returns math beautifully — offer both.</li>
        </ol>
      </Section>

      <Section id="money" icon={<IndianRupee size={18} className="text-lime-400" />} title="9 · Money, settlement & tax — the honest bit">
        <ul className="list-disc space-y-1.5 pl-5">
          <li><b>Settlement:</b> Prepaid via your Razorpay → bank in ~T+2. COD collected by courier → settles to YOU only if you use Meesho/delivery partner’s COD remittance — otherwise collect via Meesho (customer pays Meesho, Meesho pays you on delivery — that’s the clean reseller flow) or use Delhivery/Shiprocket COD.</li>
          <li><b>Shadow’s wallet</b> auto-credits profit ONLY when you mark an order <b>Delivered</b> — physics of the business, not a bug. COD returns auto-lose nothing because profit never credited for undelivered orders.</li>
          <li><b>Wallet withdraw</b> logs reality; the money itself arrives from Meesho settlement / Razorpay / bank. Shadow is your CA-grade ledger, not a payment gateway — no app can legally move that money for you.</li>
          <li><b>GST:</b> Under ₹40 lakh/year turnover (services ₹20L), GST registration generally isn’t mandatory — but suppliers on Meesho demand GST numbers. If you cross ₹40L or sell across states, register (composition scheme fits resellers). Keep all CSVs from Orders → Export as your books.</li>
          <li><b>Income tax:</b> Business income declares under PGBP. With ₹3L+ profit/year, talk to a ₹2,000/year local CA — best ROI you’ll ever get.</li>
        </ul>
      </Section>

      <Section id="reality" icon={<ShieldCheck size={18} className="text-amber-400" />} title="10 · Honest FAQ — what Shadow will and won't do">
        {[
          ['Will Shadow run the store 100% hands-free while I sleep?', 'No — and beware anyone who says yes. What it WILL do: write every word of marketing, publish to 3 platforms, answer WhatsApp DMs 24/7, track every order, and remind you what to do. What it will NEVER do: place the Meesho order for you (no API exists — that’s a 30-second manual step per order), guarantee sales, or handle returns for you.'],
          ['Why did my Meta token “expire”?', 'User tokens live 60–90 days. Regenerate in Graph API Explorer quarterly and paste the new one — takes 2 minutes. Permanent System User tokens never expire but need Business verification for some permissions.'],
          ['My Instagram post failed with “media container error”.', '99% of the time: image URL isn’t publicly reachable (Meesho CDN sometimes blocks hotlinking) or the image is a WebP Meta can’t fetch. Fix: download the image → re-host on your own domain/Imgur → paste that URL. The error message in the queue tells you exactly what Meta said.'],
          ['COD return rate of 30% — how do I fix it?', '(1) Confirm every order on call/WhatsApp before shipping, (2) prepaid discount 5–10%, (3) RTO-intelligence apps are overkill at this stage, (4) sell consumables/home — returns lower than fashion.'],
          ['Is this legal? Is it “fake business”?', 'Completely legal — you’re a reseller, one of lakhs across India. You’re not misleading anyone: price includes your margin, exactly like any shop. Keep GST/tax honest and you’re golden.'],
          ['What if Meta/WhatsApp bans my number?', 'Business-initiated spam gets numbers banned. Rule: only reply within 24h windows, use approved templates for outbound, never blast cold lists. Your personal number doubles as backup — but a dedicated business number is cleaner.'],
          ['Can Shadow handle 1,000 orders a day?', 'The app handles it fine (SQLite on a disk, single user, trivial load). YOU become the bottleneck — at ~15 orders/day start hiring help for packing-confirmation calls, or move to the Meesho supplier model where Meesho absorbs fulfillment.'],
        ].map(([q, a], i) => (
          <details key={i} className="rounded-xl border border-line bg-panel2">
            <summary className="flex items-center justify-between gap-3 px-4 py-3 text-[12px] font-semibold text-zinc-200">{q}<ChevronDown size={15} className="shrink-0 text-zinc-500" /></summary>
            <p className="border-t border-line px-4 py-3 text-[11px] leading-relaxed text-zinc-400">{a}</p>
          </details>
        ))}
      </Section>

      <div className="card flex flex-wrap items-center justify-between gap-4 p-5">
        <div className="flex items-center gap-3">
          <Rocket size={22} className="text-lime-400" />
          <div>
            <p className="text-[13px] font-bold text-white">Ready? Your store is one paste-away.</p>
            <p className="text-[11px] text-zinc-500">Deploy → APP_PASSWORD → AI key → 5 products → first post → first “ORDER” DM.</p>
          </div>
        </div>
        <Ext href="/connectors" big>Start with Connectors →</Ext>
      </div>
    </div>
  );
}

function Section({ id, icon, title, children }: { id: string; icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="card scroll-mt-24 p-5">
      <p className="flex items-center gap-2.5 font-display text-[15px] font-bold text-white">{icon}{title}</p>
      <div className="mt-3 space-y-2 text-[11.5px] leading-relaxed text-zinc-300 [&_code]:rounded [&_code]:bg-black/50 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:text-[10px] [&_code]:text-violet-300 [&_b]:text-zinc-100">
        {children}
      </div>
    </section>
  );
}

function Ext({ href, children, big = false }: { href: string; children: React.ReactNode; big?: boolean }) {
  const cls = big ? 'btn-primary !py-3' : 'font-semibold text-violet-300 underline underline-offset-2 hover:text-violet-200';
  return href.startsWith('/') ? <a href={href} className={cls}>{children}</a> : <a href={href} target="_blank" rel="noreferrer" className={cls}>{children}</a>;
}
