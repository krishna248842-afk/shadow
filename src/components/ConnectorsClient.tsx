'use client';
import { useState } from 'react';
import {
  Bot, Facebook, MessageCircle, Youtube, Twitter, CreditCard, Loader2, CheckCircle2,
  CircleAlert, Plug, ChevronDown, ExternalLink, Copy, Check, Trash2, Zap,
} from 'lucide-react';
import { saveSettings, testConnector, clearSecret } from '@/lib/actions';
import type { SettingKey } from '@/lib/settings';

const AI_PRESETS: Array<{ name: string; base: string; model: string }> = [
  { name: 'OpenAI', base: 'https://api.openai.com/v1', model: 'gpt-4o-mini' },
  { name: 'DeepSeek (cheap, Hinglish strong)', base: 'https://api.deepseek.com/v1', model: 'deepseek-chat' },
  { name: 'Google Gemini (OpenAI-compat)', base: 'https://generativelanguage.googleapis.com/v1beta/openai', model: 'gemini-2.0-flash' },
  { name: 'Groq (fast, free tier)', base: 'https://api.groq.com/openai/v1', model: 'llama-3.3-70b-versatile' },
  { name: 'OpenRouter (any model)', base: 'https://openrouter.ai/api/v1', model: 'deepseek/deepseek-chat' },
];

export default function ConnectorsClient(props: {
  settings: Record<SettingKey, string>;
  youtubeCallback: string;
  waWebhook: string;
  rzpWebhook: string;
  waVerifyToken: string;
  ytChannel: string;
  ytStatus: string;
  ytError: string;
}) {
  const { settings: s } = props;
  return (
    <div className="space-y-5">
      <div>
        <p className="section-title">Connectors</p>
        <h1 className="mt-1 font-display text-2xl font-bold text-white sm:text-3xl">Plug in your <span className="gradient-text">Empire</span></h1>
        <p className="mt-1 text-xs text-zinc-500">Paste keys once → saved securely on your server → Test buttons make real API calls. Secrets never reach the browser.</p>
      </div>

      {props.ytStatus === 'ok' && <Banner ok text="YouTube connected! Your channel is linked — upload from AI Studio." />}
      {props.ytStatus === 'missing' && <Banner text="Save your YouTube Client ID & Secret first, then click Connect YouTube." />}
      {props.ytStatus === 'error' && <Banner text={`YouTube error: ${props.ytError || 'unknown'}`} />}
      {props.ytStatus === 'state-mismatch' && <Banner text="YouTube OAuth state mismatch — try connecting again." />}
      {props.ytChannel && props.ytStatus !== 'ok' && <Banner ok text={`YouTube linked: ${props.ytChannel}`} />}

      <div className="grid gap-4 xl:grid-cols-2">
        {/* ── AI brain ── */}
        <ConnectorCard icon={<Bot size={17} className="text-violet-300" />} title="AI Brain — cloud marketing genius" status={!!s.ai_api_key} saveKeys={['ai_base_url', 'ai_api_key', 'ai_model']}
          desc="Powers captions, ads, Shorts scripts, COO brief & WhatsApp auto-replies. Any OpenAI-compatible provider."
          testKind="ai" guide={<AiGuide />}>
          <AiForm base={s.ai_base_url} model={s.ai_model} keyMasked={s.ai_api_key} />
        </ConnectorCard>

        {/* ── Meta ── */}
        <ConnectorCard icon={<Facebook size={17} className="text-sky-400" />} title="Meta — Facebook Page + Instagram + Ads" status={!!s.meta_access_token} saveKeys={['meta_access_token', 'meta_page_id', 'meta_ig_user_id', 'meta_ad_account_id']}
          desc="One token rules: post to FB Page & IG Business, run Marketing API campaigns, read insights."
          testKind="meta" extraTest={{ kind: 'instagram', label: 'Test Instagram' }} guide={<MetaGuide />}>
          <Field name="meta_access_token" label="Long-lived Page access token" masked={s.meta_access_token} placeholder="EAAG…" secret />
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
            <Field name="meta_page_id" label="FB Page ID" masked={s.meta_page_id} placeholder="1234567890" />
            <Field name="meta_ig_user_id" label="IG Business User ID" masked={s.meta_ig_user_id} placeholder="17841…" />
            <Field name="meta_ad_account_id" label="Ad Account ID" masked={s.meta_ad_account_id} placeholder="act_123…" />
          </div>
        </ConnectorCard>

        {/* ── WhatsApp ── */}
        <ConnectorCard icon={<MessageCircle size={17} className="text-emerald-400" />} title="WhatsApp Cloud API" status={!!s.whatsapp_access_token} saveKeys={['whatsapp_access_token', 'whatsapp_phone_number_id']}
          desc="AI auto-replies to every customer DM from your catalog — 24/7, with prices, delivery & COD info."
          testKind="whatsapp" guide={<WhatsAppGuide waWebhook={props.waWebhook} verifyToken={props.waVerifyToken} />}>
          <Field name="whatsapp_access_token" label="Permanent access token (System User)" masked={s.whatsapp_access_token} placeholder="EAAG…" secret />
          <Field name="whatsapp_phone_number_id" label="Phone Number ID" masked={s.whatsapp_phone_number_id} placeholder="123456789012345" />
          <CopyBox label="Webhook URL (paste in Meta → WhatsApp → Configuration)" value={props.waWebhook} />
          <CopyBox label="Webhook verify token" value={props.waVerifyToken} />
        </ConnectorCard>

        {/* ── YouTube ── */}
        <ConnectorCard icon={<Youtube size={17} className="text-red-400" />} title="YouTube — Shorts direct upload" status={!!s.youtube_refresh_token} saveKeys={['youtube_client_id', 'youtube_client_secret']}
          desc="Upload Shorts straight from AI Studio. Google shows your channel name as proof."
          testKind="youtube" guide={<YouTubeGuide callback={props.youtubeCallback} />}
          customActions={<YoutubeActions connected={!!s.youtube_refresh_token} channel={props.ytChannel} />}>
          <Field name="youtube_client_id" label="OAuth Client ID (Google Cloud)" masked={s.youtube_client_id} placeholder="1234…apps.googleusercontent.com" />
          <Field name="youtube_client_secret" label="OAuth Client Secret" masked={s.youtube_client_secret} placeholder="GOCSPX-…" secret />
          <CopyBox label="Authorized redirect URI (Google Cloud → Credentials → your Web client)" value={props.youtubeCallback} />
        </ConnectorCard>

        {/* ── X ── */}
        <ConnectorCard icon={<Twitter size={17} className="text-zinc-200" />} title="X (Twitter) — posts & launches" status={!!s.x_api_key} saveKeys={['x_api_key', 'x_api_secret', 'x_access_token', 'x_access_secret']}
          desc="Posts product launches & deals to X with one tap from the Composer."
          testKind="x" guide={<XGuide />}>
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            <Field name="x_api_key" label="API Key (consumer)" masked={s.x_api_key} placeholder="…" secret />
            <Field name="x_api_secret" label="API Key Secret" masked={s.x_api_secret} placeholder="…" secret />
            <Field name="x_access_token" label="Access Token" masked={s.x_access_token} placeholder="…-…" secret />
            <Field name="x_access_secret" label="Access Token Secret" masked={s.x_access_secret} placeholder="…" secret />
          </div>
        </ConnectorCard>

        {/* ── Razorpay ── */}
        <ConnectorCard icon={<CreditCard size={17} className="text-sky-300" />} title="Razorpay — instant payment links" status={!!s.razorpay_key_id} saveKeys={['razorpay_key_id', 'razorpay_key_secret']}
          desc="Turn any order into a ₹ payment link (SMS+WhatsApp auto-notify Razorpay side). COD or prepaid — your call."
          testKind="razorpay" guide={<RazorpayGuide rzpWebhook={props.rzpWebhook} />}>
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            <Field name="razorpay_key_id" label="Key ID" masked={s.razorpay_key_id} placeholder="rzp_live_… / rzp_test_…" />
            <Field name="razorpay_key_secret" label="Key Secret" masked={s.razorpay_key_secret} placeholder="…" secret />
          </div>
          <CopyBox label="Webhook URL (Razorpay Dashboard → Webhooks → active events: payment_link.paid)" value={props.rzpWebhook} />
        </ConnectorCard>
      </div>

      <p className="flex items-center justify-center gap-2 text-center text-[10.5px] text-zinc-600"><Zap size={12} className="text-lime-500" /> Keys live only in your server’s database/env — never sent to the browser, never committed to GitHub.</p>
    </div>
  );
}

/* ───────────────────────── building blocks ───────────────────────── */

function Banner({ text, ok = false }: { text: string; ok?: boolean }) {
  return (
    <p className={`flex items-start gap-2 rounded-2xl border p-3 text-[11.5px] ${ok ? 'border-lime-500/30 bg-lime-500/10 text-lime-300' : 'border-amber-500/25 bg-amber-500/[0.07] text-amber-200/90'}`}>
      {ok ? <CheckCircle2 size={15} className="mt-0.5 shrink-0" /> : <CircleAlert size={15} className="mt-0.5 shrink-0" />}{text}
    </p>
  );
}

function CopyBox({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div>
      <label className="label !text-[9.5px]">{label}</label>
      <div className="flex items-center gap-1.5">
        <code className="min-w-0 flex-1 truncate rounded-lg border border-line bg-ink px-2.5 py-2 text-[9.5px] text-violet-300">{value}</code>
        <button type="button" onClick={async () => { await navigator.clipboard.writeText(value); setCopied(true); setTimeout(() => setCopied(false), 1500); }} className="btn-ghost !px-2 !py-2">
          {copied ? <Check size={12} className="text-lime-400" /> : <Copy size={12} />}
        </button>
      </div>
    </div>
  );
}

function Field({ name, label, masked, placeholder, secret = false }: { name: string; label: string; masked: string; placeholder: string; secret?: boolean }) {
  return (
    <div>
      <label className="label" htmlFor={name}>{label}</label>
      <input id={name} name={name} type={secret ? 'password' : 'text'} autoComplete="off" spellCheck={false} className="input font-mono text-[11px]" placeholder={masked ? '•••• saved — paste new value to replace' : placeholder} />
    </div>
  );
}

function ConnectorCard({ icon, title, desc, status, saveKeys, children, testKind, extraTest, guide, customActions }: {
  icon: React.ReactNode; title: string; desc: string; status: boolean; saveKeys: SettingKey[]; children: React.ReactNode;
  testKind: string; extraTest?: { kind: string; label: string }; guide: React.ReactNode; customActions?: React.ReactNode;
}) {
  return (
    <div className="card flex flex-col p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="grid h-9 w-9 place-items-center rounded-xl border border-line bg-panel2">{icon}</span>
          <div>
            <p className="text-[12.5px] font-bold leading-tight text-zinc-100">{title}</p>
            <p className="mt-0.5 max-w-[320px] text-[9.5px] leading-snug text-zinc-500">{desc}</p>
          </div>
        </div>
        <span className={status ? 'badge-lime !text-[9px]' : 'badge-zinc !text-[9px]'}>{status ? <><CheckCircle2 size={10} /> CONNECTED</> : 'NOT SET'}</span>
      </div>

      <form action={async (fd) => { await saveSettings(fd); }} className="mt-3 flex flex-col gap-2.5">
        {/* hidden marker so saveSettings knows this card submitted — unused */}
        {children}
        <div className="mt-1 flex flex-wrap items-center gap-2">
          <button type="submit" className="btn-ghost !py-2 text-[11px] !text-lime-300 !border-lime-500/30"><Plug size={13} /> Save keys</button>
          <TestButton kind={testKind} label="Test connection" />
          {extraTest && <TestButton kind={extraTest.kind} label={extraTest.label} />}
          {customActions}
        </div>
      </form>

      <details className="mt-3 rounded-xl border border-line bg-panel2">
        <summary className="flex items-center justify-between gap-2 px-3.5 py-2.5 text-[10.5px] font-bold uppercase tracking-[0.16em] text-violet-300/80">
          How to get these (free) <ChevronDown size={13} />
        </summary>
        <div className="border-t border-line px-3.5 py-3 text-[10.5px] leading-relaxed text-zinc-400">{guide}</div>
      </details>
    </div>
  );
}

function TestButton({ kind, label }: { kind: string; label: string }) {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  return (
    <span className="inline-flex flex-col gap-1">
      <button
        type="button"
        disabled={busy}
        className="btn-ghost !py-2 text-[11px]"
        onClick={async () => {
          setBusy(true); setMsg(null);
          const r = await testConnector(kind);
          setMsg(r.ok ? { ok: true, text: r.message ?? 'Connected!' } : { ok: false, text: r.error ?? 'Failed' });
          setBusy(false);
        }}
      >
        {busy ? <Loader2 size={13} className="animate-spin" /> : <Zap size={13} className="text-amber-400" />} {label}
      </button>
      {msg && <span className={`max-w-[260px] text-[9.5px] leading-snug ${msg.ok ? 'text-lime-400' : 'text-red-400'}`}>{msg.text}</span>}
    </span>
  );
}

function YoutubeActions({ connected, channel }: { connected: boolean; channel: string }) {
  return (
    <>
      {!connected ? (
        <a href="/api/youtube/auth" className="btn-violet !py-2 text-[11px]"><Youtube size={13} /> Connect YouTube</a>
      ) : (
        <span className="flex items-center gap-1.5">
          <span className="max-w-[140px] truncate text-[9.5px] font-semibold text-red-300" title={channel}>{channel || 'Linked'}</span>
          <ClearSecretButton k="youtube_refresh_token" label="Unlink" />
        </span>
      )}
    </>
  );
}

function ClearSecretButton({ k, label }: { k: SettingKey; label: string }) {
  const [busy, setBusy] = useState(false);
  return (
    <button
      type="button"
      disabled={busy}
      className="btn-ghost !px-2 !py-1.5 text-[9.5px] !text-red-400"
      onClick={async () => { if (!confirm('Unlink? You can reconnect anytime.')) return; setBusy(true); await clearSecret(k); setBusy(false); }}
    >
      {busy ? <Loader2 size={10} className="animate-spin" /> : <Trash2 size={10} />} {label}
    </button>
  );
}

function AiForm({ base, model, keyMasked }: { base: string; model: string; keyMasked: string }) {
  const [b, setB] = useState(base && !base.includes('undefined') ? base : 'https://api.openai.com/v1');
  const [m, setM] = useState(model || 'gpt-4o-mini');
  return (
    <>
      <div>
        <label className="label">Provider preset</label>
        <select
          className="input text-[11px]"
          defaultValue=""
          onChange={(e) => {
            const p = AI_PRESETS.find((x) => x.name === e.target.value);
            if (p) { setB(p.base); setM(p.model); }
          }}
        >
          <option value="">— choose to auto-fill (or type your own below) —</option>
          {AI_PRESETS.map((p) => <option key={p.name} value={p.name}>{p.name}</option>)}
        </select>
      </div>
      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-5">
        <div className="sm:col-span-3">
          <label className="label" htmlFor="ai_base_url">Base URL</label>
          <input id="ai_base_url" name="ai_base_url" value={b} onChange={(e) => setB(e.target.value)} className="input font-mono text-[10.5px]" placeholder="https://api.openai.com/v1" />
        </div>
        <div className="sm:col-span-2">
          <label className="label" htmlFor="ai_model">Model</label>
          <input id="ai_model" name="ai_model" value={m} onChange={(e) => setM(e.target.value)} className="input font-mono text-[10.5px]" placeholder="gpt-4o-mini" />
        </div>
      </div>
      <Field name="ai_api_key" label="API key" masked={keyMasked} placeholder="sk-…" secret />
    </>
  );
}

/* ───────────────────────── guides (plain JSX, no deps) ───────────────────────── */
const G = {
  ol: ({ children }: any) => <ol className="list-decimal space-y-1.5 pl-4 [&_b]:text-zinc-200 [&_code]:rounded [&_code]:bg-black/50 [&_code]:px-1 [&_code]:text-violet-300">{children}</ol>,
  a: ({ href, children }: any) => <a href={href} target="_blank" rel="noreferrer" className="inline-flex items-center gap-0.5 text-violet-300 underline underline-offset-2 hover:text-violet-200">{children}<ExternalLink size={9} /></a>,
};

const AiGuide = () => (
  <G.ol>
    <li>Sign up at <G.a href="https://platform.deepseek.com">DeepSeek</G.a> (cheapest, great Hinglish) or <G.a href="https://platform.openai.com">OpenAI</G.a> / <G.a href="https://console.groq.com">Groq (free tier)</G.a> / <G.a href="https://aistudio.google.com/apikey">Google AI Studio</G.a>.</li>
    <li>Create an API key. For DeepSeek: <b>Top up ₹500</b> is plenty for months of captions.</li>
    <li>Pick the matching preset above, paste the key, <b>Save keys</b>, then <b>Test connection</b> — you should see the model ping back.</li>
    <li>No key? Everything still works with offline templates — but cloud AI writes noticeably better ads.</li>
  </G.ol>
);

const MetaGuide = () => (
  <G.ol>
    <li>Go to <G.a href="https://developers.facebook.com/apps/create/?type=business">Meta for Developers → Create App → Business</G.a>.</li>
    <li>Add products: <b>Facebook Login</b> (skip), <b>Instagram Graph API</b> and <b>Marketing API</b>.</li>
    <li>Your IG must be a <b>Business/Creator account</b> linked to a <b>Facebook Page</b> (IG app → Settings → Account type).</li>
    <li>Open <G.a href="https://developers.facebook.com/tools/explorer">Graph API Explorer</G.a>, select your app, add permissions: <code>pages_manage_posts</code>, <code>pages_read_engagement</code>, <code>instagram_basic</code>, <code>instagram_content_publish</code>, <code>ads_management</code>, <code>ads_read</code> → <b>Generate Access Token</b>.</li>
    <li>Extend it to 60 days: <code>GET /oauth/access_token?grant_type=fb_exchange_token&amp;client_id=APP_ID&amp;client_secret=APP_SECRET&amp;fb_exchange_token=TOKEN</code> (in browser/Explorer), then use the long-lived token.</li>
    <li><b>Page ID:</b> Page → About → Page transparency → Page ID. <b>IG User ID:</b> <code>GET /me/accounts</code> then <code>GET /{'{page-id}'}?fields=instagram_business_account</code>. <b>Ad Account ID:</b> <G.a href="https://business.facebook.com/settings/ad-accounts">Business Settings → Ad Accounts</G.a> — copy the <code>act_…</code> number.</li>
    <li><b>Ads:</b> Marketing API works with your own ad account — no app review needed for your OWN ads. All campaigns land PAUSED for your approval.</li>
  </G.ol>
);

const WhatsAppGuide = (p: { waWebhook: string; verifyToken: string }) => (
  <G.ol>
    <li>Same Meta app → <b>Add product → WhatsApp → Set up</b>. You get a free test number instantly.</li>
    <li>WhatsApp → <b>API Setup</b>: copy <b>Temporary access token</b> (24h) for testing, or create a <b>System User</b> (Business Settings → Users → System users → Generate token with <code>whatsapp_business_messaging</code>) for a permanent one.</li>
    <li>Copy the <b>Phone Number ID</b> (not the phone number itself).</li>
    <li><b>Webhook:</b> WhatsApp → Configuration → Edit → Callback URL = <code>{p.waWebhook}</code> · Verify token = <code>{p.verifyToken}</code> → Verify & Save.</li>
    <li>Subscribe to the <code>messages</code> field. Now every DM to your number gets an AI Hinglish reply from your catalog — prices, COD, delivery, address capture.</li>
    <li><b>Reality:</b> customers must message you first (click-to-WhatsApp ads work great for this). Business-initiated promos need approved utility templates — for those, send manually from the app or use the broadcast copy from AI Studio.</li>
  </G.ol>
);

const YouTubeGuide = (p: { callback: string }) => (
  <G.ol>
    <li><G.a href="https://console.cloud.google.com">Google Cloud Console</G.a> → New project “Shadow”.</li>
    <li><b>APIs & Services → Library</b> → enable <b>YouTube Data API v3</b>.</li>
    <li><b>OAuth consent screen</b> → External → fill app name + your email → add scopes <code>youtube.upload</code> &amp; <code>youtube.readonly</code> → add yourself as a test user (or publish the app).</li>
    <li><b>Credentials → Create Credentials → OAuth client ID → Web application</b>. Authorized redirect URI: <code>{p.callback}</code> — exactly.</li>
    <li>Paste Client ID + Secret above → <b>Save keys</b> → <b>Connect YouTube</b> → Google consent → back here connected.</li>
    <li>Uploads start as <b>Unlisted</b> by default so you can review before going public.</li>
  </G.ol>
);

const XGuide = () => (
  <G.ol>
    <li><G.a href="https://developer.x.com">developer.x.com</G.a> → sign up (free tier works: 500 posts/month).</li>
    <li>Create a <b>Project</b> and an <b>App</b> inside it.</li>
    <li>App → <b>Settings</b> → User authentication: enable <b>Read and write</b>, type = Web App.</li>
    <li><b>Keys and tokens</b> tab: generate <b>API Key &amp; Secret</b> and <b>Access Token &amp; Secret</b> (these are OAuth 1.0a — perfect for posting).</li>
    <li>Paste all 4 above → <b>Save keys</b> → <b>Test connection</b> shows your @handle.</li>
    <li>Free tier caps ~500 posts/month — plenty for launches &amp; daily deal posts.</li>
  </G.ol>
);

const RazorpayGuide = (p: { rzpWebhook: string }) => (
  <G.ol>
    <li><G.a href="https://dashboard.razorpay.com">dashboard.razorpay.com</G.a> → sign up + complete KYC (PAN, bank, GST if applicable). Test mode works instantly.</li>
    <li><b>Settings → API Keys → Generate Key</b> → Key ID + Secret (secret shown once — paste it now).</li>
    <li>Use <code>rzp_test_</code> keys to rehearse the whole flow free; switch to live after KYC.</li>
    <li><b>Webhook:</b> <G.a href="https://dashboard.razorpay.com/app/webhooks">Webhooks → Add</G.a> → URL <code>{p.rzpWebhook}</code> → secret = any random string → events: <code>payment_link.paid</code> → set the same string as <code>RAZORPAY_WEBHOOK_SECRET</code> env var.</li>
    <li>Every order gets a <b>payment link</b> from the Orders board — SMS/WhatsApp notify on Razorpay’s side. COD remains available — set payment mode per order.</li>
  </G.ol>
);
