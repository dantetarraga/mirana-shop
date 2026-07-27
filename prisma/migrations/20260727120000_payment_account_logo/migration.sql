-- Logo opcional por método de pago (Yape, BCP, Interbank...). Lleva default '',
-- así que los métodos existentes quedan sin logo y siguen mostrando el ícono
-- genérico de siempre, tanto en el admin como en el checkout.

-- AlterTable
ALTER TABLE `PaymentAccount`
    ADD COLUMN `logoUrl` VARCHAR(191) NOT NULL DEFAULT '';
