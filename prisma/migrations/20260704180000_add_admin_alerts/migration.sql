-- CreateEnum
CREATE TYPE "AdminAlertType" AS ENUM ('LOW_STOCK', 'PENDING_ORDERS', 'PROMO_EXPIRING', 'DAILY_SUMMARY');

-- CreateTable
CREATE TABLE "AdminAlert" (
    "id" TEXT NOT NULL,
    "type" "AdminAlertType" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminAlert_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AdminAlert_readAt_createdAt_idx" ON "AdminAlert"("readAt", "createdAt");
