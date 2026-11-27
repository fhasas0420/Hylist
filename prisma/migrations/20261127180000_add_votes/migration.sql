-- CreateTable
CREATE TABLE `votes` (
    `id` CHAR(36) NOT NULL,
    `server_id` CHAR(36) NOT NULL,
    `user_id` CHAR(36) NOT NULL,
    `ip_hash` VARCHAR(64) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `votes_server_id_created_at_idx`(`server_id`, `created_at`),
    INDEX `votes_user_id_server_id_created_at_idx`(`user_id`, `server_id`, `created_at`),
    INDEX `votes_ip_hash_server_id_created_at_idx`(`ip_hash`, `server_id`, `created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `votes` ADD CONSTRAINT `votes_server_id_fkey` FOREIGN KEY (`server_id`) REFERENCES `servers`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `votes` ADD CONSTRAINT `votes_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
