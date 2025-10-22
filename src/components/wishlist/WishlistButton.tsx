/**
 * Wishlist Button Component - Malaysian E-commerce Platform
 * Toggle button for adding/removing products from wishlist
 */

'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Heart } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { cn } from '@/lib/utils';
import { fetchWithCSRF } from '@/lib/utils/fetch-with-csrf';

interface WishlistButtonProps {
  productId: string;
  className?: string;
  size?: 'sm' | 'default' | 'lg';
  variant?: 'default' | 'outline' | 'ghost' | 'secondary';
  showText?: boolean;
  initialInWishlist?: boolean;
  onWishlistChange?: (inWishlist: boolean) => void;
}

export function WishlistButton({
  productId,
  className = '',
  size = 'default',
  variant = 'ghost',
  showText = false,
  initialInWishlist = false,
  onWishlistChange,
}: WishlistButtonProps) {
  const { data: session } = useSession();
  const [inWishlist, setInWishlist] = useState(initialInWishlist);
  const [loading, setLoading] = useState(false);

  const isLoggedIn = !!session?.user;

  // Check if product is in wishlist on mount
  useEffect(() => {
    const checkWishlistStatus = async () => {
      if (!isLoggedIn) {
        setInWishlist(false);
        return;
      }

      try {
        const response = await fetch('/api/wishlist');
        if (response.ok) {
          const data = await response.json();
          const isInWishlist = data.items.some(
            (item: any) => item.product.id === productId
          );
          setInWishlist(isInWishlist);
        }
      } catch (error) {
        console.error('Error checking wishlist status:', error);
      }
    };

    checkWishlistStatus();
  }, [isLoggedIn, productId]);

  const toggleWishlist = async () => {
    if (!isLoggedIn) {
      // Redirect to login or show login modal
      window.location.href = '/auth/signin';
      return;
    }

    try {
      setLoading(true);

      if (inWishlist) {
        // Remove from wishlist
        const response = await fetchWithCSRF('/api/wishlist', {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ productId }),
        });

        if (response.ok) {
          setInWishlist(false);
          onWishlistChange?.(false);
        } else {
          const data = await response.json();
          alert(data.message || 'Failed to remove from wishlist');
        }
      } else {
        // Add to wishlist
        const response = await fetchWithCSRF('/api/wishlist', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ productId }),
        });

        if (response.ok) {
          setInWishlist(true);
          onWishlistChange?.(true);
        } else {
          const data = await response.json();
          if (
            response.status === 400 &&
            data.message.includes('already in wishlist')
          ) {
            setInWishlist(true);
            onWishlistChange?.(true);
          } else {
            alert(data.message || 'Failed to add to wishlist');
          }
        }
      }
    } catch (error) {
      console.error('Error toggling wishlist:', error);
      alert('Failed to update wishlist');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={toggleWishlist}
      disabled={loading}
      className={cn(
        'transition-colors',
        inWishlist && 'text-red-500 hover:text-red-600',
        className
      )}
      title={inWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
    >
      <Heart
        className={cn(
          'w-4 h-4',
          inWishlist && 'fill-current',
          showText && 'mr-2'
        )}
      />
      {showText && (
        <span>
          {loading
            ? 'Updating...'
            : inWishlist
              ? 'Remove from Wishlist'
              : 'Add to Wishlist'}
        </span>
      )}
    </Button>
  );
}
