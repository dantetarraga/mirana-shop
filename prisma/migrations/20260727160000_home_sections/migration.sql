-- Secciones del inicio administrables. `HomeSection` guarda la cabecera (título,
-- antetítulo, destino del "Ver todos", orden y visibilidad) y `ProductHomeSection`
-- enlaza los productos que muestra, igual que ProductCollection.
--
-- Ambas tablas son nuevas: no tocan datos existentes y el inicio se comporta
-- igual que hasta ahora mientras no se cree ninguna sección.

-- CreateTable
CREATE TABLE `HomeSection` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `eyebrow` VARCHAR(191) NOT NULL DEFAULT '',
    `ctaHref` VARCHAR(191) NOT NULL DEFAULT '',
    `position` INTEGER NOT NULL DEFAULT 0,
    `active` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `HomeSection_active_position_idx`(`active`, `position`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ProductHomeSection` (
    `productId` VARCHAR(191) NOT NULL,
    `sectionId` VARCHAR(191) NOT NULL,

    INDEX `ProductHomeSection_sectionId_idx`(`sectionId`),
    PRIMARY KEY (`productId`, `sectionId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `ProductHomeSection` ADD CONSTRAINT `ProductHomeSection_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `Product`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProductHomeSection` ADD CONSTRAINT `ProductHomeSection_sectionId_fkey` FOREIGN KEY (`sectionId`) REFERENCES `HomeSection`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
