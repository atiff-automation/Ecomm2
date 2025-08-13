/**
 * Cart Button Component - Malaysian E-commerce Platform
 * Header cart button with item count badge and cart sidebar trigger
 */

'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ShoppingCart } from 'lucide-react';
import { CartSidebar } from './CartSidebar';
import { useCartCount } from '@/hooks/use-cart';

interface CartButtonProps {
  className?: string;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'sm' | 'default' | 'lg';
}

export function CartButton({
  className = '',
  variant = 'ghost',
  size = 'default',
}: CartButtonProps) {
  const [isCartOpen, setIsCartOpen] = useState(false);
  const { count: cartCount, isLoading } = useCartCount();

  // Listen for custom event to open cart sidebar
  useEffect(() => {
    const handleOpenCart = () => {
      setIsCartOpen(true);
    };

    window.addEventListener('openCartSidebar', handleOpenCart);
    
    return () => {
      window.removeEventListener('openCartSidebar', handleOpenCart);
    };
  }, []);

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

      <CartSidebar isOpen={isCartOpen} onOpenChange={setIsCartOpen} />
    </>
  );
}
