'use client';
import { useState } from 'react';
import { Trash2, Loader2 } from 'lucide-react';
import { deleteProduct } from '@/lib/actions';

export default function DeleteProductButton({ id, name }: { id: number; name: string }) {
  const [loading, setLoading] = useState(false);
  return (
    <button
      className="btn-ghost !border-red-900/50 !px-2.5 !py-1.5 text-[10.5px] !text-red-400 hover:!bg-red-950/40"
      disabled={loading}
      title="Delete product"
      onClick={async () => {
        if (!confirm(`Delete “${name.slice(0, 60)}”? This cannot be undone.`)) return;
        setLoading(true);
        await deleteProduct(id);
        setLoading(false);
      }}
    >
      {loading ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
    </button>
  );
}
