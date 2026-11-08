// Export all orders as CSV (opens in Excel / Google Sheets).
import { NextResponse } from 'next/server';
import { all } from '@/lib/db';

export async function GET() {
  const rows = await all(
    `SELECT id, created_at, customer_name, phone, address, product_name, quantity, total, cost,
            (total - cost) AS profit, channel, payment_mode, payment_status, status
     FROM orders ORDER BY id DESC`);
  const header = ['id','date','customer','phone','address','product','qty','total_inr','cost_inr','profit_inr','channel','payment_mode','payment_status','status'];
  const esc = (v: any) => {
    const s = String(v ?? '');
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = [header.join(',')].concat(
    rows.map((r: any) => [r.id, r.created_at, r.customer_name, r.phone, r.address, r.product_name, r.quantity, r.total, r.cost, r.profit, r.channel, r.payment_mode, r.payment_status, r.status].map(esc).join(',')),
  );
  return new NextResponse(lines.join('\n'), {
    headers: { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': 'attachment; filename="shadow-orders.csv"' },
  });
}
