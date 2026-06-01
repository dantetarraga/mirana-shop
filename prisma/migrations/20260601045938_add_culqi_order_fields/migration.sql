/*
  Warnings:

  - A unique constraint covering the columns `[culqiOrderId]` on the table `Payment` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Payment" ADD COLUMN     "culqiOrderId" TEXT,
ADD COLUMN     "culqiPeUrl" TEXT,
ADD COLUMN     "culqiQrUrl" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Payment_culqiOrderId_key" ON "Payment"("culqiOrderId");
