/**
 * Main Layout Component - JRM E-commerce Platform
 * Handles conditional header rendering based on routes
 */

'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { Header } from './Header';

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const pathname = usePathname();

  // Hide header on admin routes, auth pages, and member dashboard
  const hideHeaderRoutes = ['/admin', '/auth', '/member', '/superadmin'];

  const shouldHideHeader = hideHeaderRoutes.some(route =>
    pathname.startsWith(route)
  );

  return (
    <>
      {!shouldHideHeader && <Header />}
      <main>{children}</main>
    </>
  );
}
