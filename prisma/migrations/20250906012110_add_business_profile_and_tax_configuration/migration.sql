-- CreateTable
CREATE TABLE "public"."business_profile" (
    "id" TEXT NOT NULL,
    "legalName" TEXT NOT NULL,
    "tradingName" TEXT,
    "registrationNumber" TEXT NOT NULL,
    "taxRegistrationNumber" TEXT,
    "businessType" TEXT NOT NULL DEFAULT 'SDN_BHD',
    "registeredAddress" JSONB NOT NULL,
    "operationalAddress" JSONB,
    "shippingAddress" JSONB,
    "primaryPhone" TEXT NOT NULL,
    "secondaryPhone" TEXT,
    "primaryEmail" TEXT NOT NULL,
    "supportEmail" TEXT,
    "website" TEXT,
    "bankName" TEXT,
    "bankAccountNumber" TEXT,
    "bankAccountHolder" TEXT,
    "businessLicense" TEXT,
    "industryCode" TEXT,
    "establishedDate" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT NOT NULL,
    "updatedBy" TEXT,

    CONSTRAINT "business_profile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."business_profile_history" (
    "id" TEXT NOT NULL,
    "businessProfileId" TEXT NOT NULL,
    "operation" TEXT NOT NULL,
    "oldValues" JSONB,
    "newValues" JSONB NOT NULL,
    "changedBy" TEXT NOT NULL,
    "changeReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "business_profile_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."tax_configuration" (
    "id" TEXT NOT NULL,
    "gstRegistered" BOOLEAN NOT NULL DEFAULT false,
    "gstNumber" TEXT,
    "sstRegistered" BOOLEAN NOT NULL DEFAULT false,
    "sstNumber" TEXT,
    "defaultGstRate" DECIMAL(5,4) NOT NULL DEFAULT 0,
    "defaultSstRate" DECIMAL(5,4) NOT NULL DEFAULT 0,
    "taxInclusivePricing" BOOLEAN NOT NULL DEFAULT true,
    "autoCalculateTax" BOOLEAN NOT NULL DEFAULT true,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "effectiveFrom" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "effectiveTo" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedBy" TEXT NOT NULL,

    CONSTRAINT "tax_configuration_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "business_profile_registrationNumber_key" ON "public"."business_profile"("registrationNumber");

-- CreateIndex
CREATE INDEX "business_profile_isActive_idx" ON "public"."business_profile"("isActive");

-- CreateIndex
CREATE INDEX "business_profile_registrationNumber_idx" ON "public"."business_profile"("registrationNumber");

-- CreateIndex
CREATE INDEX "business_profile_taxRegistrationNumber_idx" ON "public"."business_profile"("taxRegistrationNumber");

-- CreateIndex
CREATE INDEX "business_profile_history_businessProfileId_createdAt_idx" ON "public"."business_profile_history"("businessProfileId", "createdAt");

-- CreateIndex
CREATE INDEX "business_profile_history_operation_idx" ON "public"."business_profile_history"("operation");

-- CreateIndex
CREATE INDEX "business_profile_history_changedBy_idx" ON "public"."business_profile_history"("changedBy");

-- CreateIndex
CREATE UNIQUE INDEX "tax_configuration_gstNumber_key" ON "public"."tax_configuration"("gstNumber");

-- CreateIndex
CREATE UNIQUE INDEX "tax_configuration_sstNumber_key" ON "public"."tax_configuration"("sstNumber");

-- CreateIndex
CREATE INDEX "tax_configuration_isActive_idx" ON "public"."tax_configuration"("isActive");

-- CreateIndex
CREATE INDEX "tax_configuration_gstRegistered_idx" ON "public"."tax_configuration"("gstRegistered");

-- CreateIndex
CREATE INDEX "tax_configuration_sstRegistered_idx" ON "public"."tax_configuration"("sstRegistered");

-- CreateIndex
CREATE INDEX "tax_configuration_effectiveFrom_effectiveTo_idx" ON "public"."tax_configuration"("effectiveFrom", "effectiveTo");

-- AddForeignKey
ALTER TABLE "public"."business_profile_history" ADD CONSTRAINT "business_profile_history_businessProfileId_fkey" FOREIGN KEY ("businessProfileId") REFERENCES "public"."business_profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
