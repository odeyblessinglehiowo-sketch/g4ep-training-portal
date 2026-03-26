-- DropForeignKey
ALTER TABLE "Submission" DROP CONSTRAINT "Submission_studentId_fkey";

-- AlterTable
ALTER TABLE "Submission" ADD COLUMN     "reviewSeenAt" TIMESTAMP(3),
ADD COLUMN     "studentSeenReview" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "teacherNotifiedAt" TIMESTAMP(3);

-- AddForeignKey
ALTER TABLE "Submission" ADD CONSTRAINT "Submission_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;
