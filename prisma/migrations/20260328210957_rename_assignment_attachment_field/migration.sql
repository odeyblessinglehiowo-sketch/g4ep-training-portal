/*
  Warnings:

  - You are about to drop the column `imageUrl` on the `Assignment` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Assignment" DROP COLUMN "imageUrl",
ADD COLUMN     "attachmentUrl" TEXT;
