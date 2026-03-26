"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";

export async function updateSubmissionStatus(formData: FormData) {
  const currentUser = await requireRole("TEACHER", "ADMIN");

  const submissionId = formData.get("submissionId")?.toString();
  const status = formData.get("status")?.toString();
  const remark = formData.get("remark")?.toString().trim() || null;

  if (!submissionId || !status) {
    throw new Error("Missing submission data.");
  }

  if (!["PENDING", "APPROVED", "REJECTED"].includes(status)) {
    throw new Error("Invalid submission status.");
  }

  const submission = await db.submission.findUnique({
    where: { id: submissionId },
    include: {
      student: true,
    },
  });

  if (!submission) {
    throw new Error("Submission not found.");
  }

  if (currentUser.role === "TEACHER") {
    const teacherUser = await db.user.findUnique({
      where: {
        id: currentUser.userId,
      },
      include: {
        teacher: true,
      },
    });

    if (!teacherUser?.teacher) {
      throw new Error("Teacher profile not found.");
    }

    if (submission.student.track !== teacherUser.teacher.track) {
      throw new Error("You can only review submissions in your assigned track.");
    }
  }

  await db.submission.update({
    where: {
      id: submissionId,
    },
    data: {
      status: status as "PENDING" | "APPROVED" | "REJECTED",
      remark,
    },
  });

  revalidatePath("/admin/submissions");
  revalidatePath("/admin/dashboard");
  revalidatePath("/teacher/submissions");
  revalidatePath("/teacher/dashboard");
  revalidatePath("/student/submissions");
  revalidatePath("/student/dashboard");
}