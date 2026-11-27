-- VIP expiration date (NULL = unlimited)
ALTER TABLE `users` ADD COLUMN `vip_until` DATETIME(3) NULL;
