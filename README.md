# ⚡ SHADOW — The AI Social-Commerce OS for Meesho Reselling

**Meesho → AI → Instagram · Facebook · WhatsApp · YouTube · X → COD orders → your bank.**

Shadow is a self-hosted, single-user web app that runs your entire reselling operation from one dark, fast dashboard — product sourcing, AI-generated Hinglish marketing, real posting via official APIs, order pipeline, ad management, Razorpay payment links, WhatsApp auto-replies, and a wallet that tells you exactly what to withdraw and when.

> **Honest by design.** Shadow never fakes a result. Every button calls the real API or tells you exactly why it can't. Where Meesho or Meta have no API, Shadow says so and gives you the 30-second manual step.

---

## ✨ What it does

| Module | What you get |
|---|---|
| **Dashboard** | Revenue, orders, wallet balance, ad spend, AI “COO brief” of your business — the whole store at a glance |
| **Catalog** | Meesho products with your margin, CSV bulk import, profit/unit & margin % computed live |
| **AI Studio** | Cloud AI (any OpenAI-compatible provider — OpenAI, DeepSeek, Groq, Gemini, OpenRouter) writes captions, FB posts, X posts, WhatsApp broadcasts, YouTube Shorts scripts, Meta ad variants, SEO descriptions, hashtags, customer replies |
| **Composer** | Post or schedule to Instagram, Facebook, X via official APIs; cron endpoint for 24/7 scheduling; WhatsApp broadcast copy; queue with retry & real error messages |
| **Orders** | Kanban pipeline (New → Confirmed → Ordered on Meesho → Shipped → Delivered), COD & Razorpay prepaid, WhatsApp one-tap contact, auto profit credit on delivery, CSV export |
| **Ads** | AI ad copy → push to Meta Marketing API as PAUSED campaign→adset→creative→ad → sync spend/clicks/CTR back |
| **Wallet** | Profit ledger (auto-credit on delivered), ad-spend tracking, withdrawal logging with your UPI/bank, full money-flow explainer |
| **Connectors** | Paste keys once (server-side only), per-connector **Test** buttons make real API calls, built-in step-by-step key guides |
| **Guide** | A brutally honest 10-section manual: deploy, Meesho mechanics, Meta/WhatsApp/YouTube/X/Razorpay setup, GST & tax reality, COD returns math, FAQ |

**Language:** Hinglish-first (natural Indian marketing voice) — English/Hindi selectable in Settings.

---

## 🚀 Quick start (local, 2 minutes)

```bash
git clone https://github.com/krishna248842-afk/shadow.git
cd shadow
npm install
npm run setup     # creates .env.local + data dir
npm run dev       # http://localhost:3000
```

No seed data, no demo mode — the catalog, wallet and charts read only what you put in.

Open it on your phone on the same WiFi: `http://<your-computer-ip>:3000` → Add to Home Screen.

The store starts **empty** — zero fake products, zero fake numbers. Every figure on the dashboard is computed from what you actually enter. **First 10 minutes:** Catalog → add 3 real Meesho products → Connectors → paste AI key → AI Studio → generate → Composer → post. Done.

---

## ☁️ Deploy to the cloud (your phone, anywhere)

### Render (recommended — the link your phone can open anywhere)
1. Go to **dashboard.render.com → Blueprints → New Blueprint Instance** → connect `krishna248842-afk/shadow` → Render reads [`render.yaml`](render.yaml).
2. Set `APP_PASSWORD` (your store password), `APP_BASE_URL` (URL Render assigns), `WHATSAPP_VERIFY_TOKEN`, `CRON_SECRET`.
3. Deploy → open the URL on your phone → Chrome ⋮ → **Add to Home Screen** → feels like a native app.

> ⚠️ **Disk reality check.** Render’s free plan does **not** allow persistent disks. The blueprint uses the **Starter plan (~$7/mo)** with a 1 GB disk at `/var/data` so your catalog/orders/wallet survive restarts. If you flip the blueprint to `plan: free`, the app still runs but your SQLite database resets on every redeploy — fine to try, useless for a real store.

### Docker (any VPS, Oracle Free Tier, Railway, Fly.io)
```bash
docker build -t shadow .
docker run -p 3000:3000 -v shadow-data:/app/data \
  -e APP_PASSWORD=yourpw -e APP_BASE_URL=https://yourdomain.com shadow
```

### Required env vars (all optional locally)
See [`.env.example`](.env.example). The critical one for public deploys: **`APP_PASSWORD`** — without it your store is open to the internet.

> ⚠️ **Not Vercel.** Shadow uses SQLite on disk. Vercel’s serverless filesystem is ephemeral — your data would vanish. Use Render/VPS/Docker (or wire a persistent DB later).

### 24/7 scheduled posts
Create a free cron at [cron-job.org](https://cron-job.org) → URL: `https://YOUR-URL/api/cron/tick?secret=YOUR_CRON_SECRET` → every 5 minutes. Posts due at any hour go out by themselves. The endpoint **fails closed**: without `CRON_SECRET` set on the server it refuses to run.

---

## 🔌 Connectors — what each key unlocks

| Connector | Get it | Unlocks |
|---|---|---|
| **AI Brain** | DeepSeek / OpenAI / Groq / Gemini / OpenRouter | All AI writing + WhatsApp auto-replies + COO brief |
| **Meta** | developers.facebook.com (Business app) | FB Page posts, IG Business posts, Marketing API campaigns, insights sync |
| **WhatsApp Cloud API** | Same Meta app → WhatsApp product | 24/7 AI auto-replies to customer DMs from your catalog. Set `WHATSAPP_APP_SECRET` and every webhook call is HMAC-verified |
| **YouTube** | Google Cloud → YouTube Data API v3 + OAuth web client | Direct Shorts upload from AI Studio |
| **X** | developer.x.com (free tier) | One-tap posts from Composer |
| **Razorpay** | dashboard.razorpay.com | Payment links per order + webhook auto-marks orders PAID |

Every card in **Connectors** has a “How to get these (free)” walkthrough built in — exact permissions, exact URLs, exact pitfalls.

---

## 🧾 The Meesho truth (read before you spend)

- Meesho has **no public reseller API**. Shadow is honest about it: you source products (Catalog), Shadow markets & sells (AI + socials + WhatsApp), you confirm by call (Orders → Confirm), you place the final order on the Meesho app with the customer’s address (~30 seconds), Meesho ships and settles to you. Shadow tracks profit from “Delivered” onward and logs your withdrawals.
- COD returns are the silent killer of Indian reselling (20–40% in fashion). Shadow forces confirmation discipline and only credits profit on delivery — your wallet never lies.
- Meesho **supplier** model (GST + listing your own products) is covered in **Guide → Section 2**.

Shadow replaces the $200/mo “AI marketing agency + CRM + scheduler + ledger” stack — not your decisions.

---

## 🛠 Tech & architecture

- **Next.js 15 (App Router) + TypeScript + Tailwind** — server components, server actions
- **SQLite (sql.js / WASM)** persisted to disk at `DATABASE_PATH` (default `./data/shadow.db`) — zero native builds, runs anywhere Node runs, atomic tmp+rename writes
- **Official APIs only** — Graph API, WhatsApp Cloud API, YouTube Data API v3 (OAuth2 refresh token), X API v2 (OAuth 1.0a HMAC-SHA1), Razorpay (Basic auth + HMAC webhook)
- **No middleman servers** — your keys stay in your database/env, requests go straight from your server to Meta/Google/Razorpay
- Middleware password gate (`APP_PASSWORD`) protects every route when deployed

```
src/
  app/            dashboard, products, studio, composer, orders, ads, wallet, connectors, guide, settings
  app/api/        whatsapp webhook, razorpay webhook, cron tick, YouTube OAuth + upload, CSV export, auth
  components/     client UI (sidebar, composer, studio, charts, forms)
  lib/            db.ts (SQLite), ai.ts (OpenAI-compatible + offline Hinglish fallback),
                  publisher.ts (post now/scheduled), integrations/ (meta, whatsapp, x, youtube, razorpay)
```

**CI:** GitHub Actions runs typecheck + production build on every push (`.github/workflows/ci.yml`).

---

## 🔒 Security

- Secrets live server-side in SQLite/env; the UI only ever sees masked values (`•••• saved`)
- WhatsApp & Razorpay webhooks verify handshakes/signatures; cron endpoint requires `CRON_SECRET`
- HTTP-only session cookie behind `APP_PASSWORD`; set a strong one before going public
- `data/` is gitignored — your store database never reaches GitHub

## ⚖️ Legal & tax

You’re a reseller — legal and normal. Keep honest records (Orders → Export CSV), register GST beyond the turnover threshold (Section 9 of the in-app Guide), declare income. Shadow is a tool, not tax/legal advice.

## License

MIT — yours to run, fork and sell from.
