-- Cupones ligados a promociones, formas de entrega administrables (retiro en
-- tienda / preventa / envío), DNI en los datos de entrega y registro de la
-- aceptación de Términos y Condiciones al comprar.
--
-- Todas las columnas nuevas de tablas existentes llevan default o son NULL, así
-- que los pedidos y promociones que ya existen quedan exactamente como estaban:
-- las promociones siguen siendo automáticas (requiresCoupon = false) y los
-- pedidos antiguos quedan con la forma de entrega vacía (`deliveryMethodName`
-- en blanco, `deliveryKind` = SHIPPING, que es lo que se cobraba hasta ahora).

-- CreateTable
CREATE TABLE `Coupon` (
    `id` VARCHAR(191) NOT NULL,
    `code` VARCHAR(191) NOT NULL,
    `promotionId` VARCHAR(191) NOT NULL,
    `active` BOOLEAN NOT NULL DEFAULT true,
    `maxUses` INTEGER NULL,
    `usedCount` INTEGER NOT NULL DEFAULT 0,
    `startsAt` DATETIME(3) NULL,
    `endsAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Coupon_code_key`(`code`),
    INDEX `Coupon_active_idx`(`active`),
    INDEX `Coupon_promotionId_idx`(`promotionId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `DeliveryMethod` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `kind` ENUM('PICKUP', 'PREORDER', 'SHIPPING') NOT NULL DEFAULT 'SHIPPING',
    `cost` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `requiresAddress` BOOLEAN NOT NULL DEFAULT true,
    `requiresLocation` BOOLEAN NOT NULL DEFAULT false,
    `position` INTEGER NOT NULL DEFAULT 0,
    `active` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `DeliveryMethod_active_position_idx`(`active`, `position`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `DeliveryLocation` (
    `id` VARCHAR(191) NOT NULL,
    `methodId` VARCHAR(191) NOT NULL,
    `label` VARCHAR(191) NOT NULL,
    `address` VARCHAR(191) NOT NULL,
    `mapUrl` TEXT NULL,
    `position` INTEGER NOT NULL DEFAULT 0,

    INDEX `DeliveryLocation_methodId_position_idx`(`methodId`, `position`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AlterTable
ALTER TABLE `Promotion`
    ADD COLUMN `requiresCoupon` BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE `ShippingAddress`
    ADD COLUMN `dni` VARCHAR(191) NOT NULL DEFAULT '',
    MODIFY `address` VARCHAR(191) NOT NULL DEFAULT '',
    MODIFY `district` VARCHAR(191) NOT NULL DEFAULT '';

-- AlterTable
ALTER TABLE `Order`
    ADD COLUMN `deliveryMethodId` VARCHAR(191) NULL,
    ADD COLUMN `deliveryMethodName` VARCHAR(191) NOT NULL DEFAULT '',
    ADD COLUMN `deliveryKind` ENUM('PICKUP', 'PREORDER', 'SHIPPING') NOT NULL DEFAULT 'SHIPPING',
    ADD COLUMN `deliveryLocation` TEXT NULL,
    ADD COLUMN `couponId` VARCHAR(191) NULL,
    ADD COLUMN `couponCode` VARCHAR(191) NULL,
    ADD COLUMN `termsAcceptedAt` DATETIME(3) NULL;

-- CreateIndex
CREATE INDEX `Order_deliveryMethodId_idx` ON `Order`(`deliveryMethodId`);

-- CreateIndex
CREATE INDEX `Order_couponId_idx` ON `Order`(`couponId`);

-- AddForeignKey
ALTER TABLE `Coupon` ADD CONSTRAINT `Coupon_promotionId_fkey` FOREIGN KEY (`promotionId`) REFERENCES `Promotion`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DeliveryLocation` ADD CONSTRAINT `DeliveryLocation_methodId_fkey` FOREIGN KEY (`methodId`) REFERENCES `DeliveryMethod`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Order` ADD CONSTRAINT `Order_deliveryMethodId_fkey` FOREIGN KEY (`deliveryMethodId`) REFERENCES `DeliveryMethod`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Order` ADD CONSTRAINT `Order_couponId_fkey` FOREIGN KEY (`couponId`) REFERENCES `Coupon`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
