-- Preventa parcial: adelanto por producto + saldo pendiente en el pedido.
-- Todas las columnas llevan default, así que los datos existentes quedan
-- exactamente como estaban (productos sin preventa parcial, pedidos sin saldo).

-- AlterTable
ALTER TABLE `Product`
    ADD COLUMN `allowPartialPreorder` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `preorderDepositPercent` INTEGER NULL,
    ADD COLUMN `estimatedArrival` DATETIME(3) NULL;

-- AlterTable
ALTER TABLE `StoreSettings`
    ADD COLUMN `preorderDepositPercent` INTEGER NOT NULL DEFAULT 50;

-- AlterTable
ALTER TABLE `CartItem`
    ADD COLUMN `preorderMode` ENUM('FULL', 'PARTIAL') NOT NULL DEFAULT 'FULL';

-- AlterTable
ALTER TABLE `OrderItem`
    ADD COLUMN `isPreorder` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `preorderMode` ENUM('FULL', 'PARTIAL') NOT NULL DEFAULT 'FULL',
    ADD COLUMN `depositUnitPrice` DECIMAL(10, 2) NULL;

-- AlterTable
ALTER TABLE `Order`
    ADD COLUMN `dueTotal` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    ADD COLUMN `duePaidAt` DATETIME(3) NULL;
