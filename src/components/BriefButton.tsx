'use client';
import { useState } from 'react';
import { Sparkles, Loader2, RefreshCw } from 'lucide-react';
import { generateBriefAction } from '@/lib/actions';

export default function BriefButton({ compact = false }: { compact?: boolean }) {
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  return (
    <button
      onClick={async () => {
        setLoading(true);
        setMsg('');
        const r = await generateBriefAction();
        if (!r.ok) setMsg(r.error ?? 'Brief failed');
        else if (r.source === 'offline') setMsg('Offline brief — add your AI key in Settings for live analysis.');
        setLoading(false);
      }}
      disabled={loading}
      className={compact ? 'btn-violet !px-3 !py-2 text-xs' : 'btn-violet'}
    >
      {loading ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
      {loading ? 'Analysing…' : 'Generate COO Brief'}
      {msg && <span className="ml-2 text-[10px] font-normal text-violet-200/80">{msg}</span>}
    </button>
  );
}
