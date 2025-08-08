-- CreateEnum
CREATE TYPE "public"."ReferralStatus" AS ENUM ('PENDING', 'REGISTERED', 'COMPLETED', 'EXPIRED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "public"."ReferralRewardType" AS ENUM ('DISCOUNT_CODE', 'STORE_CREDIT', 'CASH_REWARD', 'FREE_SHIPPING', 'PRODUCT_DISCOUNT');

-- CreateEnum
CREATE TYPE "public"."RewardStatus" AS ENUM ('PENDING', 'ISSUED', 'USED', 'EXPIRED', 'CANCELLED');

-- CreateTable
CREATE TABLE "public"."member_referrals" (
    "id" TEXT NOT NULL,
    "referrerId" TEXT NOT NULL,
    "referredId" TEXT,
    "referralCode" TEXT NOT NULL,
    "referredEmail" TEXT,
    "status" "public"."ReferralStatus" NOT NULL DEFAULT 'PENDING',
    "referrerRewardType" "public"."ReferralRewardType",
    "referrerRewardAmount" DECIMAL(10,2),
    "referrerRewardStatus" "public"."RewardStatus" NOT NULL DEFAULT 'PENDING',
    "refereeRewardType" "public"."ReferralRewardType",
    "referreeRewardAmount" DECIMAL(10,2),
    "refereeRewardStatus" "public"."RewardStatus" NOT NULL DEFAULT 'PENDING',
    "firstOrderDate" TIMESTAMP(3),
    "firstOrderAmount" DECIMAL(10,2),
    "totalOrderAmount" DECIMAL(15,2) DEFAULT 0,
    "totalOrders" INTEGER NOT NULL DEFAULT 0,
    "referralDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "registeredDate" TIMESTAMP(3),
    "rewardedDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "member_referrals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."referral_rewards" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "referralId" TEXT NOT NULL,
    "rewardType" "public"."ReferralRewardType" NOT NULL,
    "rewardAmount" DECIMAL(10,2) NOT NULL,
    "status" "public"."RewardStatus" NOT NULL DEFAULT 'PENDING',
    "description" TEXT,
    "processedBy" TEXT,
    "processedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "referral_rewards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."referral_settings" (
    "id" TEXT NOT NULL,
    "referrerRewardType" "public"."ReferralRewardType" NOT NULL DEFAULT 'DISCOUNT_CODE',
    "referrerRewardAmount" DECIMAL(10,2) NOT NULL DEFAULT 10,
    "refereeRewardType" "public"."ReferralRewardType" NOT NULL DEFAULT 'DISCOUNT_CODE',
    "refereeRewardAmount" DECIMAL(10,2) NOT NULL DEFAULT 10,
    "minimumOrderAmount" DECIMAL(10,2) NOT NULL DEFAULT 50,
    "rewardExpiryDays" INTEGER NOT NULL DEFAULT 30,
    "maxReferralsPerMember" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "updatedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "referral_settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "member_referrals_referralCode_key" ON "public"."member_referrals"("referralCode");

-- CreateIndex
CREATE INDEX "member_referrals_referrerId_idx" ON "public"."member_referrals"("referrerId");

-- CreateIndex
CREATE INDEX "member_referrals_referredId_idx" ON "public"."member_referrals"("referredId");

-- CreateIndex
CREATE INDEX "member_referrals_referralCode_idx" ON "public"."member_referrals"("referralCode");

-- CreateIndex
CREATE INDEX "member_referrals_status_idx" ON "public"."member_referrals"("status");

-- CreateIndex
CREATE INDEX "member_referrals_referralDate_idx" ON "public"."member_referrals"("referralDate");

-- CreateIndex
CREATE INDEX "referral_rewards_userId_idx" ON "public"."referral_rewards"("userId");

-- CreateIndex
CREATE INDEX "referral_rewards_referralId_idx" ON "public"."referral_rewards"("referralId");

-- CreateIndex
CREATE INDEX "referral_rewards_status_idx" ON "public"."referral_rewards"("status");

-- CreateIndex
CREATE INDEX "referral_rewards_expiresAt_idx" ON "public"."referral_rewards"("expiresAt");

-- AddForeignKey
ALTER TABLE "public"."member_referrals" ADD CONSTRAINT "member_referrals_referrerId_fkey" FOREIGN KEY ("referrerId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."member_referrals" ADD CONSTRAINT "member_referrals_referredId_fkey" FOREIGN KEY ("referredId") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."referral_rewards" ADD CONSTRAINT "referral_rewards_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."referral_rewards" ADD CONSTRAINT "referral_rewards_referralId_fkey" FOREIGN KEY ("referralId") REFERENCES "public"."member_referrals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."referral_rewards" ADD CONSTRAINT "referral_rewards_processedBy_fkey" FOREIGN KEY ("processedBy") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."referral_settings" ADD CONSTRAINT "referral_settings_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
