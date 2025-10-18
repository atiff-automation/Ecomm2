import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

/**
 * GET /api/settings/membership/benefits - Get member benefits
 * Following @CLAUDE.md principles - systematic, DRY, single source of truth
 */

// Centralized member benefits configuration
const MEMBER_BENEFITS = [
  {
    id: 'exclusive-pricing',
    title: 'Exclusive Member Pricing',
    description:
      'Get special discounted prices on selected products as a member',
    isActive: true,
    icon: '💎',
  },
  {
    id: 'early-access',
    title: 'Early Access to Sales',
    description:
      'Be the first to shop new arrivals and flash sales before they go public',
    isActive: true,
    icon: '⚡',
  },
  {
    id: 'free-shipping',
    title: 'Free Shipping Perks',
    description:
      'Enjoy free shipping on orders above RM 50 (non-members: RM 100)',
    isActive: true,
    icon: '🚚',
  },
  {
    id: 'priority-support',
    title: 'Priority Customer Support',
    description:
      'Get faster response times and priority handling of your inquiries',
    isActive: true,
    icon: '🎧',
  },
  {
    id: 'birthday-rewards',
    title: 'Birthday Special Rewards',
    description: 'Receive exclusive birthday discounts and surprise gifts',
    isActive: true,
    icon: '🎂',
  },
  {
    id: 'loyalty-points',
    title: 'Enhanced Loyalty Points',
    description:
      'Earn 2x points on every purchase compared to regular customers',
    isActive: true,
    icon: '⭐',
  },
  {
    id: 'exclusive-products',
    title: 'Member-Only Products',
    description: 'Access to exclusive products and limited edition items',
    isActive: true,
    icon: '🔒',
  },
  {
    id: 'referral-bonus',
    title: 'Referral Bonuses',
    description: 'Earn RM 5 for each friend you refer who becomes a member',
    isActive: true,
    icon: '👥',
  },
] as const;

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Return centralized member benefits
    // In future, this could be enhanced to:
    // 1. Fetch from database for dynamic configuration
    // 2. Include user-specific benefit status
    // 3. Show tier-based benefits

    return NextResponse.json({
      success: true,
      data: MEMBER_BENEFITS,
    });
  } catch (error) {
    console.error('Get member benefits error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
