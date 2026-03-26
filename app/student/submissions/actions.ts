"use server";

import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function createSubmission(formData: FormData) {
  
  const title = formData.get("title")?.toString().trim();
  const fileUrl = formData.get("fileUrl")?.toString().trim();
  

  if (!title || !fileUrl) {
    throw new Error("All fields are required.");
  }

  const currentUser = await requireRole("STUDENT");

  const studentUser = await db.user.findUnique({
    where: {
      id: currentUser.userId,
    },
    include: {
      student: true,
    },
  });

  if (!studentUser || !studentUser.student) {
    throw new Error("Student record not found.");
  }

  await db.submission.create({
  data: {
    title,
    fileUrl,
    studentId: studentUser.student.id,
    teacherNotifiedAt: null,
    studentSeenReview: false,
    reviewSeenAt: null,
  },
});

  revalidatePath("/student/submissions");
  revalidatePath("/student/dashboard");
  revalidatePath("/admin/dashboard");
  
}