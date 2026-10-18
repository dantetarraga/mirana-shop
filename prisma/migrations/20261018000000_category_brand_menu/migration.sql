-- Navegación de catálogo (docs/NAVEGACION-CATALOGO.md §3): orden, visibilidad
-- y menú en Category; hero, orden, visibilidad y destacada en Brand.

-- AlterTable
ALTER TABLE `Category` ADD COLUMN `isVisible` BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN `position` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `showInMenu` BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE `Brand` ADD COLUMN `featured` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `heroUrl` VARCHAR(191) NULL,
    ADD COLUMN `isVisible` BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN `position` INTEGER NOT NULL DEFAULT 0;

-- El nombre deja de ser único global y pasa a serlo entre hermanas. Se crea el
-- índice nuevo antes de soltar el viejo: los nombres ya eran únicos, así que no
-- puede fallar por duplicados.
-- CreateIndex
CREATE UNIQUE INDEX `Category_parentId_name_key` ON `Category`(`parentId`, `name`);

-- DropIndex
DROP INDEX `Category_name_key` ON `Category`;

-- CreateIndex
CREATE INDEX `Category_parentId_position_idx` ON `Category`(`parentId`, `position`);

-- CreateIndex
CREATE INDEX `Brand_featured_position_idx` ON `Brand`(`featured`, `position`);

-- ---------------------------------------------------------------------------
-- Backfill
-- ---------------------------------------------------------------------------

-- Las raíces actuales entran al menú: preserva lo que la tienda ya mostraba.
UPDATE `Category` SET `showInMenu` = true WHERE `parentId` IS NULL AND `deletedAt` IS NULL;

-- Orden inicial alfabético entre hermanas (0, 1, 2…).
UPDATE `Category` c
JOIN (
  SELECT `id`, ROW_NUMBER() OVER (PARTITION BY `parentId` ORDER BY `name`, `id`) - 1 AS `pos`
  FROM `Category`
) r ON r.`id` = c.`id`
SET c.`position` = r.`pos`;

-- Orden inicial alfabético de marcas.
UPDATE `Brand` b
JOIN (
  SELECT `id`, ROW_NUMBER() OVER (ORDER BY `name`, `id`) - 1 AS `pos`
  FROM `Brand`
) r ON r.`id` = b.`id`
SET b.`position` = r.`pos`;
