import { all } from '@/lib/db';
import { aiConfigured } from '@/lib/ai';
import StudioClient from '@/components/StudioClient';

export const dynamic = 'force-dynamic';

export default async function StudioPage({ searchParams }: { searchParams: Promise<{ product?: string }> }) {
  const { product: productParam } = await searchParams;
  const products = await all('SELECT id, name, sell_price, cost_price, mrp, category, tags FROM products ORDER BY id DESC');
  const configured = await aiConfigured();
  return <StudioClient products={products as any[]} preselect={Number(productParam || 0) || null} aiReady={configured} />;
}
