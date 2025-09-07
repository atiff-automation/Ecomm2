import { redirect } from 'next/navigation';
import { SETTINGS_CONFIG } from './settingsConfig';

export default function SettingsPage() {
  redirect(`/admin/settings/${SETTINGS_CONFIG.defaultTab}`);
}