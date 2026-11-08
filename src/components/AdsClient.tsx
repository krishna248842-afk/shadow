'use client';
import { useState } from 'react';
import {
  Megaphone, Sparkles, Loader2, RefreshCw, Trash2, CircleCheck, CircleAlert,
  MousePointerClick, Eye, IndianRupee, Info, Target, Rocket,
} from 'lucide-react';
import { createCampaign, syncCampaignInsights, logAdSpend, deleteCampaign, generateContentAction } from '@/lib/actions';
import { inr, num, pct } from '@/lib/format';

export default function AdsClient({ campaigns, products, metaReady }: {
  campaigns: any[];
  products: Array<{ id: number; name: string; sell_price: number; meesho_url: string; image_url: string }>;
  metaReady: boolean;
}) {
  const [productId, setProductId] = useState<number>(products[0]?.id ?? 0);
  const [name, setName] = useState('');
  const [budget, setBudget] = useState(200);
  const [destination, setDestination] = useState(products[0]?.meesho_url ?? '');
  const [primaryText, setPrimaryText] = useState('');
  const [headline, setHeadline] = useState('');
  const [description, setDescription] = useState('');
  const [pushToMeta, setPushToMeta] = useState(metaReady);
  const [aiBusy, setAiBusy] = useState(false);
  const [busy, setBusy] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [flash, setFlash] = useState<{ ok: boolean; text: string } | null>(null);

  const totalSpend = campaigns.reduce((s, c) => s + Number(c.spend || 0), 0);
  const totalImpr = campaigns.reduce((s, c) => s + Number(c.impressions || 0), 0);
  const totalClicks = campaigns.reduce((s, c) => s + Number(c.clicks || 0), 0);
  const ctr = totalImpr > 0 ? (totalClicks / totalImpr) * 100 : 0;
  const cpc = totalClicks > 0 ? totalSpend / totalClicks : 0;

  async function aiAdCopy() {
    setAiBusy(true);
    const r = await generateContentAction('ad_copy', productId || null, '');
    if (r.ok) {
      // Split "Primary text / Headline / Description" heuristically: give the full variants; use first variant as default copy
      setPrimaryText(r.text);
      setHeadline((products.find((p) => p.id === productId)?.name ?? 'Offer').slice(0, 40));
      setDescription('Free delivery · COD');
    }
    setAiBusy(false);
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="section-title">Ads</p>
          <h1 className="mt-1 font-display text-2xl font-bold text-white sm:text-3xl">Performance <span className="gradient-text">Marketing</span></h1>
          <p className="mt-1 text-xs text-zinc-500">AI writes the ads → push to Meta (paused) → launch when you’re happy → insights sync back.</p>
        </div>
        <button
          className="btn-ghost !py-2 text-xs"
          disabled={syncing}
          onClick={async () => { setSyncing(true); setFlash(null); const r = await syncCampaignInsights(); setFlash(r.ok ? { ok: true, text: `Insights synced for ${r.updated} campaign(s).` } : { ok: false, text: r.error ?? 'Sync failed' }); setSyncing(false); }}
        >
          {syncing ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />} Sync Meta insights
        </button>
      </div>

      {flash && <p className={`rounded-2xl border p-3 text-[11.5px] ${flash.ok ? 'border-lime-500/30 bg-lime-500/10 text-lime-300' : 'border-red-900/50 bg-red-950/30 text-red-300'}`}>{flash.text}</p>}

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat icon={<IndianRupee size={15} />} label="Total spend" value={inr(totalSpend)} tone="amber" />
        <Stat icon={<Eye size={15} />} label="Impressions" value={num(totalImpr)} tone="violet" />
        <Stat icon={<MousePointerClick size={15} />} label="Clicks" value={`${num(totalClicks)} · CTR ${pct(ctr)}`} tone="lime" />
        <Stat icon={<Target size={15} />} label="Cost per click" value={totalClicks ? inr(cpc) : '—'} tone="zinc" />
      </div>

      <div className="grid gap-5 xl:grid-cols-5">
        {/* Launch form */}
        <form
          action={async (fd) => {
            setBusy(true); setFlash(null);
            const r = await createCampaign(fd);
            setFlash(r.ok
              ? (r.metaError ? { ok: false, text: r.metaError } : { ok: true, text: r.pushed ? 'Campaign created in Meta as PAUSED. Review in Ads Manager, then set it live.' : 'Campaign saved locally. Connect Meta to push it live.' })
              : { ok: false, text: r.error ?? 'Failed' });
            setBusy(false);
          }}
          className="card p-5 xl:col-span-2"
        >
          <p className="section-title flex items-center gap-2"><Rocket size={13} /> Launch a campaign</p>
          <div className="mt-3 space-y-2.5">
            <div>
              <label className="label">Campaign name</label>
              <input name="name" value={name} onChange={(e) => setName(e.target.value)} className="input" placeholder="Diwali Kurti — Traffic — Mumbai" />
            </div>
            <div>
              <label className="label">Product</label>
              <select name="product_id" value={productId} onChange={(e) => { const id = Number(e.target.value); setProductId(id); setDestination(products.find((p) => p.id === id)?.meesho_url ?? destination); }} className="input">
                {products.map((p) => <option key={p.id} value={p.id}>{p.name.slice(0, 58)} — ₹{Math.round(p.sell_price)}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="label">Daily budget ₹</label>
                <input name="daily_budget" type="number" min={50} step={50} value={budget} onChange={(e) => setBudget(Number(e.target.value) || 0)} className="input" />
              </div>
              <div>
                <label className="label">Destination URL</label>
                <input name="destination_url" value={destination} onChange={(e) => setDestination(e.target.value)} className="input" placeholder="Meesho product link" />
              </div>
            </div>
            <div className="flex items-center justify-between gap-2">
              <label className="label !mb-0">Ad copy</label>
              <button type="button" onClick={aiAdCopy} disabled={aiBusy} className="flex items-center gap-1.5 text-[11px] font-semibold text-violet-300 hover:text-violet-200">
                {aiBusy ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />} Write with AI (3 variants shown in field)
              </button>
            </div>
            <textarea name="primary_text" value={primaryText} onChange={(e) => setPrimaryText(e.target.value)} rows={5} className="input text-[11.5px] leading-snug" placeholder="Primary text — AI variants will appear here; keep the best one." />
            <div className="grid grid-cols-2 gap-2">
              <input name="headline" value={headline} onChange={(e) => setHeadline(e.target.value)} maxLength={40} className="input" placeholder="Headline (max 40 chars)" />
              <input name="description" value={description} onChange={(e) => setDescription(e.target.value)} maxLength={30} className="input" placeholder="Description (max 30)" />
            </div>
            <label className="flex cursor-pointer items-start gap-2.5 rounded-xl border border-line bg-panel2 p-3">
              <input type="checkbox" name="push_to_meta" value="1" checked={pushToMeta} onChange={(e) => setPushToMeta(e.target.checked)} className="mt-0.5 h-4 w-4 accent-violet-500" />
              <span className="text-[11px] leading-snug text-zinc-300">
                <b className="text-white">Push to Meta Ads Manager (as PAUSED)</b><br />
                {metaReady ? 'Token, Ad Account & Page detected ✓ — creates campaign → ad set → creative → ad, all paused.' : 'Meta not connected yet — campaign saves locally with the exact error so you can fix keys.'}
              </span>
            </label>
            <button type="submit" disabled={busy} className="btn-violet w-full !py-3 text-sm">
              {busy ? <><Loader2 size={16} className="animate-spin" /> Creating…</> : <><Megaphone size={16} /> Create campaign (paused)</>}
            </button>
          </div>
        </form>

        {/* Campaign list */}
        <div className="xl:col-span-3">
          <div className="card p-5">
            <p className="section-title">Your campaigns ({campaigns.length})</p>
            <div className="mt-3 space-y-3">
              {campaigns.length === 0 && <p className="py-8 text-center text-[11.5px] text-zinc-600">No campaigns yet. Start with ₹200/day on your bestseller — COD fashion ads in tier-2/3 India typically hit ₹3–6 per click.</p>}
              {campaigns.map((c) => {
                const ctrC = c.impressions > 0 ? (c.clicks / c.impressions) * 100 : 0;
                return (
                  <div key={c.id} className="rounded-2xl border border-line bg-panel2 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-[12.5px] font-bold text-zinc-100">{c.name}</p>
                        <p className="truncate text-[10px] text-zinc-600">{c.product_name ?? '—'} · ₹{Math.round(c.daily_budget)}/day{c.meta_campaign_id && <> · Meta ID {c.meta_campaign_id}</>}</p>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className={c.meta_campaign_id ? 'badge-violet !text-[9px]' : 'badge-zinc !text-[9px]'}>{c.meta_campaign_id ? 'IN META (PAUSED)' : 'LOCAL DRAFT'}</span>
                        <button className="rounded-lg p-1.5 text-zinc-600 hover:bg-red-950/40 hover:text-red-400" onClick={async () => { if (confirm('Delete this campaign record? (Meta campaign in Ads Manager is NOT deleted)')) await deleteCampaign(c.id); }}>
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                    {c.meta_error && <p className="mt-2 flex items-start gap-1.5 rounded-lg border border-amber-500/25 bg-amber-500/[0.06] p-2 text-[9.5px] leading-snug text-amber-200/90"><CircleAlert size={11} className="mt-0.5 shrink-0" />{c.meta_error}</p>}
                    <div className="mt-2.5 grid grid-cols-4 gap-2 text-center text-[10px]">
                      <MiniStat label="Spend" value={inr(c.spend)} />
                      <MiniStat label="Impr." value={num(c.impressions)} />
                      <MiniStat label="Clicks" value={`${num(c.clicks)} · ${pct(ctrC)}`} />
                      <form
                        action={async (fd) => {
                          const amt = Number(fd.get('amt') || 0);
                          if (amt > 0) await logAdSpend(c.id, amt);
                        }}
                        className="flex items-center justify-center gap-1"
                      >
                        <input name="amt" type="number" min={1} placeholder="₹ spent" className="w-16 rounded-lg border border-line bg-ink px-1.5 py-1 text-[10px] outline-none focus:border-violet-500" />
                        <button className="rounded-lg border border-line p-1 text-zinc-500 hover:text-lime-400" title="Log manual spend"><IndianRupee size={12} /></button>
                      </form>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-4 flex items-start gap-2 rounded-xl border border-violet-500/20 bg-violet-600/[0.07] p-3 text-[10.5px] leading-relaxed text-violet-100/80">
              <Info size={13} className="mt-0.5 shrink-0 text-violet-300" />
              <span><b>Hard truth about ads:</b> Shadow never guesses with your money — everything lands PAUSED. You approve creative & budget, then toggle on in Meta Ads Manager. Kill any ad below 1.5× ROAS after ₹500 spend. COD creatives + “DM ORDER” CTA convert best for Meesho fashion in tier-2/3 India.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Stat({ icon, label, value, tone }: { icon: React.ReactNode; label: string; value: string; tone: 'lime' | 'violet' | 'amber' | 'zinc' }) {
  const cls = tone === 'lime' ? 'text-lime-300 border-lime-500/20 bg-lime-500/10' : tone === 'amber' ? 'text-amber-300 border-amber-500/20 bg-amber-500/10' : tone === 'violet' ? 'text-violet-300 border-violet-500/20 bg-violet-500/10' : 'text-zinc-400 border-zinc-700 bg-zinc-800/30';
  return (
    <div className="card p-4">
      <span className={`inline-flex rounded-lg border p-1.5 ${cls}`}>{icon}</span>
      <p className="mt-2 text-[9.5px] font-bold uppercase tracking-[0.14em] text-zinc-500">{label}</p>
      <p className="mt-0.5 font-display text-lg font-bold text-white">{value}</p>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-line bg-ink px-2 py-1.5">
      <p className="text-[8.5px] font-bold uppercase tracking-widest text-zinc-600">{label}</p>
      <p className="mt-0.5 text-[11px] font-bold text-zinc-200">{value}</p>
    </div>
  );
}
