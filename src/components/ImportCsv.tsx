'use client';
import { useState } from 'react';
import { Upload, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { importProductsCSV } from '@/lib/actions';

const EXAMPLE = `name,cost_price,sell_price,mrp,category,meesho_url,image_url,stock,tags
Women Digital Print Kurti,220,399,999,Women Kurti,,https://images.meesho.com/items/xxx.jpg,100,"kurti,print,women"
Steel Diya Set 12pc,150,299,799,Home & Decor,,,150,"diya,pooja,diwali"`;

export default function ImportCsv() {
  const [csv, setCsv] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  return (
    <div>
      <textarea
        value={csv}
        onChange={(e) => setCsv(e.target.value)}
        rows={7}
        className="input font-mono text-[11px]"
        placeholder={EXAMPLE}
      />
      <div className="mt-2 flex flex-wrap items-center gap-3">
        <button
          className="btn-primary !py-2 text-xs"
          disabled={loading || !csv.trim()}
          onClick={async () => {
            setLoading(true); setMsg(null);
            const r = await importProductsCSV(csv);
            if (r.ok) setMsg({ ok: true, text: `Imported ${r.count} products into your catalog.` });
            else setMsg({ ok: false, text: r.error ?? 'Import failed' });
            setLoading(false);
          }}
        >
          {loading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />} Import products
        </button>
        <button className="text-[11px] font-semibold text-violet-300 hover:text-violet-200" onClick={() => setCsv(EXAMPLE)}>Load example</button>
        {msg && (
          <span className={`flex items-center gap-1.5 text-[11px] font-medium ${msg.ok ? 'text-lime-300' : 'text-red-400'}`}>
            {msg.ok ? <CheckCircle2 size={13} /> : <AlertCircle size={13} />} {msg.text}
          </span>
        )}
      </div>
    </div>
  );
}
