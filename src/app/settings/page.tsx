import { getMaskedSettings } from '@/lib/settings';
import SettingsClient from '@/components/SettingsClient';

export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
  const settings = await getMaskedSettings();
  return <SettingsClient settings={settings} />;
}
