# 🖥️ SHADOW — Run it yourself from the terminal

Everything you need, top to bottom. If you can copy‑paste, you can run this.

Repo: https://github.com/krishna248842-afk/shadow (public)

---

## 0. What you need installed

| Tool | Check | Install |
|---|---|---|
| Node.js **v22** | `node -v` → must say v22.x | Windows: `winget install OpenJS.NodeJS.LTS` · macOS: `brew install node@22` · Linux: https://github.com/nvm-sh/nvm → `nvm install 22` |
| Git (optional — ZIP works too) | `git --version` | Windows: `winget install Git.Git` · macOS: `xcode-select --install` · Linux: `sudo apt install git` |
| A browser | — | Chrome / Edge / any |

That's it. No database to install, no accounts required to start.

---

## 1. Get the code (pick ONE)

**A) With git (recommended):**
```bash
git clone https://github.com/krishna248842-afk/shadow.git
cd shadow
```

**B) Without git:** download `shadow-source.zip` from this chat → unzip → right‑click the unzipped `shadow` folder → "Open in Terminal" (or `cd path/to/shadow`).

---

## 2. Install & run (first time only)

```bash
npm install        # downloads dependencies — needs internet, ~1–3 min
npm run setup      # creates data/ folder + .env.local
npm run dev        # starts the app
```

Open your browser → **http://localhost:3000**

You should see the Shadow dashboard (Mission Control) with ₹0 / 0 orders — the store starts **empty**, nothing is faked.

> Dev mode reloads automatically when files change. For daily use you can stop it (Ctrl+C) and run in production mode instead (step 3).

---

## 3. Run in production mode (faster, better for your phone)

```bash
npm run build      # one-time optimized build
npm start          # serves http://localhost:3000
```

Keep that terminal open. To stop: `Ctrl + C`.

---

## 4. Open it on your PHONE (same WiFi)

1. Find your computer's local IP:
   - Windows: `ipconfig` → look for "IPv4 Address" (e.g. 192.168.1.23)
   - macOS: `ipconfig getifaddr en0`
   - Linux: `hostname -I`
2. Phone browser → `http://192.168.1.23:3000` (use YOUR ip)
3. Chrome ⋮ → **Add to Home Screen** → Shadow sits on your phone like an app icon.

> Your computer must stay on and running `npm start` / `npm run dev` for this link to work. For a 24/7 link, see step 7.

---

## 5. Make it YOUR business (10 minutes, in the app)

1. **Settings** → business name, phone, city, UPI ID, content language (Hinglish default)
2. **Connectors** → paste your AI key (DeepSeek `https://api.deepseek.com/v1`, model `deepseek-chat` — cheapest; or OpenAI) → hit **Test** — it makes a real API call and tells you if it works
3. **Catalog** → Add your 3–5 real Meesho products (name, cost price, your selling price, MRP, tags, Meesho URL, image URL)
4. **AI Studio** → pick a product → generate caption/ad/WhatsApp broadcast → **Composer** → post (or copy)

Social posting (needs free API keys — full walkthrough inside the app at **/guide**):
Meta (FB+IG), WhatsApp Cloud API, YouTube, X, Razorpay payment links.

---

## 6. Everyday use

- Orders come in from IG/WP/calls → **Orders → New order** (or AI captured via WhatsApp webhook)
- Confirm COD with a 20-second call → **Advance** (New → Confirmed → Ordered on Meesho → Shipped → Delivered)
- On **Delivered** the profit auto-credits to your **Wallet**
- **Wallet** shows pending balance → place the order on the Meesho app (30 sec) → withdraw your earnings on Meesho; Shadow records your withdrawal log
- **Ads** page can push campaigns to Meta as PAUSED (nothing spends until you confirm in Ads Manager)

---

## 7. 24/7 public URL (access from anywhere, computer off)

**Render** (simplest): https://dashboard.render.com → Blueprints → New Blueprint Instance → connect `krishna248842-afk/shadow` → set `APP_PASSWORD`, `APP_BASE_URL`, `WHATSAPP_VERIFY_TOKEN`, `CRON_SECRET` → Deploy → open on phone.

**Alternative — any Docker host:**
```bash
docker build -t shadow .
docker run -d -p 3000:3000 -v shadow-data:/app/data \
  -e APP_PASSWORD=yourpassword -e APP_BASE_URL=https://yourdomain.com shadow
```

> Free plan warning: Render free wipes the database on restart. Use the Starter plan (~$7/mo) or a small VPS for a real store.

---

## 8. Backup / reset

- **Backup your store:** copy `data/shadow.db` somewhere safe. That's your entire business (products, orders, wallet).
- **Start completely over:** delete `data/shadow.db` (app recreates an empty store on next start).
- **Forgot your password:** it's `APP_PASSWORD` in `.env.local` — edit the file, restart.

---

## 9. Troubleshooting

| Problem | Fix |
|---|---|
| `node -v` not v22 | Install Node 22 (see section 0), then retry |
| `npm` not found | Node install didn't finish / restart terminal |
| Port 3000 already in use | `npm start -- -p 3100` → open localhost:3100 · or close the other app using 3000 |
| Blank page on phone | Use the same WiFi + your computer's IP (not localhost) · allow Node through firewall |
| "Too many requests" / install errors | Delete `node_modules` and `package-lock.json`? **No** — just run `npm install` again; check your internet |
| AI buttons say "offline draft" / "provider error" | Add/check your AI key in Connectors → Test |
| Posting fails | Connectors → that platform's **Test** → read the exact error it prints |
