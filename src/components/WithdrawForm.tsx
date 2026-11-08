'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowDownToLine, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { requestWithdrawal } from '@/lib/actions';
import { inr } from '@/lib/format';

export default function WithdrawForm({ balance, defaultUpi, defaultBank, biz }: { balance: number; defaultUpi: string; defaultBank: string; biz: string }) {
  const router = useRouter();
  const [method, setMethod] = useState<'upi' | 'bank'>('upi');
  const [amount, setAmount] = useState('');
  const [destination, setDestination] = useState(defaultUpi || '');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const switchMethod = (m: 'upi' | 'bank') => {
    setMethod(m);
    setDestination(m === 'upi' ? defaultUpi : defaultBank);
  };

  return (
    <form
      action={async (fd) => {
        setBusy(true); setMsg(null);
        const r = await requestWithdrawal(fd);
        if (r.ok) { setMsg({ ok: true, text: 'Withdrawal logged. Transfer it from your bank/Meesho settlement to yourself — it’s yours!' }); setAmount(''); }
        else setMsg({ ok: false, text: r.error ?? 'Failed' });
        setBusy(false);
        router.refresh();
      }}
      className="card p-5"
    >
      <p className="section-title flex items-center gap-2"><ArrowDownToLine size={13} /> Withdraw earnings</p>
      <div className="mt-3 grid grid-cols-2 gap-2">
        {(['upi', 'bank'] as const).map((m) => (
          <button key={m} type="button" onClick={() => switchMethod(m)}
            className={`rounded-xl border px-3 py-2.5 text-[11.5px] font-bold uppercase tracking-wider transition ${method === m ? 'border-violet-500/60 bg-violet-600/15 text-violet-200 ring-2 ring-violet-500/20' : 'border-line bg-panel2 text-zinc-500'}`}>
            {m === 'upi' ? 'UPI' : 'Bank transfer'}
          </button>
        ))}
      </div>
      <label className="label mt-3">Amount ₹ <span className="normal-case text-zinc-700">(max {inr(balance)})</span></label>
      <input name="amount" type="number" min={1} max={Math.floor(balance)} step="1" required value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="1000" className="input font-display text-lg font-bold" />
      <input type="hidden" name="method" value={method} />
      <label className="label mt-2.5">{method === 'upi' ? 'Your UPI ID' : 'Bank A/C + IFSC + name'}</label>
      <input name="destination" required value={destination} onChange={(e) => setDestination(e.target.value)} placeholder={method === 'upi' ? 'name@okhdfcbank' : 'A/C 1234… · IFSC HDFC000… · Holder name'} className="input" />
      <button type="submit" disabled={busy || balance <= 0} className="btn-primary mt-3 w-full !py-3">
        {busy ? <><Loader2 size={16} className="animate-spin" /> Logging…</> : <>Withdraw {amount ? inr(Number(amount) || 0) : ''}</>}
      </button>
      {msg && (
        <p className={`mt-2 flex items-start gap-1.5 rounded-xl border p-2.5 text-[11px] leading-snug ${msg.ok ? 'border-lime-500/30 bg-lime-500/10 text-lime-300' : 'border-red-900/50 bg-red-950/30 text-red-300'}`}>
          {msg.ok ? <CheckCircle2 size={13} className="mt-0.5 shrink-0" /> : <AlertCircle size={13} className="mt-0.5 shrink-0" />}{msg.text}
        </p>
      )}
      <p className="mt-2.5 text-center text-[9.5px] leading-snug text-zinc-600">{biz ? `${biz} · ` : ''}Shadow records the withdrawal; your money reaches you via your bank/Meesho settlement. Keep the habit: withdraw every Sunday.</p>
    </form>
  );
}
