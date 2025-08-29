-- CreateTable
CREATE TABLE "public"."malaysian_states" (
    "id" VARCHAR(3) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "malaysian_states_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."malaysian_postcodes" (
    "id" TEXT NOT NULL,
    "postcode" VARCHAR(5) NOT NULL,
    "district" VARCHAR(100) NOT NULL,
    "stateCode" VARCHAR(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "malaysian_postcodes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "malaysian_postcodes_postcode_idx" ON "public"."malaysian_postcodes"("postcode");

-- CreateIndex
CREATE INDEX "malaysian_postcodes_district_idx" ON "public"."malaysian_postcodes"("district");

-- CreateIndex
CREATE INDEX "malaysian_postcodes_stateCode_idx" ON "public"."malaysian_postcodes"("stateCode");

-- CreateIndex
CREATE UNIQUE INDEX "malaysian_postcodes_postcode_district_key" ON "public"."malaysian_postcodes"("postcode", "district");

-- AddForeignKey
ALTER TABLE "public"."malaysian_postcodes" ADD CONSTRAINT "malaysian_postcodes_stateCode_fkey" FOREIGN KEY ("stateCode") REFERENCES "public"."malaysian_states"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
