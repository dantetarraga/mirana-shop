-- Libro de Reclamaciones conforme a Ley 29571 y D.S. 011-2011-PCM (mod. D.S.
-- 006-2014-PCM y D.S. 101-2022-PCM). Además: backfill de reservas de pedidos
-- previos a 20260827010000_order_reservations_rate_limits.
--
-- Las columnas NOT NULL sin default (year, seq, dueAt) se agregan como NULL,
-- se rellenan y recién después se vuelven obligatorias, para que la migración
-- funcione también con reclamos ya registrados en producción.

-- AlterTable: nuevo tipo de alerta de plazos del libro
ALTER TABLE `AdminAlert` MODIFY `type` ENUM('LOW_STOCK', 'PENDING_ORDERS', 'PROMO_EXPIRING', 'DAILY_SUMMARY', 'COMPLAINT_DUE') NOT NULL;

-- AlterTable: datos del proveedor (razón social, RUC, domicilio fiscal)
ALTER TABLE `StoreSettings` ADD COLUMN `fiscalAddress` VARCHAR(300) NULL,
    ADD COLUMN `legalName` VARCHAR(191) NULL,
    ADD COLUMN `ruc` VARCHAR(11) NULL;

-- AlterTable: campos del Anexo I y control de plazos/envíos
ALTER TABLE `Complaint` ADD COLUMN `consumerEmailSentAt` DATETIME(3) NULL,
    ADD COLUMN `dueAt` DATETIME(3) NULL,
    ADD COLUMN `goodType` ENUM('PRODUCTO', 'SERVICIO') NOT NULL DEFAULT 'PRODUCTO',
    ADD COLUMN `guardianDocNumber` VARCHAR(191) NULL,
    ADD COLUMN `guardianDocType` VARCHAR(191) NULL,
    ADD COLUMN `guardianName` VARCHAR(191) NULL,
    ADD COLUMN `isMinor` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `orderCode` VARCHAR(191) NULL,
    ADD COLUMN `privacyAccepted` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `providerActions` TEXT NULL,
    ADD COLUMN `responseEmailSentAt` DATETIME(3) NULL,
    ADD COLUMN `seq` INTEGER NULL,
    ADD COLUMN `truthDeclarationAccepted` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `year` INTEGER NULL;

-- Backfill year/seq desde el código existente "LR-YYYY-NNNN".
UPDATE `Complaint`
SET `year` = CAST(SUBSTRING(`code`, 4, 4) AS UNSIGNED),
    `seq`  = CAST(SUBSTRING(`code`, 9) AS UNSIGNED)
WHERE `code` REGEXP '^LR-[0-9]{4}-[0-9]+$';

-- Códigos con otro formato (no debería haber): año de registro en Lima
-- (UTC-5, sin horario de verano) y correlativo a continuación del mayor del año.
UPDATE `Complaint` c
JOIN (
    SELECT t.`id`, t.`yr`, t.`rn` + COALESCE(m.`maxSeq`, 0) AS `newSeq`
    FROM (
        SELECT `id`,
               YEAR(DATE_SUB(`createdAt`, INTERVAL 5 HOUR)) AS `yr`,
               ROW_NUMBER() OVER (
                   PARTITION BY YEAR(DATE_SUB(`createdAt`, INTERVAL 5 HOUR))
                   ORDER BY `createdAt`, `id`
               ) AS `rn`
        FROM `Complaint`
        WHERE `seq` IS NULL
    ) t
    LEFT JOIN (
        SELECT `year`, MAX(`seq`) AS `maxSeq` FROM `Complaint` WHERE `seq` IS NOT NULL GROUP BY `year`
    ) m ON m.`year` = t.`yr`
) x ON x.`id` = c.`id`
SET c.`year` = x.`yr`, c.`seq` = x.`newSeq`;

-- Backfill dueAt: 15 días hábiles contados desde el día siguiente al registro,
-- fin del día en Lima (23:59:59.999 = 04:59:59.999 UTC del día siguiente).
-- Aproximación SQL que solo salta fines de semana (no feriados): adelanta el
-- vencimiento, es decir, es conservadora. Lun–Vie: +21 días, sábado: +20,
-- domingo: +19. Los reclamos nuevos usan features/complaints/lib/business-days.ts.
UPDATE `Complaint`
SET `dueAt` = DATE_SUB(
    DATE_ADD(
        TIMESTAMP(DATE(DATE_ADD(
            DATE_SUB(`createdAt`, INTERVAL 5 HOUR),
            INTERVAL (CASE WEEKDAY(DATE_SUB(`createdAt`, INTERVAL 5 HOUR)) WHEN 5 THEN 20 WHEN 6 THEN 19 ELSE 21 END) DAY
        ))),
        INTERVAL 29 HOUR
    ),
    INTERVAL 1000 MICROSECOND
)
WHERE `dueAt` IS NULL;

ALTER TABLE `Complaint` MODIFY `year` INTEGER NOT NULL,
    MODIFY `seq` INTEGER NOT NULL,
    MODIFY `dueAt` DATETIME(3) NOT NULL;

-- CreateTable: respuesta inmutable (solo inserción, una por hoja)
CREATE TABLE `ComplaintResponse` (
    `id` VARCHAR(191) NOT NULL,
    `complaintId` VARCHAR(191) NOT NULL,
    `body` TEXT NOT NULL,
    `providerActions` TEXT NULL,
    `respondedBy` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `ComplaintResponse_complaintId_key`(`complaintId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Respuestas ya existentes pasan a la tabla inmutable.
INSERT INTO `ComplaintResponse` (`id`, `complaintId`, `body`, `createdAt`)
SELECT CONCAT('legacy_', `id`), `id`, `response`, COALESCE(`respondedAt`, `updatedAt`)
FROM `Complaint`
WHERE `response` IS NOT NULL;

-- CreateIndex
CREATE INDEX `Complaint_status_dueAt_idx` ON `Complaint`(`status`, `dueAt`);

-- CreateIndex
CREATE UNIQUE INDEX `Complaint_year_seq_key` ON `Complaint`(`year`, `seq`);

-- AddForeignKey
ALTER TABLE `ComplaintResponse` ADD CONSTRAINT `ComplaintResponse_complaintId_fkey` FOREIGN KEY (`complaintId`) REFERENCES `Complaint`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- Backfill de reservas: pedidos impagos anteriores a la columna quedaron con
-- reservationExpiresAt = NULL y el cron nunca los expiraba. Se les asigna el
-- TTL por defecto (60 min desde su creación); los ya vencidos se cancelarán y
-- liberarán su stock en la próxima corrida de /api/cron/orders.
UPDATE `Order`
SET `reservationExpiresAt` = DATE_ADD(`createdAt`, INTERVAL 60 MINUTE)
WHERE `reservationExpiresAt` IS NULL
  AND `status` IN ('PENDING', 'AWAITING_PROOF')
  AND `paymentStatus` = 'UNPAID';
