-- CreateTable
CREATE TABLE `Referral` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `referrerName` VARCHAR(191) NOT NULL,
    `referrerMail` VARCHAR(191) NOT NULL,
    `referrerMobile` VARCHAR(191) NOT NULL,
    `refereeMail` VARCHAR(191) NOT NULL,
    `refereeMobile` VARCHAR(191) NOT NULL,
    `course` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
