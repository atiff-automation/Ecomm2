/**
 * FAQ Page Layout with SEO Metadata
 * /faq
 */

import { Metadata } from 'next';
import { SEOService } from '@/lib/seo/seo-service';

export const metadata: Metadata = {
  title: 'Soalan Lazim (FAQ) - JRM HOLISTIK | Jamu Ratu Malaya',
  description:
    'Jawapan kepada soalan yang sering ditanya tentang JRM HOLISTIK dan produk jamu kami. Ketahui lebih lanjut tentang produk, penghantaran, pembayaran, keahlian, dan keselamatan produk jamu kami.',
  keywords: [
    'FAQ JRM HOLISTIK',
    'soalan lazim jamu',
    'soalan tentang JRM',
    'cara order jamu',
    'penghantaran jamu Malaysia',
    'pembayaran jamu online',
    'keahlian JRM HOLISTIK',
    'produk jamu selamat',
    'jamu lulus KKM',
    'jamu halal Malaysia',
  ],
  openGraph: {
    title: 'Soalan Lazim (FAQ) - JRM HOLISTIK | Jamu Ratu Malaya',
    description:
      'Jawapan kepada soalan yang sering ditanya tentang JRM HOLISTIK dan produk jamu kami. Ketahui lebih lanjut tentang produk, penghantaran, pembayaran, keahlian, dan keselamatan produk jamu kami.',
    type: 'website',
    images: [
      {
        url: '/images/og-default.jpg',
        alt: 'Soalan Lazim JRM HOLISTIK - Jamu Ratu Malaya',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Soalan Lazim (FAQ) - JRM HOLISTIK | Jamu Ratu Malaya',
    description:
      'Jawapan kepada soalan yang sering ditanya tentang JRM HOLISTIK dan produk jamu kami.',
  },
};

export default function FAQLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
