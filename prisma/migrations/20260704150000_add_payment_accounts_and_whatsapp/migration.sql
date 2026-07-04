-- AlterTable
ALTER TABLE "StoreSettings" ADD COLUMN     "whatsappNumber" TEXT NOT NULL DEFAULT '';

-- CreateTable
CREATE TABLE "PaymentAccount" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "holder" TEXT NOT NULL DEFAULT '',
    "number" TEXT NOT NULL,
    "cci" TEXT NOT NULL DEFAULT '',
    "position" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PaymentAccount_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PaymentAccount_active_position_idx" ON "PaymentAccount"("active", "position");
