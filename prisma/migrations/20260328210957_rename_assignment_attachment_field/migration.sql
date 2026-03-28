/*
  Warnings:

  - You are about to drop the column `attachmentUrl` on the `Assignment` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Assignment" DROP COLUMN "attachmentUrl",
ADD COLUMN     "attachmentUrl" TEXT;
