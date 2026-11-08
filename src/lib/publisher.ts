// Publishing engine shared by "Post now" and the scheduled-post runner.
// Direct publishing is supported for platforms with official write APIs:
// Facebook (Page post), Instagram (content publish), X (tweet).
// WhatsApp/YouTube need richer flows (chat templates / video upload) and are
// handled inside the composer + studio instead.
import { all, get, run } from './db';
import { getSetting } from './settings';
import { postToFacebook, postToInstagram } from './integrations/meta';
import { postTweet } from './integrations/x';

export interface PublishablePost {
  id: number;
  platform: string;
  content: string;
  media_url: string;
  product_id: number | null;
}

async function resolveImageUrl(post: PublishablePost): Promise<string> {
  if (post.media_url) return post.media_url;
  if (post.product_id) {
    const p = await get<{ image_url: string }>('SELECT image_url FROM products WHERE id = ?', [post.product_id]);
    if (p?.image_url) return p.image_url;
  }
  return '';
}

async function resolveLink(post: PublishablePost): Promise<string> {
  if (post.product_id) {
    const p = await get<{ meesho_url: string }>('SELECT meesho_url FROM products WHERE id = ?', [post.product_id]);
    if (p?.meesho_url) return p.meesho_url;
  }
  return '';
}

export async function publishPost(postId: number): Promise<{ ok: boolean; externalId?: string; error?: string }> {
  const post = await get<PublishablePost>('SELECT id, platform, content, media_url, product_id FROM posts WHERE id = ?', [postId]);
  if (!post) return { ok: false, error: 'Post not found' };
  try {
    let externalId = '';
    if (post.platform === 'facebook') {
      const token = await getSetting('meta_access_token');
      const pageId = await getSetting('meta_page_id');
      if (!token || !pageId) throw new Error('Facebook not connected — add your Meta token & Page ID in Connectors.');
      externalId = await postToFacebook(token, pageId, post.content, await resolveLink(post) || undefined);
    } else if (post.platform === 'instagram') {
      const token = await getSetting('meta_access_token');
      const igId = await getSetting('meta_ig_user_id');
      if (!token || !igId) throw new Error('Instagram not connected — add your Meta token & IG User ID in Connectors.');
      externalId = await postToInstagram(token, igId, await resolveImageUrl(post), post.content);
    } else if (post.platform === 'x') {
      const ck = await getSetting('x_api_key'), cs = await getSetting('x_api_secret');
      const at = await getSetting('x_access_token'), as = await getSetting('x_access_secret');
      if (!ck || !cs || !at || !as) throw new Error('X not connected — add your 4 X API keys in Connectors.');
      externalId = await postTweet({ consumerKey: ck, consumerSecret: cs, accessToken: at, accessSecret: as }, post.content);
    } else {
      throw new Error(`Platform "${post.platform}" cannot be auto-published. Use copy/paste from the composer.`);
    }
    await run(`UPDATE posts SET status='published', external_id=?, published_at=datetime('now'), error=NULL WHERE id=?`, [externalId, postId]);
    return { ok: true, externalId };
  } catch (e: any) {
    const msg = (e?.message ?? String(e)).slice(0, 400);
    await run(`UPDATE posts SET status='failed', error=? WHERE id=?`, [msg, postId]);
    return { ok: false, error: msg };
  }
}

/** Publish every scheduled post whose time has come. Called by cron route and by Next's `after()` hook. */
export async function publishDuePosts(): Promise<{ published: number; failed: number }> {
  const due = await all<{ id: number }>(
    `SELECT id FROM posts WHERE status='scheduled' AND scheduled_at IS NOT NULL AND scheduled_at <= datetime('now') ORDER BY scheduled_at ASC LIMIT 20`,
  );
  let published = 0, failed = 0;
  for (const { id } of due) {
    const r = await publishPost(id);
    if (r.ok) published++; else failed++;
  }
  return { published, failed };
}
