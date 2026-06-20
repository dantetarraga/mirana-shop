/*
  Warnings:

  - The values [CULQI_CARD,CULQI_YAPE] on the enum `PaymentMethod` will be removed.
    Culqi ya no se usa: el único método de pago es WHATSAPP_TRANSFER (flujo manual).
  - You are about to drop the column `culqiOrderId` on the `Payment` table.
  - You are about to drop the column `culqiChargeId` on the `Payment` table.
  - You are about to drop the column `culqiEventId` on the `Payment` table.
  - You are about to drop the column `culqiQrUrl` on the `Payment` table.
  - You are about to drop the column `culqiPeUrl` on the `Payment` table.
  - You are about to drop the column `rawResponse` on the `Payment` table.
  - You are about to drop the column `depositCulqiChargeId` on the `Preorder` table.
  - You are about to drop the `IdempotencyKey` table. It existed only to deduplicate Culqi charge retries.

*/
-- AlterTable
ALTER TABLE "Payment" DROP COLUMN "culqiOrderId",
DROP COLUMN "culqiChargeId",
DROP COLUMN "culqiEventId",
DROP COLUMN "culqiQrUrl",
DROP COLUMN "culqiPeUrl",
DROP COLUMN "rawResponse";

-- AlterTable
ALTER TABLE "Preorder" DROP COLUMN "depositCulqiChargeId";

-- DropTable
DROP TABLE "IdempotencyKey";

-- AlterEnum — Postgres no soporta quitar valores de un enum directamente:
-- se recrea el tipo sin CULQI_CARD/CULQI_YAPE y se migran las columnas.
CREATE TYPE "PaymentMethod_new" AS ENUM ('WHATSAPP_TRANSFER');
ALTER TABLE "Order" ALTER COLUMN "paymentMethod" TYPE "PaymentMethod_new" USING ("paymentMethod"::text::"PaymentMethod_new");
ALTER TABLE "Payment" ALTER COLUMN "method" TYPE "PaymentMethod_new" USING ("method"::text::"PaymentMethod_new");
ALTER TABLE "Preorder" ALTER COLUMN "depositMethod" TYPE "PaymentMethod_new" USING ("depositMethod"::text::"PaymentMethod_new");
DROP TYPE "PaymentMethod";
ALTER TYPE "PaymentMethod_new" RENAME TO "PaymentMethod";
