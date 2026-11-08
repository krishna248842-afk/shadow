import {
  Wallet, ArrowDownLeft, ArrowUpRight, Landmark, BadgeIndianRupee, Info, TrendingUp, Megaphone, PiggyBank,
} from 'lucide-react';
import { all, get } from '@/lib/db';
import { getSetting } from '@/lib/settings';
import { inr, timeAgo } from '@/lib/format';
import WithdrawForm from '@/components/WithdrawForm';

export const dynamic = 'force-dynamic';

export default async function WalletPage() {
  const [balanceRow, lifetime, txns, withdrawals, upi, bank, biz] = await Promise.all([
    get(`SELECT COALESCE((SELECT SUM(amount) FROM wallet_txns),0) - COALESCE((SELECT SUM(amount) FROM withdrawals WHERE status='paid'),0) AS bal`),
    get(`SELECT
        COALESCE((SELECT SUM(amount) FROM wallet_txns WHERE type='order_profit'),0) AS profit,
        COALESCE((SELECT SUM(-amount) FROM wallet_txns WHERE type='ad_spend'),0) AS ads,
        COALESCE((SELECT SUM(amount) FROM withdrawals WHERE status='paid'),0) AS withdrawn,
        COALESCE((SELECT SUM(total) FROM orders WHERE status='delivered'),0) AS deliveredRevenue`),
    all(`SELECT * FROM wallet_txns ORDER BY id DESC LIMIT 30`),
    all(`SELECT * FROM withdrawals ORDER BY id DESC LIMIT 15`),
    getSetting('business_upi'),
    getSetting('business_bank'),
    getSetting('business_name'),
  ]);

  const balance = Number(balanceRow?.bal ?? 0);
  const profit = Number(lifetime?.profit ?? 0);
  const ads = Number(lifetime?.ads ?? 0);
  const withdrawn = Number(lifetime?.withdrawn ?? 0);
  const deliveredRevenue = Number(lifetime?.deliveredRevenue ?? 0);

  return (
    <div className="space-y-5">
      <div>
        <p className="section-title">Wallet</p>
        <h1 className="mt-1 font-display text-2xl font-bold text-white sm:text-3xl">Your <span className="gradient-text">Money Engine</span></h1>
        <p className="mt-1 text-xs text-zinc-500">Every delivered order auto-credits profit here. Withdraw any time — full transparency.</p>
      </div>

      {/* Balance hero */}
      <div className="relative overflow-hidden rounded-3xl border border-lime-500/25 bg-gradient-to-br from-lime-500/15 via-panel to-violet-600/15 p-6 shadow-lime sm:p-8">
        <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-lime-400/10 blur-3xl" />
        <div className="relative">
          <div className="flex items-center gap-2">
            <Wallet size={16} className="text-lime-300" />
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-lime-300/90">Available to withdraw</p>
          </div>
          <p className="mt-2 font-display text-5xl font-bold tracking-tight text-white sm:text-6xl">{inr(balance)}</p>
          <div className="mt-4 flex flex-wrap gap-2 text-[10.5px]">
            <span className="badge-lime">Lifetime profit {inr(profit)}</span>
            <span className="badge-amber">Ad spend {inr(ads)}</span>
            <span className="badge-violet">Delivered revenue {inr(deliveredRevenue)}</span>
            <span className="badge-zinc">Withdrawn {inr(withdrawn)}</span>
          </div>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-5">
        {/* Withdraw form */}
        <div className="xl:col-span-2">
          <WithdrawForm balance={balance} defaultUpi={upi} defaultBank={bank} biz={biz} />

          {/* Honest explainer */}
          <div className="card mt-4 p-5">
            <p className="section-title flex items-center gap-2"><Info size={13} /> Where the money actually comes from</p>
            <ol className="mt-2.5 space-y-2 text-[11px] leading-snug text-zinc-400">
              <li className="flex gap-2"><span className="font-bold text-violet-300">1.</span> Customer orders on your ad / post / WhatsApp broadcast. You capture it in <b>Orders</b>.</li>
              <li className="flex gap-2"><span className="font-bold text-violet-300">2.</span> You confirm by phone/WhatsApp (kills fake COD orders), then place the same order on <b>Meesho</b> with the customer’s address & pincode.</li>
              <li className="flex gap-2"><span className="font-bold text-violet-300">3.</span> Meesho ships. On delivery (COD or prepaid), the amount settles to <b>your Meesho/bank account</b> in their settlement cycle (usually 7–15 days).</li>
              <li className="flex gap-2"><span className="font-bold text-violet-300">4.</span> Margin = what customer paid you − Meesho price − Meesho commission (if supplier flow) − ad cost. Shadow tracks profit automatically on <b>Delivered</b>.</li>
              <li className="flex gap-2"><span className="font-bold text-violet-300">5.</span> The <b>Withdraw</b> button logs it — the actual bank transfer happens from your bank/Meesho settlement. Shadow can’t move money (no app legally can), it keeps the books perfect for you.</li>
            </ol>
          </div>
        </div>

        {/* History */}
        <div className="space-y-4 xl:col-span-3">
          <div className="card p-5">
            <p className="section-title">Recent money movements</p>
            <div className="mt-2 max-h-[340px] divide-y divide-line overflow-y-auto">
              {txns.length === 0 && <p className="py-6 text-center text-[11px] text-zinc-600">No transactions yet. First delivered order credits your first profit!</p>}
              {txns.map((t: any) => {
                const positive = Number(t.amount) >= 0;
                const Icon = t.type === 'order_profit' ? TrendingUp : t.type === 'ad_spend' ? Megaphone : PiggyBank;
                return (
                  <div key={t.id} className="flex items-center gap-3 py-2.5">
                    <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg ${positive ? 'bg-lime-500/10 text-lime-400' : 'bg-amber-500/10 text-amber-400'}`}>
                      <Icon size={15} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[11px] font-medium text-zinc-300">{t.note}</p>
                      <p className="text-[9px] uppercase tracking-wider text-zinc-600">{timeAgo(t.created_at)} · {t.type.replace('_', ' ')}</p>
                    </div>
                    <span className={`font-display text-[13px] font-bold ${positive ? 'text-lime-300' : 'text-amber-300'}`}>{positive ? '+' : ''}{inr(t.amount)}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="card p-5">
            <p className="section-title flex items-center gap-2"><Landmark size={13} /> Withdrawal history</p>
            <div className="mt-2 max-h-56 divide-y divide-line overflow-y-auto">
              {withdrawals.length === 0 && <p className="py-6 text-center text-[11px] text-zinc-600">No withdrawals yet.</p>}
              {withdrawals.map((w: any) => (
                <div key={w.id} className="flex items-center gap-3 py-2.5">
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-violet-500/10 text-violet-300"><BadgeIndianRupee size={15} /></span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[11px] font-medium text-zinc-300">{w.method?.toUpperCase()} · {w.destination}</p>
                    <p className="text-[9px] uppercase tracking-wider text-zinc-600">{timeAgo(w.created_at)} · {w.status}</p>
                  </div>
                  <span className="flex items-center gap-1 font-display text-[13px] font-bold text-violet-300"><ArrowUpRight size={13} />{inr(w.amount)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
