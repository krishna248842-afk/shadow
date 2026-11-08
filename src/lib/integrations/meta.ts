// ─────────────────────────────────────────────────────────────────────────────
// Meta integration — Facebook Page posts, Instagram Business publishing and
// Marketing API campaigns. All calls hit the real Graph API.
// Docs: https://developers.facebook.com/docs/graph-api
// ─────────────────────────────────────────────────────────────────────────────
const GRAPH = 'https://graph.facebook.com/v21.0';

async function graphPost(path: string, params: Record<string, any>): Promise<any> {
  const body = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) body.set(k, typeof v === 'string' ? v : JSON.stringify(v));
  const res = await fetch(`${GRAPH}/${path}`, { method: 'POST', body, signal: AbortSignal.timeout(45_000) });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || json.error) {
    const msg = json?.error?.message || `Meta API error ${res.status}`;
    const hint = json?.error?.error_user_msg ? ` — ${json.error.error_user_msg}` : '';
    throw new Error(msg + hint);
  }
  return json;
}

async function graphGet(path: string, params: Record<string, string>): Promise<any> {
  const qs = new URLSearchParams(params).toString();
  const res = await fetch(`${GRAPH}/${path}?${qs}`, { signal: AbortSignal.timeout(45_000) });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || json.error) throw new Error(json?.error?.message || `Meta API error ${res.status}`);
  return json;
}

export async function testMeta(token: string, pageId?: string) {
  const me = await graphGet('me', { fields: 'id,name', access_token: token });
  let pageName: string | undefined;
  if (pageId) {
    const page = await graphGet(pageId, { fields: 'id,name,fan_count', access_token: token });
    pageName = page?.name;
  }
  return { user: me?.name ?? 'OK', pageName };
}

export async function testInstagram(token: string, igUserId: string) {
  const ig = await graphGet(igUserId, { fields: 'id,username,followers_count,media_count', access_token: token });
  return { username: ig?.username ?? 'OK', followers: ig?.followers_count ?? 0 };
}

export async function postToFacebook(token: string, pageId: string, message: string, link?: string) {
  const params: Record<string, any> = { message, access_token: token };
  if (link) params.link = link;
  const json = await graphPost(`${pageId}/feed`, params);
  return json?.id as string;
}

export async function postToInstagram(token: string, igUserId: string, imageUrl: string, caption: string) {
  if (!imageUrl) throw new Error('Instagram requires a public image URL. Add an image URL to the product or paste one in the composer.');
  // 1) create media container  2) publish it
  const container = await graphPost(`${igUserId}/media`, { image_url: imageUrl, caption, access_token: token });
  const published = await graphPost(`${igUserId}/media_publish`, { creation_id: container.id, access_token: token });
  return published?.id as string;
}

// ── Ads (Marketing API) — creates PAUSED campaign → ad set → creative → ad ──
export interface AdBrief {
  name: string;
  dailyBudgetInr: number;
  destinationUrl: string;
  headline: string;
  primaryText: string;
  description: string;
  imageUrl: string;
  pageId: string;
}

export async function createMetaCampaign(token: string, adAccountId: string, ad: AdBrief) {
  const acct = adAccountId.startsWith('act_') ? adAccountId : `act_${adAccountId}`;
  const campaign = await graphPost(`${acct}/campaigns`, {
    name: ad.name,
    objective: 'OUTCOME_TRAFFIC',
    status: 'PAUSED',
    special_ad_categories: '[]',
    access_token: token,
  });
  const adset = await graphPost(`${acct}/adsets`, {
    name: `${ad.name} — AdSet`,
    campaign_id: campaign.id,
    status: 'PAUSED',
    billing_event: 'IMPRESSIONS',
    optimization_goal: 'LINK_CLICKS',
    daily_budget: Math.round(ad.dailyBudgetInr * 100), // minor units (paise)
    destination_type: 'WEBSITE',
    promoted_object: { page_id: ad.pageId },
    targeting: { geo_locations: { countries: ['IN'] }, age_min: 18, age_max: 55 },
    access_token: token,
  });
  const creative = await graphPost(`${acct}/adcreatives`, {
    name: `${ad.name} — Creative`,
    object_story_spec: {
      page_id: ad.pageId,
      link_data: {
        message: ad.primaryText,
        link: ad.destinationUrl,
        name: ad.headline,
        description: ad.description,
        image_url: ad.imageUrl || undefined,
        call_to_action: { type: 'SHOP_NOW', value: { link: ad.destinationUrl } },
      },
    },
    access_token: token,
  });
  const adRes = await graphPost(`${acct}/ads`, {
    name: `${ad.name} — Ad`,
    adset_id: adset.id,
    creative: { creative_id: creative.id },
    status: 'PAUSED',
    access_token: token,
  });
  return { campaignId: campaign.id as string, adsetId: adset.id as string, creativeId: creative.id as string, adId: adRes.id as string };
}

export async function fetchCampaignInsights(token: string, adAccountId: string) {
  const acct = adAccountId.startsWith('act_') ? adAccountId : `act_${adAccountId}`;
  const json = await graphGet(`${acct}/insights`, {
    fields: 'campaign_id,spend,impressions,clicks,actions',
    level: 'campaign',
    date_preset: 'last_30d',
    access_token: token,
  });
  return (json?.data ?? []) as Array<{ campaign_id: string; spend: string; impressions: string; clicks: string }>;
}
