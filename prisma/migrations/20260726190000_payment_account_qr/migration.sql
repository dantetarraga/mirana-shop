-- Código QR opcional por método de pago (Yape / Plin). Lleva default '', así
-- que las cuentas existentes quedan sin QR y el checkout las sigue mostrando
-- exactamente igual que hasta ahora.

-- AlterTable
ALTER TABLE `PaymentAccount`
    ADD COLUMN `qrImageUrl` VARCHAR(191) NOT NULL DEFAULT '';
