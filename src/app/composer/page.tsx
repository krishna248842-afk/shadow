import { all } from '@/lib/db';
import { getSettingsMap } from '@/lib/settings';
import ComposerClient from '@/components/ComposerClient';

export const dynamic = 'force-dynamic';

export default async function ComposerPage({ searchParams }: { searchParams: Promise<{ product?: string }> }) {
  const { product: productParam } = await searchParams;
  const [products, posts, settings] = await Promise.all([
    all('SELECT id, name, sell_price, image_url, meesho_url FROM products ORDER BY id DESC'),
    all(`SELECT p.*, pr.name AS product_name FROM posts p LEFT JOIN products pr ON pr.id = p.product_id ORDER BY p.id DESC LIMIT 40`),
    getSettingsMap(),
  ]);
  const ready = {
    instagram: !!settings.meta_access_token && !!settings.meta_ig_user_id,
    facebook: !!settings.meta_access_token && !!settings.meta_page_id,
    x: !!settings.x_api_key && !!settings.x_access_token,
  };
  const cronUrl = `${process.env.APP_BASE_URL || 'https://your-domain.com'}/api/cron/tick?secret=${process.env.CRON_SECRET || 'shadow-cron-secret'}`;
  return (
    <ComposerClient
      products={products as any[]}
      posts={posts as any[]}
      preselect={Number(productParam || 0) || null}
      ready={ready}
      cronUrl={cronUrl}
    />
  );
}
