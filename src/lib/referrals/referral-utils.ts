/**
 * Member Referral System Utilities - Malaysian E-commerce Platform
 * Comprehensive referral tracking and reward management
 */

import { prisma } from '@/lib/db/prisma';
import { MemberReferral, ReferralStatus, ReferralRewardType, RewardStatus } from '@prisma/client';

interface ReferralCode {
  code: string;
  userId: string;
}

interface ReferralMetrics {
  totalReferrals: number;
  successfulReferrals: number;
  pendingReferrals: number;
  totalRewards: number;
  conversionRate: number;
}

interface ReferralWithDetails extends MemberReferral {
  referrer: {
    id: string;
    name: string;
    email: string;
  };
  referred?: {
    id: string;
    name: string;
    email: string;
  } | null;
}

/**
 * Generate unique referral code for a user
 */
export async function generateReferralCode(userId: string, userName: string): Promise<string> {
  const baseCode = userName
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .substring(0, 6)
    .padEnd(6, '0');
  
  let counter = 1;
  let code = baseCode;
  
  // Ensure uniqueness
  while (await prisma.memberReferral.findUnique({ where: { referralCode: code } })) {
    code = `${baseCode}${counter.toString().padStart(2, '0')}`;
    counter++;
  }
  
  return code;
}

/**
 * Create a new referral
 */
export async function createReferral(
  referrerId: string,
  referredEmail: string,
  referralCode?: string
): Promise<MemberReferral> {
  // Get referrer info for code generation if needed
  if (!referralCode) {
    const referrer = await prisma.user.findUnique({
      where: { id: referrerId },
      select: { name: true }
    });
    
    if (!referrer) {
      throw new Error('Referrer not found');
    }
    
    referralCode = await generateReferralCode(referrerId, referrer.name || 'USER');
  }
  
  const referral = await prisma.memberReferral.create({
    data: {
      referrerId,
      referredEmail,
      referralCode,
      status: ReferralStatus.PENDING,
    }
  });
  
  return referral;
}

/**
 * Process referral when referred user registers
 */
export async function processReferralRegistration(
  email: string,
  newUserId: string
): Promise<MemberReferral | null> {
  const referral = await prisma.memberReferral.findFirst({
    where: {
      referredEmail: email,
      status: ReferralStatus.PENDING,
    }
  });
  
  if (!referral) {
    return null;
  }
  
  // Update referral with registered user info
  const updatedReferral = await prisma.memberReferral.update({
    where: { id: referral.id },
    data: {
      referredId: newUserId,
      status: ReferralStatus.REGISTERED,
      registeredDate: new Date(),
    }
  });
  
  return updatedReferral;
}

/**
 * Process referral completion when referred user makes qualifying order
 */
export async function processReferralCompletion(
  userId: string,
  orderAmount: number
): Promise<MemberReferral | null> {
  // Get referral settings
  const settings = await getReferralSettings();
  if (!settings.isActive || orderAmount < settings.minimumOrderAmount) {
    return null;
  }
  
  const referral = await prisma.memberReferral.findFirst({
    where: {
      referredId: userId,
      status: ReferralStatus.REGISTERED,
    }
  });
  
  if (!referral) {
    return null;
  }
  
  // Update referral status and metrics
  const updatedReferral = await prisma.memberReferral.update({
    where: { id: referral.id },
    data: {
      status: ReferralStatus.COMPLETED,
      firstOrderDate: new Date(),
      firstOrderAmount: orderAmount,
      totalOrderAmount: orderAmount,
      totalOrders: 1,
      rewardedDate: new Date(),
    }
  });
  
  // Create rewards for both referrer and referee
  await createReferralRewards(updatedReferral.id, settings);
  
  return updatedReferral;
}

/**
 * Create referral rewards based on settings
 */
export async function createReferralRewards(
  referralId: string,
  settings?: any
): Promise<void> {
  const referralSettings = settings || await getReferralSettings();
  const referral = await prisma.memberReferral.findUnique({
    where: { id: referralId },
    include: {
      referrer: true,
      referred: true,
    }
  });
  
  if (!referral || !referral.referred) {
    return;
  }
  
  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() + referralSettings.rewardExpiryDays);
  
  // Create referrer reward
  await prisma.referralReward.create({
    data: {
      userId: referral.referrerId,
      referralId: referralId,
      rewardType: referralSettings.referrerRewardType,
      rewardAmount: referralSettings.referrerRewardAmount,
      status: RewardStatus.PENDING,
      description: `Referral reward for bringing in ${referral.referred.name}`,
      expiresAt: expiryDate,
    }
  });
  
  // Create referee reward
  await prisma.referralReward.create({
    data: {
      userId: referral.referredId!,
      referralId: referralId,
      rewardType: referralSettings.refereeRewardType,
      rewardAmount: referralSettings.refereeRewardAmount,
      status: RewardStatus.PENDING,
      description: `Welcome reward for joining through ${referral.referrer.name}'s referral`,
      expiresAt: expiryDate,
    }
  });
}

/**
 * Get user's referral metrics
 */
export async function getUserReferralMetrics(userId: string): Promise<ReferralMetrics> {
  const referrals = await prisma.memberReferral.findMany({
    where: { referrerId: userId },
    include: {
      rewards: true,
    }
  });
  
  const totalReferrals = referrals.length;
  const successfulReferrals = referrals.filter(r => r.status === ReferralStatus.COMPLETED).length;
  const pendingReferrals = referrals.filter(r => r.status === ReferralStatus.PENDING).length;
  const totalRewards = referrals.reduce((sum, r) => {
    const userRewards = r.rewards.filter(reward => reward.userId === userId);
    return sum + userRewards.reduce((rewardSum, reward) => rewardSum + Number(reward.rewardAmount), 0);
  }, 0);
  
  const conversionRate = totalReferrals > 0 ? (successfulReferrals / totalReferrals) * 100 : 0;
  
  return {
    totalReferrals,
    successfulReferrals,
    pendingReferrals,
    totalRewards,
    conversionRate,
  };
}

/**
 * Get user's referral history with details
 */
export async function getUserReferralHistory(
  userId: string,
  page: number = 1,
  limit: number = 10
): Promise<{ referrals: ReferralWithDetails[]; total: number; pages: number }> {
  const skip = (page - 1) * limit;
  
  const [referrals, total] = await Promise.all([
    prisma.memberReferral.findMany({
      where: { referrerId: userId },
      include: {
        referrer: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        },
        referred: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.memberReferral.count({
      where: { referrerId: userId },
    })
  ]);
  
  const pages = Math.ceil(total / limit);
  
  return { referrals, total, pages };
}

/**
 * Get user's referral rewards
 */
export async function getUserReferralRewards(
  userId: string,
  status?: RewardStatus
): Promise<any[]> {
  const where: any = { userId };
  if (status) {
    where.status = status;
  }
  
  const rewards = await prisma.referralReward.findMany({
    where,
    include: {
      referral: {
        include: {
          referred: {
            select: {
              name: true,
              email: true,
            }
          }
        }
      }
    },
    orderBy: { createdAt: 'desc' },
  });
  
  return rewards;
}

/**
 * Get referral settings
 */
export async function getReferralSettings(): Promise<any> {
  const settings = await prisma.referralSetting.findFirst({
    orderBy: { updatedAt: 'desc' }
  });
  
  // Default settings if none exist
  return settings || {
    referrerRewardType: ReferralRewardType.DISCOUNT_CODE,
    referrerRewardAmount: 10,
    refereeRewardType: ReferralRewardType.DISCOUNT_CODE,
    refereeRewardAmount: 10,
    minimumOrderAmount: 50,
    rewardExpiryDays: 30,
    maxReferralsPerMember: null,
    isActive: true,
  };
}

/**
 * Update referral settings (Admin only)
 */
export async function updateReferralSettings(
  settings: any,
  updatedBy: string
): Promise<any> {
  const updatedSettings = await prisma.referralSetting.create({
    data: {
      ...settings,
      updatedBy,
    }
  });
  
  return updatedSettings;
}

/**
 * Generate referral URL for sharing
 */
export function generateReferralUrl(referralCode: string, baseUrl: string = process.env.NEXTAUTH_URL || 'http://localhost:3000'): string {
  return `${baseUrl}/join?ref=${referralCode}`;
}

/**
 * Validate referral code
 */
export async function validateReferralCode(code: string): Promise<MemberReferral | null> {
  const referral = await prisma.memberReferral.findUnique({
    where: { referralCode: code },
    include: {
      referrer: {
        select: {
          id: true,
          name: true,
          email: true,
        }
      }
    }
  });
  
  return referral;
}

/**
 * Track referral click/visit (optional enhancement)
 */
export async function trackReferralVisit(referralCode: string, ipAddress?: string): Promise<void> {
  // This could be implemented to track referral link clicks
  // For now, we'll just log it
  console.log(`Referral visit tracked: ${referralCode} from ${ipAddress}`);
}

/**
 * Process referral order completion when referred user makes their first qualifying order
 */
export async function processReferralOrderCompletion(userId: string, orderAmount: number): Promise<void> {
  // Get referral settings
  const settings = await getReferralSettings();
  
  // Check if order meets minimum amount requirement
  if (orderAmount < settings.minimumOrderAmount) {
    return;
  }
  
  // Find pending referral for this user (as referred user)
  const referral = await prisma.memberReferral.findFirst({
    where: {
      referredId: userId,
      status: ReferralStatus.REGISTERED,
    },
    include: {
      referrer: true,
      referred: true,
    }
  });
  
  if (!referral) {
    return; // No pending referral found
  }
  
  // Update referral status to completed
  await prisma.memberReferral.update({
    where: { id: referral.id },
    data: {
      status: ReferralStatus.COMPLETED,
      firstOrderDate: new Date(),
      firstOrderAmount: orderAmount,
      totalOrderAmount: orderAmount,
      totalOrders: 1,
      rewardedDate: new Date(),
    }
  });
  
  // Create rewards for both referrer and referee
  await createReferralRewards(referral.id, settings);
  
  console.log('Referral completed:', {
    referralId: referral.id,
    referrerId: referral.referrerId,
    referredId: referral.referredId,
    orderAmount,
  });
}