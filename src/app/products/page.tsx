import Link from 'next/link';
import {
  Package, Plus, Upload, Trash2, ExternalLink, Sparkles, X, Info, BadgePercent, Boxes,
} from 'lucide-react';
import { all, get } from '@/lib/db';
import { inr, pct, num } from '@/lib/format';
import { saveProduct, clearSampleProducts } from '@/lib/actions';
import DeleteProductButton from '@/components/DeleteProductButton';
import ImportCsv from '@/components/ImportCsv';

export const dynamic = 'force-dynamic';

export default async function ProductsPage({ searchParams }: { searchParams: Promise<{ edit?: string; panel?: string }> }) {
  const { edit, panel } = await searchParams;
  const editId = Number(edit || 0);
  const editing = editId ? await get('SELECT * FROM products WHERE id = ?', [editId]) : null;
  const products = await all('SELECT * FROM products ORDER BY is_sample ASC, id DESC');
  const sampleCount = products.filter((p: any) => p.is_sample).length;
  const showForm = panel === 'add' || !!editing;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="section-title">Catalog</p>
          <h1 className="mt-1 font-display text-2xl font-bold text-white sm:text-3xl">Meesho <span className="gradient-text">Products</span></h1>
          <p className="mt-1 text-xs text-zinc-500">Import from Meesho, price with your margin — Shadow handles the rest.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/products?panel=import" className="btn-ghost !py-2 text-xs"><Upload size={14} /> Import CSV</Link>
          <Link href="/products?panel=add" className="btn-primary !py-2 text-xs"><Plus size={14} /> Add product</Link>
        </div>
      </div>

      {sampleCount > 0 && (
        <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-amber-500/25 bg-amber-500/[0.07] px-4 py-3">
          <Info size={16} className="shrink-0 text-amber-300" />
          <p className="min-w-0 flex-1 text-[11.5px] text-amber-100/90"><b>{sampleCount} starter sample products</b> loaded so you can explore. Replace them with your real Meesho picks — or clear them in one click.</p>
          <form action={async () => { 'use server'; await clearSampleProducts(); }}>
            <button className="btn-ghost !border-amber-500/30 !py-1.5 text-[11px] !text-amber-200"><Trash2 size={12} /> Clear samples</button>
          </form>
        </div>
      )}

      {/* Import panel */}
      {panel === 'import' && (
        <div className="card p-5">
          <div className="mb-2 flex items-center justify-between">
            <p className="section-title">CSV Import — bulk add products</p>
            <Link href="/products"><X size={18} className="text-zinc-500 hover:text-white" /></Link>
          </div>
          <p className="mb-2 text-[11px] text-zinc-500">Header row required. Columns: <code className="text-zinc-400">name,cost_price,sell_price,mrp,category,meesho_url,image_url,stock,tags</code></p>
          <ImportCsv />
        </div>
      )}

      {/* Add / edit form */}
      {showForm && (
        <form action={async (fd) => { 'use server'; await saveProduct(fd); }} className="card p-5">
          <div className="mb-3 flex items-center justify-between">
            <p className="section-title">{editing ? `Edit — ${editing.name.slice(0, 48)}` : 'Add product'}</p>
            <Link href="/products"><X size={18} className="text-zinc-500 hover:text-white" /></Link>
          </div>
          {editing && <input type="hidden" name="id" value={editing.id} />}
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="label">Product name *</label>
              <input name="name" required defaultValue={editing?.name ?? ''} className="input" placeholder="Women Embroidered Kurti with Palazzo…" />
            </div>
            <div>
              <label className="label">Category</label>
              <input name="category" defaultValue={editing?.category ?? ''} className="input" placeholder="Women Kurti" />
            </div>
            <div>
              <label className="label">Stock</label>
              <input name="stock" type="number" min={0} defaultValue={editing?.stock ?? 100} className="input" />
            </div>
            <div>
              <label className="label">Meesho cost price (₹) — what you pay</label>
              <input name="cost_price" type="number" step="0.01" min={0} required defaultValue={editing?.cost_price ?? ''} className="input" placeholder="285" />
            </div>
            <div>
              <label className="label">Your selling price (₹) — margin built in</label>
              <input name="sell_price" type="number" step="0.01" min={0} required defaultValue={editing?.sell_price ?? ''} className="input" placeholder="449" />
            </div>
            <div>
              <label className="label">MRP shown with discount (₹)</label>
              <input name="mrp" type="number" step="0.01" min={0} defaultValue={editing?.mrp ?? ''} className="input" placeholder="1299" />
            </div>
            <div>
              <label className="label">Meesho commission % (if supplier flow)</label>
              <input name="commission_pct" type="number" step="0.1" min={0} defaultValue={editing?.commission_pct ?? 0} className="input" />
            </div>
            <div className="sm:col-span-2">
              <label className="label">Meesho product URL</label>
              <input name="meesho_url" defaultValue={editing?.meesho_url ?? ''} className="input" placeholder="https://www.meesho.com/…" />
              <p className="mt-1 text-[10px] text-zinc-600">Tip: open the product on Meesho → Copy link → paste here. This link goes in your posts, ads and payment flows.</p>
            </div>
            <div className="sm:col-span-2">
              <label className="label">Image URL (public — used for Instagram/Facebook posts)</label>
              <input name="image_url" defaultValue={editing?.image_url ?? ''} className="input" placeholder="https://images.meesho.com/…" />
            </div>
            <div className="sm:col-span-2">
              <label className="label">Description</label>
              <textarea name="description" rows={2} defaultValue={editing?.description ?? ''} className="input" placeholder="Short product story…" />
            </div>
            <div className="sm:col-span-2">
              <label className="label">Tags (comma separated)</label>
              <input name="tags" defaultValue={editing?.tags ?? ''} className="input" placeholder="kurti, ethnic, women…" />
            </div>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button type="submit" className="btn-primary">{editing ? 'Save changes' : 'Add to catalog'}</button>
            <Link href="/products" className="btn-ghost">Cancel</Link>
            <p className="ml-auto flex items-center gap-1.5 text-[10px] text-zinc-600"><BadgePercent size={12} /> Sweet spot for COD fashion: 35–60% margin</p>
          </div>
        </form>
      )}

      {/* Grid */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {products.length === 0 && (
          <div className="card col-span-full flex flex-col items-center py-16 text-center">
            <Package size={34} className="mb-3 text-zinc-700" />
            <p className="text-sm font-semibold text-zinc-300">Catalog is empty</p>
            <p className="mt-1 max-w-xs text-[11.5px] text-zinc-600">Add your first Meesho pick — name, cost, your price. Shadow writes the captions, ads and replies.</p>
            <Link href="/products?panel=add" className="btn-primary mt-4 text-xs"><Plus size={14} /> Add first product</Link>
          </div>
        )}
        {products.map((p: any) => {
          const profit = p.sell_price - p.cost_price - (p.sell_price * (p.commission_pct || 0)) / 100;
          const margin = p.sell_price > 0 ? (profit / p.sell_price) * 100 : 0;
          const discount = p.mrp > p.sell_price ? (1 - p.sell_price / p.mrp) * 100 : 0;
          return (
            <div key={p.id} className="card group flex flex-col overflow-hidden">
              <div className="relative h-40 w-full overflow-hidden bg-panel2">
                {p.image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.image_url} alt={p.name} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" loading="lazy" />
                ) : (
                  <div className="flex h-full w-full flex-col items-center justify-center text-zinc-700">
                    <Boxes size={30} />
                    <span className="mt-1.5 text-[9px] uppercase tracking-widest">No image</span>
                  </div>
                )}
                {p.is_sample ? <span className="badge-amber absolute left-3 top-3 !text-[9px]">SAMPLE</span> : null}
                {discount > 0 && <span className="badge-lime absolute right-3 top-3 !text-[9px]">{Math.round(discount)}% OFF</span>}
              </div>
              <div className="flex flex-1 flex-col p-4">
                <p className="line-clamp-2 min-h-[2.3em] text-[12.5px] font-semibold leading-snug text-zinc-100">{p.name}</p>
                <p className="mt-0.5 text-[10px] uppercase tracking-wider text-zinc-600">{p.category}</p>
                <div className="mt-2.5 flex items-baseline gap-2">
                  <span className="font-display text-xl font-bold text-white">{inr(p.sell_price)}</span>
                  {p.mrp > p.sell_price && <span className="text-[11px] text-zinc-600 line-through">{inr(p.mrp)}</span>}
                </div>
                <div className="mt-1 flex items-center gap-2 text-[11px]">
                  <span className="font-semibold text-lime-300">Profit {inr(profit)}/unit</span>
                  <span className="text-zinc-600">· {pct(margin)}</span>
                </div>
                <div className="mt-auto flex items-center gap-1.5 pt-3">
                  <Link href={`/studio?product=${p.id}`} className="btn-ghost !px-2.5 !py-1.5 text-[10.5px] !text-violet-300" title="Generate content"><Sparkles size={13} /> AI</Link>
                  <Link href={`/products?edit=${p.id}`} className="btn-ghost !px-2.5 !py-1.5 text-[10.5px]">Edit</Link>
                  {p.meesho_url && <a href={p.meesho_url} target="_blank" rel="noreferrer" className="btn-ghost !px-2.5 !py-1.5 text-[10.5px]" title="Open on Meesho"><ExternalLink size={13} /></a>}
                  <DeleteProductButton id={p.id} name={p.name} />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
