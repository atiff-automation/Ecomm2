'use client';

import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Menu } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ResponsiveSidebarProps {
  className?: string;
}

export function ResponsiveSidebar({ className = '' }: ResponsiveSidebarProps) {
  const [isOpen, setIsOpen] = useState(false);

  const closeMobileMenu = () => setIsOpen(false);

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <Sidebar className={className} />
      </div>

      {/* Tablet/Mobile Sidebar */}
      <div className="lg:hidden">
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="fixed top-4 left-4 z-40 lg:hidden bg-white shadow-md border"
            >
              <Menu className="h-5 w-5" />
              <span className="sr-only">Open navigation menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent
            side="left"
            className="w-80 p-0 bg-white"
          >
            <div className="h-full flex flex-col">
              <Sidebar isMobile onNavigate={closeMobileMenu} />
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}