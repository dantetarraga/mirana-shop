-- CreateEnum
CREATE TYPE "PromotionType" AS ENUM ('FREE_SHIPPING', 'FIXED_DISCOUNT', 'PERCENT_DISCOUNT');

-- CreateTable
CREATE TABLE "Promotion" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" "PromotionType" NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "minAmount" DECIMAL(10,2),
    "discountAmount" DECIMAL(10,2),
    "discountPercent" DECIMAL(5,2),
    "startsAt" TIMESTAMP(3),
    "endsAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Promotion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Promotion_type_active_idx" ON "Promotion"("type", "active");
