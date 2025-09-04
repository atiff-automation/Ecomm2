/**
 * User Notifications Layout
 * MULTI-TENANT: User-scoped notification management layout
 * FOLLOWS @CLAUDE.md: NO HARDCODE | DRY | SINGLE SOURCE OF TRUTH
 */

import { ReactNode } from 'react';

interface LayoutProps {
  children: ReactNode;
}

export default function UserNotificationsLayout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <main>
        {children}
      </main>
    </div>
  );
}