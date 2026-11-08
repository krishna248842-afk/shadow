import { getMaskedSettings, getSetting } from '@/lib/settings';
import ConnectorsClient from '@/components/ConnectorsClient';

export const dynamic = 'force-dynamic';

export default async function ConnectorsPage({ searchParams }: { searchParams: Promise<{ yt?: string; msg?: string }> }) {
  const params = await searchParams;
  const settings = await getMaskedSettings();
  const base = process.env.APP_BASE_URL || 'http://localhost:3000';
  const webhookBase = base.replace(/\/+$/, '');
  const youtubeCallback = `${webhookBase}/api/youtube/callback`;
  const waWebhook = `${webhookBase}/api/webhooks/whatsapp`;
  const rzpWebhook = `${webhookBase}/api/webhooks/razorpay`;
  const waVerifyToken = process.env.WHATSAPP_VERIFY_TOKEN || 'shadow-verify-token';
  const ytChannel = await getSetting('youtube_channel_name');
  return (
    <ConnectorsClient
      settings={settings}
      youtubeCallback={youtubeCallback}
      waWebhook={waWebhook}
      rzpWebhook={rzpWebhook}
      waVerifyToken={waVerifyToken}
      ytChannel={ytChannel}
      ytStatus={params.yt ?? ''}
      ytError={params.msg ?? ''}
    />
  );
}
