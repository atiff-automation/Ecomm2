/**
 * Cart Button Component - Malaysian E-commerce Platform
 * Header cart button with item count badge and cart sidebar trigger
 */

'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ShoppingCart } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { CartSidebar } from './CartSidebar';

interface CartButtonProps {
  className?: string;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'sm' | 'default' | 'lg';
}

export function CartButton({ 
  className = '', 
  variant = 'ghost',
  size = 'default' 
}: CartButtonProps) {
  const { data: session } = useSession();
  const [cartCount, setCartCount] = useState(0);
  const [isCartOpen, setIsCartOpen] = useState(false);

  const isLoggedIn = !!session?.user;

  // Fetch cart count
  const fetchCartCount = async () => {
    if (!isLoggedIn) {
      setCartCount(0);
      return;
    }

    try {
      const response = await fetch('/api/cart');
      
      if (response.ok) {
        const data = await response.json();
        setCartCount(data.summary?.itemCount || 0);
      } else if (response.status === 401) {
        setCartCount(0);
      }
    } catch (error) {
      console.error('Failed to fetch cart count:', error);
    }
  };

  useEffect(() => {
    fetchCartCount();
  }, [isLoggedIn]);

  // Refresh cart count when cart sidebar opens/closes
  useEffect(() => {
    if (!isCartOpen) {
      fetchCartCount();
    }
  }, [isCartOpen]);

  return (
    <>
      <div className={`relative ${className}`}>
        <Button
          variant={variant}
          size={size}
          onClick={() => setIsCartOpen(true)}
          className="relative"
        >
          <ShoppingCart className="w-5 h-5" />
          {size !== 'sm' && <span className="ml-2 hidden sm:inline">Cart</span>}
          
          {cartCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-2 -right-2 w-5 h-5 p-0 flex items-center justify-center text-xs font-medium min-w-0"
            >
              {cartCount > 99 ? '99+' : cartCount}
            </Badge>
          )}
        </Button>
      </div>

      <CartSidebar 
        isOpen={isCartOpen} 
        onOpenChange={setIsCartOpen}
      />
    </>
  );
}