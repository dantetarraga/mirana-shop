-- Qué bloques fijos del inicio (novedades, favoritos, reseñas...) están ocultos.
-- Lista de claves separadas por coma; el default '' deja el inicio mostrando
-- todo, exactamente como se comportaba antes de existir el ajuste.

-- AlterTable
ALTER TABLE `StoreSettings`
    ADD COLUMN `hiddenHomeBlocks` VARCHAR(191) NOT NULL DEFAULT '';
