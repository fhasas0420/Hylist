-- AlterTable
ALTER TABLE `servers` ADD COLUMN `instagram_url` VARCHAR(255) NULL,
    ADD COLUMN `store_url` VARCHAR(255) NULL,
    ADD COLUMN `tiktok_url` VARCHAR(255) NULL,
    ADD COLUMN `twitter_url` VARCHAR(255) NULL,
    ADD COLUMN `youtube_url` VARCHAR(255) NULL;

-- CreateTable
CREATE TABLE `reviews` (
    `id` CHAR(36) NOT NULL,
    `server_id` CHAR(36) NOT NULL,
    `user_id` CHAR(36) NOT NULL,
    `rating` TINYINT NOT NULL,
    `body` TEXT NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `reviews_server_id_created_at_idx`(`server_id`, `created_at`),
    INDEX `reviews_user_id_idx`(`user_id`),
    UNIQUE INDEX `reviews_server_id_user_id_key`(`server_id`, `user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `reviews` ADD CONSTRAINT `reviews_server_id_fkey` FOREIGN KEY (`server_id`) REFERENCES `servers`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `reviews` ADD CONSTRAINT `reviews_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

