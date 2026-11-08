import { all } from '@/lib/db';
import { getSettingsMap } from '@/lib/settings';
import AdsClient from '@/components/AdsClient';

export const dynamic = 'force-dynamic';

export default async function AdsPage() {
  const [campaigns, products, settings] = await Promise.all([
    all(`SELECT c.*, p.name AS product_name FROM campaigns c LEFT JOIN products p ON p.id = c.product_id ORDER BY c.id DESC`),
    all('SELECT id, name, sell_price, meesho_url, image_url FROM products ORDER BY id DESC'),
    getSettingsMap(),
  ]);
  const metaReady = !!settings.meta_access_token && !!settings.meta_ad_account_id && !!settings.meta_page_id;
  return <AdsClient campaigns={campaigns as any[]} products={products as any[]} metaReady={metaReady} />;
}
