import { redirect } from 'next/navigation';

// Redirect to account settings by default
export default function SettingsPage() {
  redirect('/settings/account');
}
