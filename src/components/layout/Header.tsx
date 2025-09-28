/**
 * Header Component - Malaysian E-commerce Platform
 * Main navigation header with cart, user menu, and search
 */

'use client';

import React, { useState, useEffect } from 'react';
import { LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  Menu,
  User,
  LogOut,
  Settings,
  Package,
  Heart,
  Award,
  Search,
  UserPlus,
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/hooks/use-auth';
import { SearchBar } from '@/components/search/SearchBar';
import { CartButton } from '@/components/cart/CartButton';

interface SiteCustomization {
  branding: {
    logo?: {
      url: string;
      width: number;
      height: number;
    };
    favicon?: {
      url: string;
    };
  } | null;
}

interface NavigationItem {
  href: string;
  label: string;
  icon?: LucideIcon;
}

export function Header() {
  const { isLoggedIn, isMember, isLoading, signOut, user } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [siteCustomization, setSiteCustomization] = useState<SiteCustomization | null>(null);

  // Fetch site customization data
  useEffect(() => {
    const fetchSiteCustomization = async () => {
      try {
        const response = await fetch('/api/site-customization/current');
        if (response.ok) {
          const data = await response.json();
          setSiteCustomization(data);
        }
      } catch (error) {
        console.error('Error fetching site customization:', error);
      }
    };

    fetchSiteCustomization();
  }, []);

  const skipToContent = () => {
    const target = document.getElementById('main-content');
    if (target) {
      target.focus();
      target.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/' });
  };

  const navigationItems: NavigationItem[] = [
    { href: '/products', label: 'Products' },
    { href: '/deals', label: 'Deals' },
    { href: '/track-order', label: 'Track Order' },
    { href: '/apply-agent', label: 'Apply as Agent', icon: UserPlus },
  ];

  return (
    <div>
      {/* Skip to main content link */}
      <a
        href="#main-content"
        onClick={e => {
          e.preventDefault();
          skipToContent();
        }}
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md focus:shadow-lg"
      >
        Skip to main content
      </a>

      <header
        className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
        role="banner"
      >
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            {/* Logo and Brand */}
            <div className="flex items-center gap-4">
              <Link
                href="/"
                className="flex items-center space-x-2 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-md"
                aria-label="JRM E-commerce - Go to homepage"
              >
                {siteCustomization?.branding?.logo ? (
                  <Image
                    src={siteCustomization.branding.logo.url}
                    alt="JRM E-commerce Logo"
                    width={siteCustomization.branding.logo.width}
                    height={siteCustomization.branding.logo.height}
                    className="max-h-10 w-auto"
                    priority
                  />
                ) : (
                  <>
                    <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                      <span
                        className="text-white font-bold text-sm"
                        aria-hidden="true"
                      >
                        JRM
                      </span>
                    </div>
                    <span className="hidden sm:inline-block font-bold text-xl">
                      E-commerce
                    </span>
                  </>
                )}
              </Link>

              {/* Desktop Navigation */}
              <nav
                className="hidden md:flex items-center space-x-6 ml-6"
                role="navigation"
                aria-label="Main navigation"
              >
                {navigationItems.map(item => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="text-sm font-medium transition-colors hover:text-primary focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-sm px-2 py-1 flex items-center gap-1"
                  >
                    {item.icon && <item.icon className="w-4 h-4" />}
                    {item.label}
                  </Link>
                ))}
              </nav>
            </div>

            {/* Search Bar - Desktop */}
            <div className="hidden lg:flex flex-1 max-w-md mx-8">
              <SearchBar placeholder="Search products..." className="w-full" />
            </div>

            {/* Right Section */}
            <div className="flex items-center gap-2">
              {/* Search Button - Mobile */}
              <Link href="/search" className="lg:hidden">
                <Button variant="ghost" size="sm" aria-label="Search products">
                  <Search className="w-5 h-5" aria-hidden="true" />
                  <span className="sr-only">Search</span>
                </Button>
              </Link>

              {/* Cart Button - only for non-admin users */}
              {(!isLoggedIn ||
                (user?.role !== 'ADMIN' && user?.role !== 'STAFF')) && (
                <CartButton />
              )}

              {/* User Menu */}
              {isLoggedIn && !isLoading ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      className="relative h-8 w-8 rounded-full"
                      aria-label={`User menu for ${user?.name || 'user'}`}
                      aria-expanded={false}
                      aria-haspopup="menu"
                    >
                      <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-primary-foreground">
                          {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                        </span>
                      </div>
                      {isMember && (
                        <Badge
                          variant="secondary"
                          className="absolute -top-1 -right-1 w-4 h-4 p-0 flex items-center justify-center"
                        >
                          <Award className="w-2 h-2" />
                        </Badge>
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" forceMount>
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">
                          {user?.name}
                        </p>
                        <p className="text-xs leading-none text-muted-foreground">
                          {user?.email}
                        </p>
                        {isMember && (
                          <Badge variant="secondary" className="w-fit text-xs">
                            <Award className="w-3 h-3 mr-1" />
                            Member
                          </Badge>
                        )}
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />

                    {/* Customer navigation - only for non-admin users */}
                    {user?.role !== 'ADMIN' && user?.role !== 'STAFF' && (
                      <>
                        <DropdownMenuItem asChild>
                          <Link href="/member/dashboard">
                            <User className="mr-2 h-4 w-4" />
                            <span>Dashboard</span>
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href="/member/orders">
                            <Package className="mr-2 h-4 w-4" />
                            <span>Orders</span>
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href="/member/wishlist">
                            <Heart className="mr-2 h-4 w-4" />
                            <span>Wishlist</span>
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href="/member/profile">
                            <Settings className="mr-2 h-4 w-4" />
                            <span>Profile</span>
                          </Link>
                        </DropdownMenuItem>
                      </>
                    )}

                    {/* Admin/Staff navigation */}
                    {(user?.role === 'ADMIN' || user?.role === 'STAFF') && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                          <Link href="/admin/dashboard">
                            <Settings className="mr-2 h-4 w-4" />
                            <span>Admin Panel</span>
                          </Link>
                        </DropdownMenuItem>
                      </>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleSignOut}>
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Sign out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <div className="flex items-center gap-2">
                  {isLoading && (
                    <div className="w-6 h-6 bg-muted animate-pulse rounded-full mr-2" />
                  )}
                  <Link href="/auth/signin">
                    <Button variant="ghost" size="sm">
                      Sign In
                    </Button>
                  </Link>
                  <Link href="/auth/signup">
                    <Button size="sm">Sign Up</Button>
                  </Link>
                </div>
              )}

              {/* Mobile Menu */}
              <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" className="md:hidden" size="sm">
                    <Menu className="h-5 w-5" />
                    <span className="sr-only">Toggle menu</span>
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[300px] sm:w-[400px]">
                  <SheetHeader>
                    <SheetTitle>Menu</SheetTitle>
                    <SheetDescription>
                      Navigate through our store
                    </SheetDescription>
                  </SheetHeader>
                  <div className="grid gap-4 py-4">
                    {/* Search Bar - Mobile */}
                    <div className="lg:hidden">
                      <SearchBar
                        placeholder="Search products..."
                        className="w-full"
                      />
                    </div>

                    {/* Navigation Links */}
                    <div className="grid gap-2">
                      {navigationItems.map(item => (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setIsMobileMenuOpen(false)}
                          className="flex items-center gap-2 px-3 py-2 text-sm font-medium transition-colors hover:bg-muted rounded-md"
                        >
                          {item.icon && <item.icon className="w-4 h-4" />}
                          {item.label}
                        </Link>
                      ))}
                    </div>

                    {/* User Section */}
                    {isLoggedIn ? (
                      <div className="border-t pt-4 mt-4">
                        <div className="px-3 py-2 text-sm">
                          <p className="font-medium">{user?.name}</p>
                          <p className="text-muted-foreground">{user?.email}</p>
                          {isMember && (
                            <Badge variant="secondary" className="mt-1 text-xs">
                              <Award className="w-3 h-3 mr-1" />
                              Member
                            </Badge>
                          )}
                        </div>
                        <div className="grid gap-1 mt-2">
                          <Link
                            href="/member/dashboard"
                            onClick={() => setIsMobileMenuOpen(false)}
                            className="flex items-center px-3 py-2 text-sm font-medium transition-colors hover:bg-muted rounded-md"
                          >
                            <User className="mr-2 h-4 w-4" />
                            Dashboard
                          </Link>
                          <Link
                            href="/member/orders"
                            onClick={() => setIsMobileMenuOpen(false)}
                            className="flex items-center px-3 py-2 text-sm font-medium transition-colors hover:bg-muted rounded-md"
                          >
                            <Package className="mr-2 h-4 w-4" />
                            Orders
                          </Link>
                          <Link
                            href="/member/wishlist"
                            onClick={() => setIsMobileMenuOpen(false)}
                            className="flex items-center px-3 py-2 text-sm font-medium transition-colors hover:bg-muted rounded-md"
                          >
                            <Heart className="mr-2 h-4 w-4" />
                            Wishlist
                          </Link>
                          <Link
                            href="/member/profile"
                            onClick={() => setIsMobileMenuOpen(false)}
                            className="flex items-center px-3 py-2 text-sm font-medium transition-colors hover:bg-muted rounded-md"
                          >
                            <Settings className="mr-2 h-4 w-4" />
                            Profile
                          </Link>
                          {(user?.role === 'ADMIN' ||
                            user?.role === 'STAFF') && (
                            <Link
                              href="/admin/dashboard"
                              onClick={() => setIsMobileMenuOpen(false)}
                              className="flex items-center px-3 py-2 text-sm font-medium transition-colors hover:bg-muted rounded-md"
                            >
                              <Settings className="mr-2 h-4 w-4" />
                              Admin Panel
                            </Link>
                          )}
                          <button
                            onClick={handleSignOut}
                            className="flex items-center px-3 py-2 text-sm font-medium transition-colors hover:bg-muted rounded-md w-full text-left"
                          >
                            <LogOut className="mr-2 h-4 w-4" />
                            Sign out
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="border-t pt-4 mt-4 grid gap-2">
                        <Link
                          href="/auth/signin"
                          onClick={() => setIsMobileMenuOpen(false)}
                        >
                          <Button variant="outline" className="w-full">
                            Sign In
                          </Button>
                        </Link>
                        <Link
                          href="/auth/signup"
                          onClick={() => setIsMobileMenuOpen(false)}
                        >
                          <Button className="w-full">Sign Up</Button>
                        </Link>
                      </div>
                    )}
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </header>
    </div>
  );
}
