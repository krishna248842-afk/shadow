'use client';
import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Sparkles, Loader2, Copy, Check, Instagram, Facebook, Twitter, MessageCircle, Youtube,
  Target, FileText, Hash, Reply, ChevronDown, Save, Cloud, FlaskConical, Video, Upload,
} from 'lucide-react';
import { generateContentAction, savePost } from '@/lib/actions';
import type { ContentKind } from '@/lib/ai';

const KINDS: Array<{ id: ContentKind; label: string; sub: string; icon: any }> = [
  { id: 'instagram_caption', label: 'Instagram Caption', sub: 'Hook · benefits · price · hashtags', icon: Instagram },
  { id: 'facebook_post', label: 'Facebook Post', sub: 'Family-friendly, comment “ORDER”', icon: Facebook },
  { id: 'x_post', label: 'X Post', sub: '280 chars, punchy', icon: Twitter },
  { id: 'whatsapp_broadcast', label: 'WhatsApp Broadcast', sub: 'Respectful offer message', icon: MessageCircle },
  { id: 'youtube_shorts', label: 'YouTube Shorts Script', sub: '45–60s + title, desc, tags', icon: Youtube },
  { id: 'ad_copy', label: 'Meta Ad Copy', sub: '3 variants: value · trust · urgency', icon: Target },
  { id: 'seo_description', label: 'Catalog Description', sub: 'Marketplace-ready bullets', icon: FileText },
  { id: 'hashtags', label: 'Hashtag Pack', sub: '25 India-focused tags', icon: Hash },
  { id: 'customer_reply', label: 'Customer Reply', sub: 'Paste their message → AI answers', icon: Reply },
];

export default function StudioClient({
  products, preselect, aiReady,
}: {
  products: Array<{ id: number; name: string; sell_price: number; category: string; tags: string }>;
  preselect: number | null;
  aiReady: boolean;
}) {
  const router = useRouter();
  const [productId, setProductId] = useState<number | null>(preselect ?? products[0]?.id ?? null);
  const [kind, setKind] = useState<ContentKind>('instagram_caption');
  const [brief, setBrief] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ text: string; source: string; model?: string } | null>(null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);

  // YouTube uploader state
  const [ytTitle, setYtTitle] = useState('');
  const [ytDesc, setYtDesc] = useState('');
  const [ytTags, setYtTags] = useState('');
  const [ytPrivacy, setYtPrivacy] = useState('unlisted');
  const [ytFile, setYtFile] = useState<File | null>(null);
  const [ytLoading, setYtLoading] = useState(false);
  const [ytResult, setYtResult] = useState<{ ok: boolean; text: string } | null>(null);

  const selected = useMemo(() => products.find((p) => p.id === productId) ?? null, [products, productId]);

  async function generate() {
    setLoading(true); setError(''); setResult(null); setSaved(false);
    const r = await generateContentAction(kind, productId, brief.trim());
    if (r.ok) setResult({ text: r.text, source: r.source, model: r.model });
    else setError(r.error ?? 'Generation failed');
    setLoading(false);
  }

  async function copy() {
    if (!result) return;
    await navigator.clipboard.writeText(result.text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  }

  async function saveToComposer() {
    if (!result) return;
    const form = new FormData();
    form.set('platform', kind.includes('instagram') ? 'instagram' : kind.includes('facebook') ? 'facebook' : kind.includes('x_') ? 'x' : kind.includes('whatsapp') ? 'whatsapp' : 'instagram');
    form.set('content', result.text);
    form.set('product_id', String(productId ?? ''));
    form.set('intent', 'draft');
    form.set('ai_generated', '1');
    const r = await savePost(form);
    if (r.ok) { setSaved(true); setTimeout(() => router.push('/composer'), 700); }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="section-title">AI Studio</p>
          <h1 className="mt-1 font-display text-2xl font-bold text-white sm:text-3xl">Content <span className="gradient-text">Factory</span></h1>
          <p className="mt-1 text-xs text-zinc-500">Pick a product → pick a content type → cloud AI writes it. Hinglish-first, ready to post.</p>
        </div>
        <span className={`badge ${aiReady ? 'badge-lime' : 'badge-amber'}`}>
          {aiReady ? <><Cloud size={12} /> Cloud AI connected</> : <><FlaskConical size={12} /> No AI key — offline templates in use</>}
        </span>
      </div>

      <div className="grid gap-5 xl:grid-cols-5">
        {/* ── Left: generator ─────────────────────────────── */}
        <div className="card p-5 xl:col-span-3">
          <label className="label">1 · Product</label>
          <div className="relative">
            <select value={productId ?? ''} onChange={(e) => setProductId(Number(e.target.value) || null)} className="input appearance-none pr-9">
              {products.length === 0 && <option value="">No products yet — add some in Catalog</option>}
              {products.map((p) => (
                <option key={p.id} value={p.id}>{p.name.slice(0, 64)} — ₹{Math.round(p.sell_price)}</option>
              ))}
            </select>
            <ChevronDown size={15} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          </div>

          <label className="label mt-4">2 · What do you need?</label>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {KINDS.map((k) => {
              const Icon = k.icon;
              const active = kind === k.id;
              return (
                <button
                  key={k.id}
                  onClick={() => setKind(k.id)}
                  className={`rounded-xl border p-2.5 text-left transition-all duration-150 ${
                    active
                      ? 'border-violet-500/60 bg-violet-600/15 ring-2 ring-violet-500/25'
                      : 'border-line bg-panel2 hover:border-zinc-700'
                  }`}
                >
                  <Icon size={16} className={active ? 'text-lime-400' : 'text-zinc-500'} />
                  <p className={`mt-1.5 text-[10.5px] font-bold leading-tight ${active ? 'text-white' : 'text-zinc-300'}`}>{k.label}</p>
                  <p className="mt-0.5 hidden text-[9px] leading-snug text-zinc-600 xl:block">{k.sub}</p>
                </button>
              );
            })}
          </div>

          <label className="label mt-4">3 · Extra brief <span className="normal-case text-zinc-700">(optional — e.g. “festive offer, first 100 orders”, or the customer’s exact message)</span></label>
          <textarea value={brief} onChange={(e) => setBrief(e.target.value)} rows={2} className="input" placeholder="Diwali dhamaka — 20% extra off tonight only…" />

          <button onClick={generate} disabled={loading} className="btn-primary mt-4 w-full !py-3.5 text-sm">
            {loading ? <><Loader2 size={17} className="animate-spin" /> Shadow AI is writing…</> : <><Sparkles size={17} /> Generate with AI</>}
          </button>
          {error && <p className="mt-2 rounded-xl border border-red-900/50 bg-red-950/30 p-3 text-[11px] text-red-300">{error}</p>}

          {result && (
            <div className="card-inner mt-4 p-4">
              <div className="mb-2 flex items-center justify-between gap-2">
                <span className={`badge ${result.source === 'cloud' ? 'badge-lime' : 'badge-amber'}`}>
                  {result.source === 'cloud' ? `Cloud AI${result.model ? ` · ${result.model}` : ''}` : 'Offline template (connect AI for real magic)'}
                </span>
                <div className="flex gap-1.5">
                  <button onClick={copy} className="btn-ghost !px-2.5 !py-1.5 text-[10.5px]">{copied ? <Check size={13} className="text-lime-400" /> : <Copy size={13} />} {copied ? 'Copied' : 'Copy'}</button>
                  <button onClick={saveToComposer} className="btn-ghost !px-2.5 !py-1.5 text-[10.5px] !text-lime-300">{saved ? <Check size={13} /> : <Save size={13} />} {saved ? 'Saved!' : 'To Composer'}</button>
                </div>
              </div>
              <pre className="max-h-96 overflow-auto whitespace-pre-wrap font-body text-[12px] leading-relaxed text-zinc-200">{result.text}</pre>
            </div>
          )}
        </div>

        {/* ── Right: YouTube Shorts uploader ─────────────── */}
        <div className="space-y-4 xl:col-span-2">
          <div className="card p-5">
            <div className="flex items-center gap-2">
              <Youtube size={18} className="text-red-400" />
              <p className="section-title !text-zinc-300">YouTube Shorts — direct upload</p>
            </div>
            <p className="mt-1.5 text-[11px] leading-snug text-zinc-500">Record a 45–60s product video → fill this → it uploads straight to your channel via the YouTube API. Title/description/tags from your AI script work perfectly.</p>
            <form
              className="mt-3 space-y-2.5"
              onSubmit={async (e) => {
                e.preventDefault();
                if (!ytFile) { setYtResult({ ok: false, text: 'Choose a video file first (max 65MB).' }); return; }
                setYtLoading(true); setYtResult(null);
                const fd = new FormData();
                fd.set('video', ytFile);
                fd.set('title', ytTitle || (selected ? selected.name.slice(0, 90) : 'New deal'));
                fd.set('description', ytDesc);
                fd.set('tags', ytTags);
                fd.set('privacy', ytPrivacy);
                const res = await fetch('/api/youtube/upload', { method: 'POST', body: fd });
                const json = await res.json().catch(() => ({}));
                setYtResult(res.ok ? { ok: true, text: `Uploaded! watch → ${json.url}` } : { ok: false, text: json.error ?? `Upload failed (${res.status})` });
                setYtLoading(false);
              }}
            >
              <input value={ytTitle} onChange={(e) => setYtTitle(e.target.value)} placeholder={selected ? selected.name.slice(0, 90) : 'Title (max 100 chars)'} className="input text-[12px]" maxLength={100} />
              <textarea value={ytDesc} onChange={(e) => setYtDesc(e.target.value)} rows={3} placeholder="Description — paste the one from your Shorts script. Include: COD available, free delivery, DM to order." className="input text-[12px]" />
              <input value={ytTags} onChange={(e) => setYtTags(e.target.value)} placeholder="tags, comma, separated" className="input text-[12px]" />
              <div className="flex items-center gap-2">
                <select value={ytPrivacy} onChange={(e) => setYtPrivacy(e.target.value)} className="input !w-32 text-[12px]">
                  <option value="unlisted">Unlisted</option>
                  <option value="public">Public</option>
                  <option value="private">Private</option>
                </select>
                <label className="btn-ghost flex-1 cursor-pointer truncate !py-2 text-[10.5px]">
                  <Video size={13} className="shrink-0" /> {ytFile ? ytFile.name.slice(0, 26) : 'Choose video (.mp4, max 65MB)'}
                  <input type="file" accept="video/*" className="hidden" onChange={(e) => setYtFile(e.target.files?.[0] ?? null)} />
                </label>
              </div>
              <button type="submit" disabled={ytLoading} className="btn-violet w-full !py-2.5 text-xs">
                {ytLoading ? <><Loader2 size={15} className="animate-spin" /> Uploading to YouTube…</> : <><Upload size={15} /> Upload Short</>}
              </button>
              {ytResult && (
                <p className={`rounded-xl border p-2.5 text-[11px] ${ytResult.ok ? 'border-lime-500/30 bg-lime-500/10 text-lime-300' : 'border-red-900/50 bg-red-950/30 text-red-300'}`}>
                  {ytResult.ok ? <a className="underline" href={ytResult.text.split(' → ')[1]} target="_blank" rel="noreferrer">{ytResult.text}</a> : ytResult.text}
                </p>
              )}
            </form>
          </div>

          <div className="card bg-gradient-to-br from-violet-600/10 to-transparent p-5">
            <p className="section-title !text-violet-300/80">Workflow that actually sells</p>
            <ol className="mt-2 space-y-1.5 text-[11px] leading-snug text-zinc-400">
              <li><b className="text-zinc-200">1.</b> Generate a Shorts script → record with your phone</li>
              <li><b className="text-zinc-200">2.</b> Upload here → post publicly with COD call-to-action</li>
              <li><b className="text-zinc-200">3.</b> Blast the same offer on Instagram + WhatsApp (Composer)</li>
              <li><b className="text-zinc-200">4.</b> DM “ORDER” → customer gets Razorpay link or COD</li>
              <li><b className="text-zinc-200">5.</b> Place the order on Meesho app with their address</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}
