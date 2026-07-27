-- Logo personalizado del footer y URLs de redes sociales.
-- Todas con DEFAULT '' para compatibilidad con el registro existente 'store'.

ALTER TABLE `StoreSettings`
    ADD COLUMN `footerLogoUrl` VARCHAR(191) NOT NULL DEFAULT '',
    ADD COLUMN `instagramUrl`  VARCHAR(191) NOT NULL DEFAULT '',
    ADD COLUMN `tiktokUrl`     VARCHAR(191) NOT NULL DEFAULT '',
    ADD COLUMN `youtubeUrl`    VARCHAR(191) NOT NULL DEFAULT '',
    ADD COLUMN `facebookUrl`   VARCHAR(191) NOT NULL DEFAULT '';
