import { redirect } from 'next/navigation';

export default function SiteCustomizationRedirect() {
  redirect('/admin/settings/site-customization');
}