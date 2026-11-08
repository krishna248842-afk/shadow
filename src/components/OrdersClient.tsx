'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Plus, X, ShoppingCart, Phone, MapPin, Link2, Banknote, Loader2, Copy, Check,
  ArrowRight, Download, MessageCircle, ShieldCheck, Undo2, IndianRupee,
} from 'lucide-react';
import { saveOrder, advanceOrder, setOrderStatus, markOrderPaid, sendOrderPaymentLink } from '@/lib/actions';
import { inr, timeAgo } from '@/lib/format';

const COLUMNS = [
  { status: 'new', label: 'New — confirm karo', tone: 'border-amber-500/40 text-amber-300' },
  { status: 'confirmed', label: 'Confirmed', tone: 'border-violet-500/40 text-violet-300' },
  { status: 'ordered_on_meesho', label: 'Ordered on Meesho', tone: 'border-sky-500/40 text-sky-300' },
  { status: 'shipped', label: 'Shipped', tone: 'border-lime-500/40 text-lime-300' },
  { status: 'delivered', label: 'Delivered ✓', tone: 'border-emerald-500/40 text-emerald-300' },
];

const CHANNEL_LABEL: Record<string, string> = { instagram: 'IG', facebook: 'FB', whatsapp: 'WA', youtube: 'YT', x: 'X', offline: 'Shop' };

export default function OrdersClient({ orders, products, openNew }: {
  orders: any[]; products: Array<{ id: number; name: string; sell_price: number; cost_price: number }>; openNew: boolean;
}) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(openNew);
  const [productId, setProductId] = useState<number>(products[0]?.id ?? 0);
  const [qty, setQty] = useState(1);
  const [total, setTotal] = useState<string>('');
  const active = orders.filter((o) => !['cancelled', 'returned'].includes(o.status));
  const archive = orders.filter((o) => ['cancelled', 'returned'].includes(o.status));
  const pendingAmt = active.filter((o) => o.status !== 'delivered').reduce((s, o) => s + Number(o.total), 0);
  const profitAmt = orders.filter((o) => o.status === 'delivered').reduce((s, o) => s + (Number(o.total) - Number(o.cost)), 0);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="section-title">Orders</p>
          <h1 className="mt-1 font-display text-2xl font-bold text-white sm:text-3xl">Sales <span className="gradient-text">Pipeline</span></h1>
          <p className="mt-1 text-xs text-zinc-500">Confirm COD → order on Meesho → deliver → profit auto-credits to wallet.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <a href="/api/export/orders" className="btn-ghost !py-2 text-xs"><Download size={14} /> Export CSV</a>
          <button onClick={() => setShowForm((v) => !v)} className="btn-primary !py-2 text-xs">
            {showForm ? <><X size={14} /> Close</> : <><Plus size={14} /> New order</>}
          </button>
        </div>
      </div>

      {/* Mini stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div className="card p-3.5 text-center"><p className="text-[9.5px] font-bold uppercase tracking-widest text-zinc-500">Pipeline value</p><p className="mt-1 font-display text-lg font-bold text-amber-300">{inr(pendingAmt)}</p></div>
        <div className="card p-3.5 text-center"><p className="text-[9.5px] font-bold uppercase tracking-widest text-zinc-500">Delivered profit</p><p className="mt-1 font-display text-lg font-bold text-lime-300">{inr(profitAmt)}</p></div>
        <div className="card hidden p-3.5 text-center sm:block"><p className="text-[9.5px] font-bold uppercase tracking-widest text-zinc-500">Total orders</p><p className="mt-1 font-display text-lg font-bold text-white">{orders.length}</p></div>
      </div>

      {/* New order form */}
      {showForm && (
        <form
          action={async (fd) => { await saveOrder(fd); setShowForm(false); router.refresh(); }}
          className="card p-5"
        >
          <p className="section-title">Capture new order</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="sm:col-span-2 lg:col-span-1">
              <label className="label">Customer name *</label>
              <input name="customer_name" required className="input" placeholder="Rohit Kumar" />
            </div>
            <div>
              <label className="label">Phone (WhatsApp)</label>
              <input name="phone" className="input" inputMode="numeric" placeholder="98XXXXXXXX" />
            </div>
            <div>
              <label className="label">Channel</label>
              <select name="channel" className="input" defaultValue="instagram">
                {Object.entries(CHANNEL_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Payment mode</label>
              <select name="payment_mode" className="input" defaultValue="cod">
                <option value="cod">COD (cash on delivery)</option>
                <option value="prepaid">Prepaid — Razorpay link</option>
                <option value="upi">UPI direct</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="label">Product</label>
              <select
                name="product_id"
                className="input"
                value={productId}
                onChange={(e) => { setProductId(Number(e.target.value)); setTotal(''); }}
              >
                <option value={0}>— Custom / other product —</option>
                {products.map((p) => <option key={p.id} value={p.id}>{p.name.slice(0, 60)} — ₹{Math.round(p.sell_price)}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Qty</label>
              <input name="quantity" type="number" min={1} value={qty} onChange={(e) => setQty(Math.max(1, Number(e.target.value) || 1))} className="input" />
            </div>
            <div>
              <label className="label">Total ₹ {productId > 0 && <span className="normal-case text-zinc-700">(auto)</span>}</label>
              <input name="total_manual" type="number" step="0.01" value={total} onChange={(e) => setTotal(e.target.value)} placeholder={productId > 0 ? String(Math.round((products.find((p) => p.id === productId)?.sell_price ?? 0) * qty)) : '0'} className="input" />
            </div>
            <div className="sm:col-span-2 lg:col-span-4">
              <label className="label">Delivery address</label>
              <textarea name="address" rows={2} className="input" placeholder="House, street, landmark, city, state, pincode" />
            </div>
            <div className="sm:col-span-2 lg:col-span-4">
              <label className="label">Notes</label>
              <input name="notes" className="input" placeholder="Size M, color black, gift wrap…" />
            </div>
          </div>
          <button type="submit" className="btn-primary mt-3"><ShoppingCart size={16} /> Capture order</button>
        </form>
      )}

      {/* Kanban pipeline */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
        {COLUMNS.map((col) => {
          const items = active.filter((o) => o.status === col.status);
          return (
            <div key={col.status} className="flex flex-col rounded-2xl border border-line bg-panel/50 p-2.5">
              <div className={`mb-2 flex items-center justify-between rounded-xl border bg-panel2 px-3 py-2 ${col.tone}`}>
                <span className="text-[10px] font-bold uppercase tracking-[0.14em]">{col.label}</span>
                <span className="font-display text-[11px] font-bold">{items.length}</span>
              </div>
              <div className="flex max-h-[62vh] flex-col gap-2 overflow-y-auto">
                {items.map((o) => <OrderCard key={o.id} order={o} />)}
                {items.length === 0 && <p className="py-6 text-center text-[10px] text-zinc-700">—</p>}
              </div>
            </div>
          );
        })}
      </div>

      {/* Cancelled / returned archive */}
      {archive.length > 0 && (
        <details className="card p-4">
          <summary className="flex items-center gap-2 text-[11px] font-semibold text-zinc-500"><Undo2 size={13} /> Cancelled & returned ({archive.length}) — tap to expand</summary>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {archive.map((o) => (
              <div key={o.id} className="rounded-xl border border-line bg-panel2 p-3 text-[11px]">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-zinc-300">#{o.id} {o.customer_name}</span>
                  <span className="badge-red !text-[9px]">{o.status}</span>
                </div>
                <p className="mt-1 text-zinc-500">{o.product_name} · {inr(o.total)} · {timeAgo(o.created_at)}</p>
              </div>
            ))}
          </div>
        </details>
      )}
    </div>
  );
}

const NEXT_LABEL: Record<string, string> = {
  new: 'Confirm', confirmed: 'Order on Meesho', ordered_on_meesho: 'Mark shipped', shipped: 'Delivered ✓',
};

function OrderCard({ order }: { order: any }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [waText, setWaText] = useState('');
  const [copied, setCopied] = useState(false);
  const profit = Number(order.total) - Number(order.cost);
  const wa = String(order.phone || '').replace(/\D/g, '');
  const waLink = wa ? `https://wa.me/${wa.length === 10 ? '91' + wa : wa}?text=${encodeURIComponent(`Namaste ${order.customer_name}! Aapka order Shadow se confirm hua: ${order.product_name} — ₹${Math.round(order.total)}. Delivery 2-6 days mein. Shukriya! 🙏`)}` : '';

  return (
    <div className="rounded-xl border border-line bg-panel2 p-3">
      <div className="flex items-center justify-between gap-2">
        <span className="font-display text-[10px] font-bold text-zinc-600">#{order.id} · {CHANNEL_LABEL[order.channel] ?? order.channel}</span>
        <span className="text-[9px] text-zinc-600">{timeAgo(order.created_at)}</span>
      </div>
      <p className="mt-1.5 flex items-center gap-1 text-[12px] font-semibold leading-snug text-zinc-100"><Phone size={11} className="shrink-0 text-zinc-500" />{order.customer_name}{order.phone ? ` · ${order.phone}` : ''}</p>
      <p className="mt-1 line-clamp-2 flex items-start gap-1 text-[10.5px] leading-snug text-zinc-400"><MapPin size={10} className="mt-0.5 shrink-0 text-zinc-600" />{order.address || 'No address captured'}</p>
      <p className="mt-1.5 line-clamp-1 text-[11px] font-medium text-zinc-300">{order.quantity}× {order.product_name}</p>
      <div className="mt-1.5 flex items-baseline justify-between gap-2">
        <span className="font-display text-[15px] font-bold text-white">{inr(order.total)}</span>
        <span className="text-[9.5px] font-semibold text-lime-400">+{inr(profit)} profit</span>
      </div>
      <div className="mt-1.5 flex items-center gap-1.5">
        <span className="badge-zinc !text-[8.5px]">{order.payment_mode?.toUpperCase()}</span>
        {order.payment_status === 'paid' ? <span className="badge-lime !text-[8.5px]"><ShieldCheck size={9} /> PAID</span> : <span className="badge-amber !text-[8.5px]">UNPAID</span>}
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        {order.status !== 'delivered' && (
          <button
            disabled={busy}
            className="btn-ghost !border-lime-500/30 !px-2 !py-1.5 text-[9.5px] !text-lime-300"
            onClick={async () => { setBusy(true); await advanceOrder(order.id); setBusy(false); router.refresh(); }}
          >
            {busy ? <Loader2 size={10} className="animate-spin" /> : <ArrowRight size={10} />} {NEXT_LABEL[order.status] ?? 'Advance'}
          </button>
        )}
        {waLink && (
          <a href={waLink} target="_blank" rel="noreferrer" className="btn-ghost !px-2 !py-1.5 text-[9.5px] !text-emerald-300" title="WhatsApp customer">
            <MessageCircle size={11} />
          </a>
        )}
        <button
          disabled={busy}
          className="btn-ghost !px-2 !py-1.5 text-[9.5px] !text-sky-300"
          title="Create Razorpay payment link (prepaid orders)"
          onClick={async () => {
            setBusy(true); setWaText('');
            const r = await sendOrderPaymentLink(order.id);
            if (r.ok) setWaText(r.url ?? '');
            else setWaText('ERR: ' + (r.error ?? 'Razorpay not connected'));
            setBusy(false); router.refresh();
          }}
        >
          <Link2 size={11} /> Link
        </button>
        {order.payment_status !== 'paid' && (
          <button disabled={busy} className="btn-ghost !px-2 !py-1.5 text-[9.5px]" onClick={async () => { setBusy(true); await markOrderPaid(order.id); setBusy(false); router.refresh(); }} title="Mark as paid (cash/UPI received)">
            <IndianRupee size={11} /> Paid
          </button>
        )}
        <button className="btn-ghost !border-red-900/40 !px-2 !py-1.5 text-[9.5px] !text-red-400" onClick={async () => { setBusy(true); await setOrderStatus(order.id, 'cancelled'); setBusy(false); router.refresh(); }} title="Cancel order">
          <X size={11} />
        </button>
      </div>
      {waText && (
        <div className="mt-2 flex items-center gap-1.5 rounded-lg border border-sky-500/25 bg-sky-500/[0.06] p-1.5">
          <code className="min-w-0 flex-1 truncate text-[9px] text-sky-300">{waText}</code>
          {!waText.startsWith('ERR') && (
            <button onClick={async () => { await navigator.clipboard.writeText(waText); setCopied(true); setTimeout(() => setCopied(false), 1500); }}>
              {copied ? <Check size={12} className="text-lime-400" /> : <Copy size={12} className="text-zinc-500" />}
            </button>
          )}
          {waText.startsWith('ERR') && <span className="text-[9px] text-red-400">{waText}</span>}
        </div>
      )}
      {order.razorpay_link_url && !waText && (
        <p className="mt-1.5 truncate text-[9px] text-zinc-600">Razorpay: <a href={order.razorpay_link_url} target="_blank" rel="noreferrer" className="text-sky-400 underline">{order.razorpay_link_url}</a></p>
      )}
    </div>
  );
}
