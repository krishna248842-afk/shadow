'use client';
import { useState } from 'react';
import { advanceOrder } from '@/lib/actions';
import { ArrowRight, Check, Loader2 } from 'lucide-react';

const NEXT_LABEL: Record<string, string> = {
  new: 'Confirm order',
  confirmed: 'Ordered on Meesho',
  ordered_on_meesho: 'Mark shipped',
  shipped: 'Mark delivered',
};

export default function AdvanceOrderButton({ orderId, status }: { orderId: number; status: string }) {
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  if (status === 'delivered') return <span className="badge-lime"><Check size={12} /> Delivered</span>;
  if (status === 'cancelled' || status === 'returned') return null;
  const label = NEXT_LABEL[status] ?? 'Advance';
  return (
    <span className="inline-flex flex-col items-end gap-1">
      <button
        className="btn-ghost !border-lime-500/30 !px-3 !py-1.5 text-[11px] !text-lime-300 hover:!bg-lime-500/10"
        disabled={loading}
        onClick={async () => {
          setLoading(true); setErr('');
          const r = await advanceOrder(orderId);
          if (!r.ok) setErr(r.error ?? 'Failed');
          setLoading(false);
        }}
      >
        {loading ? <Loader2 size={12} className="animate-spin" /> : null}
        {label} <ArrowRight size={12} />
      </button>
      {err && <span className="text-[10px] text-red-400">{err}</span>}
    </span>
  );
}
