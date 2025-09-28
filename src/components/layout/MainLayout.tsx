/**
 * Main Layout Component - JRM E-commerce Platform
 * Handles conditional header rendering based on routes
 */

'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { Header } from './Header';
import { Footer } from './Footer';

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const pathname = usePathname();

  // Hide header and footer on admin routes, auth pages, and member dashboard
  const hideHeaderFooterRoutes = ['/admin', '/auth', '/member', '/superadmin'];

  const shouldHideHeaderFooter = hideHeaderFooterRoutes.some(route =>
    pathname.startsWith(route)
  );

  return (
    <>
      {!shouldHideHeaderFooter && <Header />}
      <main>{children}</main>
      {!shouldHideHeaderFooter && <Footer />}
    </>
  );
}
