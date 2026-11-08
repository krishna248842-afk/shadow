'use client';
import { useMemo, useState } from 'react';
import {
  Send, Sparkles, Loader2, Instagram, Facebook, Twitter, MessageCircle, Clock, Save, Trash2,
  CalendarClock, CircleCheck, CircleAlert, Copy, Check, ExternalLink, Timer,
} from 'lucide-react';
import { savePost, publishPostNow, deletePost, generateContentAction } from '@/lib/actions';

const PLATFORMS = [
  { id: 'instagram', label: 'Instagram', icon: Instagram, kind: 'instagram_caption' as const },
  { id: 'facebook', label: 'Facebook', icon: Facebook, kind: 'facebook_post' as const },
  { id: 'x', label: 'X (Twitter)', icon: Twitter, kind: 'x_post' as const },
  { id: 'whatsapp', label: 'WhatsApp', icon: MessageCircle, kind: 'whatsapp_broadcast' as const },
] as const;

export default function ComposerClient({
  products, posts, preselect, ready, cronUrl,
}: {
  products: Array<{ id: number; name: string; sell_price: number; image_url: string; meesho_url: string }>;
  posts: Array<{ id: number; platform: string; content: string; media_url: string; status: string; scheduled_at: string | null; published_at: string | null; error: string | null; product_name: string | null; ai_generated: number }>;
  preselect: number | null;
  ready: { instagram: boolean; facebook: boolean; x: boolean };
  cronUrl: string;
}) {
  const [platform, setPlatform] = useState<'instagram' | 'facebook' | 'x' | 'whatsapp'>('instagram');
  const [productId, setProductId] = useState<number | null>(preselect ?? products[0]?.id ?? null);
  const [content, setContent] = useState('');
  const [mediaUrl, setMediaUrl] = useState('');
  const [intent, setIntent] = useState<'now' | 'scheduled' | 'draft'>('now');
  const [scheduledAt, setScheduledAt] = useState('');
  const [aiBusy, setAiBusy] = useState(false);
  const [busy, setBusy] = useState(false);
  const [flash, setFlash] = useState<{ ok: boolean; text: string } | null>(null);
  const [copiedCron, setCopiedCron] = useState(false);

  const product = useMemo(() => products.find((p) => p.id === productId) ?? null, [products, productId]);
  const effectiveMedia = mediaUrl || product?.image_url || '';
  const connected = platform === 'whatsapp' ? true : ready[platform];

  async function aiWrite() {
    setAiBusy(true);
    const kind = PLATFORMS.find((p) => p.id === platform)!.kind;
    const r = await generateContentAction(kind, productId, '');
    if (r.ok) setContent(r.text);
    setAiBusy(false);
  }

  async function submit(formData: FormData) {
    setBusy(true); setFlash(null);
    formData.set('platform', platform);
    formData.set('product_id', String(productId ?? ''));
    formData.set('media_url', effectiveMedia);
    formData.set('intent', intent);
    if (intent === 'scheduled' && scheduledAt) formData.set('scheduled_at', scheduledAt);
    const r = await savePost(formData);
    if (r.ok) {
      if (intent === 'now') {
        setFlash(r.published ? { ok: true, text: `Posted live! External ID: ${r.externalId ?? 'ok'}` } : { ok: false, text: r.error ?? 'Post saved but publish failed — see queue below.' });
      } else if (intent === 'scheduled') {
        setFlash({ ok: true, text: 'Scheduled. It will auto-publish when its time comes (cron or dashboard visit).' });
      } else {
        setFlash({ ok: true, text: 'Saved to drafts.' });
      }
      if (r.ok) setContent('');
    } else {
      setFlash({ ok: false, text: r.error ?? 'Something went wrong' });
    }
    setBusy(false);
  }

  const queued = posts.filter((p) => p.status === 'scheduled');
  const drafts = posts.filter((p) => p.status === 'draft');
  const history = posts.filter((p) => p.status === 'published' || p.status === 'failed');

  return (
    <div className="space-y-5">
      <div>
        <p className="section-title">Composer</p>
        <h1 className="mt-1 font-display text-2xl font-bold text-white sm:text-3xl">One tap → <span className="gradient-text">every platform</span></h1>
        <p className="mt-1 text-xs text-zinc-500">Write once (or let AI write), post or schedule to Instagram, Facebook, X — WhatsApp copy below.</p>
      </div>

      <div className="grid gap-5 xl:grid-cols-5">
        {/* ── Compose card ─────────────────────────────── */}
        <form action={submit} className="card p-5 xl:col-span-3">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {PLATFORMS.map((p) => {
              const Icon = p.icon;
              const active = platform === p.id;
              const okFlag = p.id === 'whatsapp' ? true : ready[p.id as 'instagram'];
              return (
                <button type="button" key={p.id} onClick={() => setPlatform(p.id as any)}
                  className={`relative rounded-xl border p-3 text-center transition ${active ? 'border-violet-500/60 bg-violet-600/15 ring-2 ring-violet-500/25' : 'border-line bg-panel2 hover:border-zinc-700'}`}>
                  <Icon size={18} className={`mx-auto ${active ? 'text-lime-400' : 'text-zinc-500'}`} />
                  <span className="mt-1 block text-[11px] font-bold text-zinc-200">{p.label}</span>
                  <span className={`mt-1 inline-block h-1.5 w-1.5 rounded-full ${okFlag ? 'bg-lime-400' : 'bg-zinc-700'}`} title={okFlag ? 'Connected' : 'Not connected'} />
                </button>
              );
            })}
          </div>

          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <div>
              <label className="label">Product</label>
              <select value={productId ?? ''} onChange={(e) => setProductId(Number(e.target.value) || null)} className="input">
                <option value="">— No product / general post —</option>
                {products.map((p) => <option key={p.id} value={p.id}>{p.name.slice(0, 60)} — ₹{Math.round(p.sell_price)}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Image URL {platform === 'instagram' && <span className="text-red-400">*required for IG</span>}</label>
              <input value={mediaUrl} onChange={(e) => setMediaUrl(e.target.value)} placeholder={product?.image_url ? 'Using product image ✓' : 'https://…'} className="input" />
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between gap-2">
            <label className="label !mb-0">Caption</label>
            <button type="button" onClick={aiWrite} disabled={aiBusy} className="flex items-center gap-1.5 text-[11px] font-semibold text-violet-300 hover:text-violet-200">
              {aiBusy ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />} {aiBusy ? 'Writing…' : 'Write with AI'}
            </button>
          </div>
          <textarea
            name="content"
            required
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={8}
            className="input mt-1.5 font-body text-[12.5px] leading-relaxed"
            placeholder={platform === 'x' ? 'Max 280 characters…' : 'Apna caption yahan likhein ya AI se likhawein…'}
          />
          <p className="mt-1 text-right text-[10px] text-zinc-600">{content.length} chars{platform === 'x' && content.length > 280 ? ' — X limit exceeded!' : ''}</p>

          <div className="mt-2 grid grid-cols-3 gap-2">
            {([
              { id: 'now', label: 'Post now', icon: Send },
              { id: 'scheduled', label: 'Schedule', icon: CalendarClock },
              { id: 'draft', label: 'Draft', icon: Save },
            ] as const).map((o) => {
              const Icon = o.icon;
              const active = intent === o.id;
              return (
                <button type="button" key={o.id} onClick={() => setIntent(o.id)}
                  className={`flex items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-[11.5px] font-semibold transition ${active ? 'border-lime-500/50 bg-lime-500/10 text-lime-300' : 'border-line bg-panel2 text-zinc-400 hover:text-zinc-200'}`}>
                  <Icon size={14} /> {o.label}
                </button>
              );
            })}
          </div>
          {intent === 'scheduled' && (
            <input type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} className="input mt-2" required />
          )}

          {platform === 'whatsapp' && (
            <p className="mt-2 rounded-xl border border-amber-500/25 bg-amber-500/[0.06] p-2.5 text-[10.5px] leading-snug text-amber-200/90">
              WhatsApp broadcasts to cold lists need Meta-approved templates — use this for copy, then paste into your WhatsApp Broadcast list or Channels. AI replies to incoming DMs are already fully automatic.
            </p>
          )}
          {!connected && (
            <p className="mt-2 flex items-center gap-1.5 text-[10.5px] font-medium text-amber-300"><CircleAlert size={12} /> {platform} not connected yet — <a href="/connectors" className="underline">Connect now</a> (posting order will still be saved, with the real API error shown).</p>
          )}
          {flash && <p className={`mt-2 rounded-xl border p-2.5 text-[11px] ${flash.ok ? 'border-lime-500/30 bg-lime-500/10 text-lime-300' : 'border-red-900/50 bg-red-950/30 text-red-300'}`}>{flash.text}</p>}

          <button type="submit" disabled={busy || (platform === 'x' && content.length > 280)} className="btn-primary mt-3 w-full !py-3.5 text-sm">
            {busy ? <><Loader2 size={17} className="animate-spin" /> Working…</> : intent === 'now' ? <><Send size={17} /> Publish now</> : intent === 'scheduled' ? <><CalendarClock size={17} /> Schedule post</> : <><Save size={17} /> Save draft</>}
          </button>
        </form>

        {/* ── Queue & history ────────────────────────────── */}
        <div className="space-y-4 xl:col-span-2">
          <div className="card p-5">
            <div className="flex items-center justify-between">
              <p className="section-title flex items-center gap-2"><Timer size={13} /> Scheduled ({queued.length})</p>
              {queued.length > 0 && <span className="badge-violet">auto-publishes</span>}
            </div>
            <div className="mt-2 divide-y divide-line">
              {queued.length === 0 && <p className="py-4 text-center text-[11px] text-zinc-600">Nothing scheduled. Queue posts for festivals & peak hours (7–10 PM works best on Indian IG).</p>}
              {queued.map((p) => <PostRow key={p.id} post={p} />)}
            </div>
            <div className="mt-3 rounded-xl border border-line bg-panel2 p-3">
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-zinc-500">24/7 auto-publish (free cron)</p>
              <p className="mt-1 text-[10.5px] text-zinc-500">Create a free job at cron-job.org hitting this URL every 5 minutes:</p>
              <div className="mt-1.5 flex items-center gap-1.5">
                <code className="min-w-0 flex-1 truncate rounded-lg border border-line bg-ink px-2 py-1.5 text-[9px] text-violet-300">{cronUrl}</code>
                <button onClick={async () => { await navigator.clipboard.writeText(cronUrl); setCopiedCron(true); setTimeout(() => setCopiedCron(false), 1500); }} className="btn-ghost !px-2 !py-1.5 text-[10px]">{copiedCron ? <Check size={12} className="text-lime-400" /> : <Copy size={12} />}</button>
              </div>
            </div>
          </div>

          <div className="card p-5">
            <p className="section-title">Drafts ({drafts.length})</p>
            <div className="mt-2 divide-y divide-line">
              {drafts.length === 0 && <p className="py-4 text-center text-[11px] text-zinc-600">No drafts. “To Composer” from AI Studio drops them here.</p>}
              {drafts.map((p) => <PostRow key={p.id} post={p} />)}
            </div>
          </div>

          <div className="card p-5">
            <p className="section-title">History ({history.length})</p>
            <div className="mt-2 max-h-80 divide-y divide-line overflow-auto">
              {history.length === 0 && <p className="py-4 text-center text-[11px] text-zinc-600">Published posts appear here with live status.</p>}
              {history.map((p) => <PostRow key={p.id} post={p} />)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PostRow({ post }: { post: { id: number; platform: string; content: string; status: string; scheduled_at: string | null; published_at: string | null; error: string | null; product_name: string | null } }) {
  const [busy, setBusy] = useState(false);
  const Icon = PLATFORMS.find((p) => p.id === post.platform)?.icon ?? Send;
  const statusBadge =
    post.status === 'published' ? <span className="badge-lime !text-[9px]"><CircleCheck size={10} /> Live</span>
    : post.status === 'failed' ? <span className="badge-red !text-[9px]"><CircleAlert size={10} /> Failed</span>
    : post.status === 'scheduled' ? <span className="badge-violet !text-[9px]"><Clock size={10} /> {post.scheduled_at ? new Date(post.scheduled_at + 'Z').toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'Scheduled'}</span>
    : <span className="badge-zinc !text-[9px]">Draft</span>;

  return (
    <div className="flex items-start gap-2.5 py-2.5">
      <Icon size={15} className="mt-0.5 shrink-0 text-zinc-500" />
      <div className="min-w-0 flex-1">
        <p className="line-clamp-2 text-[11px] leading-snug text-zinc-300">{post.content}</p>
        {post.product_name && <p className="mt-0.5 text-[9px] uppercase tracking-wider text-zinc-600">{post.product_name.slice(0, 40)}</p>}
        {post.error && <p className="mt-1 rounded-lg border border-red-900/40 bg-red-950/20 p-1.5 text-[9px] leading-snug text-red-300">{post.error}</p>}
        <div className="mt-1.5 flex items-center gap-1.5">
          {statusBadge}
          {(post.status === 'draft' || post.status === 'scheduled' || post.status === 'failed') && (
            <button
              disabled={busy}
              className="btn-ghost !border-lime-500/30 !px-2 !py-1 text-[9.5px] !text-lime-300"
              onClick={async () => { setBusy(true); await publishPostNow(post.id); setBusy(false); }}
            >
              {busy ? <Loader2 size={10} className="animate-spin" /> : <Send size={10} />} Post now
            </button>
          )}
          {post.status === 'published' && <span className="flex items-center gap-0.5 text-[9px] text-zinc-600"><ExternalLink size={9} /> live on {post.platform}</span>}
          <button className="ml-auto rounded-lg p-1.5 text-zinc-600 hover:bg-red-950/40 hover:text-red-400" onClick={async () => { if (confirm('Delete this post?')) { setBusy(true); await deletePost(post.id); setBusy(false); } }}>
            <Trash2 size={12} />
          </button>
        </div>
      </div>
    </div>
  );
}
