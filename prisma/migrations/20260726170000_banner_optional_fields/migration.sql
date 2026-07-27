-- El título y la imagen de desktop de un banner pasan a ser opcionales: se
-- permite un banner solo-imagen (sin texto) y un banner cargado a medias que
-- todavía no se quiere publicar.
--
-- Solo se relaja NOT NULL: ninguna fila existente cambia de valor.

-- AlterTable
ALTER TABLE `Banner`
    MODIFY `title` VARCHAR(191) NULL,
    MODIFY `imageUrl` VARCHAR(191) NULL;
