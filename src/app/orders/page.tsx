import { all } from '@/lib/db';
import OrdersClient from '@/components/OrdersClient';

export const dynamic = 'force-dynamic';

export default async function OrdersPage({ searchParams }: { searchParams: Promise<{ new?: string }> }) {
  const { new: showNew } = await searchParams;
  const [orders, products] = await Promise.all([
    all(`SELECT * FROM orders ORDER BY id DESC LIMIT 200`),
    all('SELECT id, name, sell_price, cost_price FROM products ORDER BY id DESC'),
  ]);
  return <OrdersClient orders={orders as any[]} products={products as any[]} openNew={showNew === '1'} />;
}
