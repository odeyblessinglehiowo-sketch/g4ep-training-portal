"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";

export async function createAssignment(formData: FormData) {
  const currentUser = await requireRole("TEACHER");

  const teacherUser = await db.user.findUnique({
    where: {
      id: currentUser.userId,
    },
    include: {
      teacher: true,
    },
  });

  if (!teacherUser || !teacherUser.teacher) {
    throw new Error("Teacher profile not found.");
  }

  const title = formData.get("title")?.toString().trim() || "";
  const question = formData.get("question")?.toString().trim() || "";
  const dueDateRaw = formData.get("dueDate")?.toString().trim() || "";

  if (!title) {
    throw new Error("Assignment title is required.");
  }

  if (!question) {
    throw new Error("Assignment question is required.");
  }

  await db.assignment.create({
    data: {
      title,
      question,
      track: teacherUser.teacher.track,
      teacherId: teacherUser.teacher.id,
      dueDate: dueDateRaw ? new Date(dueDateRaw) : null,
      isPublished: true,
    },
  });

  revalidatePath("/teacher/assignments");
  revalidatePath("/teacher/dashboard");
  revalidatePath("/student/assignments");
  revalidatePath("/student/dashboard");
}