-- Reservas temporales de stock para pedidos que esperan comprobante.
ALTER TABLE `Order`
    ADD COLUMN `reservationExpiresAt` DATETIME(3) NULL;

CREATE INDEX `Order_status_reservationExpiresAt_idx`
    ON `Order`(`status`, `reservationExpiresAt`);

-- Buckets persistentes para limitar acciones públicas sin almacenar IP/email.
CREATE TABLE `RateLimitBucket` (
    `key` VARCHAR(64) NOT NULL,
    `count` INTEGER NOT NULL DEFAULT 1,
    `expiresAt` DATETIME(3) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `RateLimitBucket_expiresAt_idx`(`expiresAt`),
    PRIMARY KEY (`key`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
