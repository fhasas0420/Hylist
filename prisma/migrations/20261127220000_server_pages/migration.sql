-- AlterTable
ALTER TABLE `servers` ADD COLUMN `discord_url` VARCHAR(255) NULL,
    ADD COLUMN `website_url` VARCHAR(255) NULL,
    ADD COLUMN `vote_webhook_url` VARCHAR(255) NULL,
    ADD COLUMN `verified_at` DATETIME(3) NULL;

-- AlterTable
ALTER TABLE `votes` ADD COLUMN `player_name` VARCHAR(32) NULL;

-- CreateTable
CREATE TABLE `server_samples` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `server_id` CHAR(36) NOT NULL,
    `at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `online` BOOLEAN NOT NULL,
    `players` INTEGER NULL,

    INDEX `server_samples_server_id_at_idx`(`server_id`, `at`),
    INDEX `server_samples_at_idx`(`at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `server_views` (
    `server_id` CHAR(36) NOT NULL,
    `day` DATE NOT NULL,
    `views` INTEGER NOT NULL DEFAULT 0,

    PRIMARY KEY (`server_id`, `day`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `reports` (
    `id` CHAR(36) NOT NULL,
    `server_id` CHAR(36) NOT NULL,
    `user_id` CHAR(36) NULL,
    `reason` VARCHAR(32) NOT NULL,
    `details` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `resolved_at` DATETIME(3) NULL,
    `resolution` VARCHAR(16) NULL,

    INDEX `reports_resolved_at_created_at_idx`(`resolved_at`, `created_at`),
    INDEX `reports_server_id_idx`(`server_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `server_samples` ADD CONSTRAINT `server_samples_server_id_fkey` FOREIGN KEY (`server_id`) REFERENCES `servers`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `server_views` ADD CONSTRAINT `server_views_server_id_fkey` FOREIGN KEY (`server_id`) REFERENCES `servers`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `reports` ADD CONSTRAINT `reports_server_id_fkey` FOREIGN KEY (`server_id`) REFERENCES `servers`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `reports` ADD CONSTRAINT `reports_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
