'use client';

import React from 'react';

interface ChatLayoutProps {
  children: React.ReactNode;
}

export default function ChatLayout({ children }: ChatLayoutProps) {
  // Simplified layout - AdminPageLayout now handles navigation and header
  return children;
}
