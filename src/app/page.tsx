import Link from 'next/link';
import { after } from 'next/server';
import {
  IndianRupee, ShoppingCart, Wallet, Megaphone, ArrowRight, TrendingUp, Package,
  AlertTriangle, Sparkles, CircleCheck, Clock, Flame,
} from 'lucide-react';
import { all, get } from '@/lib/db';
import { getSetting } from '@/lib/settings';
import { inr, timeAgo, num } from '@/lib/format';
import { publishDuePosts } from '@/lib/publisher';
import { RevenueChart, ChannelBarChart } from '@/components/Charts';
import BriefButton from '@/components/BriefButton';
import AdvanceOrderButton from '@/components/AdvanceOrderButton';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  // Publish any scheduled posts that came due (fire-and-forget after response)
  try { after(() => publishDuePosts()); } catch { /* no-op outside request scope */ }

  const [today, lifetime, series, channels, byStatus, recentOrders, failedPosts, scheduledPosts, lowStock, biz, brief, briefAt, topProduct] =
    await Promise.all([
      get(`SELECT COUNT(*) AS orders, COALESCE(SUM(total),0) AS revenue FROM orders WHERE date(created_at)=date('now') AND status != 'cancelled'`),
      get(`SELECT COUNT(*) AS orders, COALESCE(SUM(CASE WHEN status='delivered' THEN total ELSE 0 END),0) AS deliveredRevenue, COALESCE((SELECT SUM(amount) FROM wallet_txns),0) AS walletIn, COALESCE((SELECT SUM(amount) FROM withdrawals WHERE status='paid'),0) AS withdrawn FROM orders`),
      all(`SELECT strftime('%d %b', created_at) AS day, COALESCE(SUM(total),0) AS revenue FROM orders WHERE created_at >= datetime('now','-13 days') AND status != 'cancelled' GROUP BY date(created_at) ORDER BY date(created_at)`),
      all(`SELECT channel, COUNT(*) AS orders FROM orders GROUP BY channel ORDER BY orders DESC`),
      all(`SELECT status, COUNT(*) AS c FROM orders GROUP BY status`),
      all(`SELECT id, customer_name, product_name, total, status, payment_status, payment_mode, created_at FROM orders ORDER BY id DESC LIMIT 5`),
      get(`SELECT COUNT(*) AS c FROM posts WHERE status='failed'`),
      get(`SELECT COUNT(*) AS c FROM posts WHERE status='scheduled'`),
      all(`SELECT id, name, stock FROM products WHERE stock <= 10 ORDER BY stock ASC LIMIT 4`),
      getSetting('business_name'),
      getSetting('ai_brief'),
      getSetting('ai_brief_at'),
      get(`SELECT product_name AS name, COUNT(*) AS c, SUM(total) AS r FROM orders WHERE product_name != '' GROUP BY product_name ORDER BY c DESC LIMIT 3`),
    ]);

  const walletBalance = Number(lifetime?.walletIn ?? 0) - Number(lifetime?.withdrawn ?? 0);
  const adSpendRow = await get(`SELECT COALESCE(SUM(spend),0) AS s, COALESCE(SUM(clicks),0) AS c FROM campaigns`);
  const adSpend = Number(adSpendRow?.s ?? 0);
  const statusMap: Record<string, number> = Object.fromEntries((byStatus as any[]).map((r) => [r.status, r.c]));

  // Fill missing days with zero for a continuous chart
  const seriesMap = new Map((series as any[]).map((r) => [r.day, Number(r.revenue)]));
  const chartData: Array<{ day: string; revenue: number }> = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
    chartData.push({ day: key, revenue: seriesMap.get(key) ?? 0 });
  }

  const needsOnboarding = !(await getSetting('ai_api_key')) && !(await getSetting('meta_access_token'));

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="section-title">Mission Control</p>
          <h1 className="mt-1 font-display text-2xl font-bold text-white sm:text-3xl">
            {biz ? <>Namaste, <span className="gradient-text">{biz}</span> 👋</> : <>Your <span className="gradient-text">Shadow</span> is live</>}
          </h1>
          <p className="mt-1 text-xs text-zinc-500">{new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} · All systems on this screen</p>
        </div>
        <BriefButton />
      </div>

      {needsOnboarding && (
        <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-violet-500/30 bg-gradient-to-r from-violet-600/20 to-transparent p-4">
          <Sparkles className="shrink-0 text-violet-300" size={20} />
          <p className="min-w-0 flex-1 text-[12px] leading-snug text-violet-100/90">
            <b>Finish going live in 10 minutes:</b> paste your AI key + Meta token in Connectors, then run everything from your phone.
          </p>
          <Link href="/guide" className="btn-violet !py-2 text-xs">Open Setup Guide <ArrowRight size={13} /></Link>
        </div>
      )}

      {/* AI COO brief */}
      <div className="card relative overflow-hidden p-5">
        <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-violet-600/20 blur-3xl" />
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Sparkles size={15} className="text-lime-400" />
            <p className="section-title !text-violet-300/90">AI COO Brief</p>
          </div>
          <span className="text-[10px] text-zinc-600">{briefAt ? `Updated ${timeAgo(briefAt)}` : 'Tap “Generate COO Brief”'}</span>
        </div>
        <p className="mt-3 whitespace-pre-line text-[12.5px] leading-relaxed text-zinc-300">
          {brief || 'Aapka AI chief-of-staff abhi taiyaar hai. “Generate COO Brief” dabao — woh aapke aaj ke orders, revenue, wallet aur bestseller dekhkar blunt, actionable Hinglish plan dega.'}
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard icon={<IndianRupee size={17} />} label="Revenue today" value={inr(Number(today?.revenue ?? 0))} sub={`${num(today?.orders ?? 0)} orders today`} tone="lime" href="/orders" />
        <StatCard icon={<ShoppingCart size={17} />} label="Total orders" value={num(lifetime?.orders ?? 0)} sub={`${num(statusMap['new'] ?? 0)} new · ${num(statusMap['shipped'] ?? 0)} shipped`} tone="violet" href="/orders" />
        <StatCard icon={<Wallet size={17} />} label="Wallet balance" value={inr(walletBalance)} sub={`${inr(Number(lifetime?.withdrawn ?? 0))} withdrawn so far`} tone="lime" href="/wallet" />
        <StatCard icon={<Megaphone size={17} />} label="Ad spend (all)" value={inr(adSpend)} sub={`${num(adSpendRow?.c ?? 0)} ad clicks tracked`} tone="amber" href="/ads" />
      </div>

      <div className="grid gap-4 xl:grid-cols-5">
        {/* Revenue chart */}
        <div className="card p-5 xl:col-span-3">
          <div className="mb-2 flex items-center justify-between">
            <p className="section-title flex items-center gap-2"><TrendingUp size={13} /> Revenue · last 14 days</p>
            <Link href="/wallet" className="text-[11px] font-semibold text-violet-300 hover:text-violet-200">Wallet →</Link>
          </div>
          <RevenueChart data={chartData} />
        </div>

        {/* Channel split */}
        <div className="card p-5 xl:col-span-2">
          <p className="section-title flex items-center gap-2"><Flame size={13} /> Orders by channel</p>
          {(channels as any[]).length > 0 ? <ChannelBarChart data={channels as any[]} /> : <EmptyMini text="Orders will appear here once customers start buying." />}
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-5">
        {/* Recent orders */}
        <div className="card p-5 xl:col-span-3">
          <div className="mb-3 flex items-center justify-between">
            <p className="section-title">Latest orders</p>
            <Link href="/orders" className="flex items-center gap-1 text-[11px] font-semibold text-violet-300 hover:text-violet-200">Full board <ArrowRight size={12} /></Link>
          </div>
          <div className="divide-y divide-line">
            {(recentOrders as any[]).length === 0 && <EmptyMini text="No orders yet — post your first product and share the link!" />}
            {(recentOrders as any[]).map((o) => (
              <div key={o.id} className="flex items-center gap-3 py-3">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-violet-600/15 font-display text-[11px] font-bold text-violet-300">#{o.id}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[12.5px] font-semibold text-zinc-100">{o.customer_name}</p>
                  <p className="truncate text-[11px] text-zinc-500">{o.product_name} · {o.payment_mode?.toUpperCase()} {o.payment_status === 'paid' && <span className="text-lime-400">· PAID</span>}</p>
                </div>
                <div className="text-right">
                  <p className="text-[13px] font-bold text-white">{inr(o.total)}</p>
                  <p className="text-[9.5px] uppercase tracking-wide text-zinc-600">{timeAgo(o.created_at)}</p>
                </div>
                <AdvanceOrderButton orderId={o.id} status={o.status} />
              </div>
            ))}
          </div>
        </div>

        {/* Attention center */}
        <div className="card p-5 xl:col-span-2">
          <p className="section-title">Needs your attention</p>
          <ul className="mt-3 space-y-2.5 text-[12px]">
            <AttentionRow ok={(statusMap['new'] ?? 0) + (statusMap['confirmed'] ?? 0) === 0} label={`${num((statusMap['new'] ?? 0) + (statusMap['confirmed'] ?? 0))} orders waiting for confirmation`} href="/orders" />
            <AttentionRow ok={(failedPosts as any)?.c === 0} label={`${num((failedPosts as any)?.c ?? 0)} failed posts to retry`} href="/composer" />
            <AttentionRow ok={(scheduledPosts as any)?.c === 0} label={`${num((scheduledPosts as any)?.c ?? 0)} posts scheduled in queue`} href="/composer" />
            <AttentionRow ok={lowStock.length === 0} label={lowStock.length ? `Low stock: ${lowStock.map((p: any) => p.name.slice(0, 28)).join(', ')}` : 'All products well stocked'} href="/products" warn={lowStock.length > 0} />
          </ul>

          <div className="mt-4 border-t border-line pt-4">
            <p className="section-title !text-[11px]">Bestsellers</p>
            {topProduct ? (
              <div className="mt-2 flex items-center gap-2">
                <Flame size={14} className="text-amber-400" />
                <p className="text-[12px] text-zinc-300"><b className="text-white">{(topProduct as any).name}</b> — {inr((topProduct as any).r)} across {(topProduct as any).c} orders</p>
              </div>
            ) : <EmptyMini text="Your top seller will surface here after a few orders." />}
            <Link href="/studio?product=" className="btn-ghost mt-4 w-full !py-2 text-[11px]"><Sparkles size={13} /> Generate content for a product</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, sub, tone, href }: { icon: React.ReactNode; label: string; value: string; sub: string; tone: 'lime' | 'violet' | 'amber'; href: string }) {
  const toneCls = tone === 'lime' ? 'text-lime-300 bg-lime-500/10 border-lime-500/20'
    : tone === 'amber' ? 'text-amber-300 bg-amber-500/10 border-amber-500/20'
    : 'text-violet-300 bg-violet-500/10 border-violet-500/20';
  return (
    <Link href={href} className="card group p-4 transition hover:border-zinc-700">
      <div className={`inline-flex items-center rounded-lg border p-1.5 ${toneCls}`}>{icon}</div>
      <p className="mt-2.5 text-[10px] font-bold uppercase tracking-[0.14em] text-zinc-500">{label}</p>
      <p className="mt-0.5 font-display text-xl font-bold text-white group-hover:text-lime-300 sm:text-2xl">{value}</p>
      <p className="mt-1 text-[10px] text-zinc-600">{sub}</p>
    </Link>
  );
}

function AttentionRow({ ok, label, href, warn = false }: { ok: boolean; label: string; href: string; warn?: boolean }) {
  const Icon = ok ? CircleCheck : warn ? AlertTriangle : Clock;
  const cls = ok ? 'text-lime-400' : warn ? 'text-amber-400' : 'text-violet-300';
  return (
    <li>
      <Link href={href} className="flex items-center gap-2.5 rounded-xl border border-line bg-panel2 px-3 py-2.5 transition hover:border-zinc-700">
        <Icon size={15} className={`shrink-0 ${cls}`} />
        <span className="text-zinc-300">{label}</span>
      </Link>
    </li>
  );
}

function EmptyMini({ text }: { text: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-center">
      <Package size={26} className="mb-2 text-zinc-700" />
      <p className="max-w-[240px] text-[11.5px] text-zinc-600">{text}</p>
    </div>
  );
}
