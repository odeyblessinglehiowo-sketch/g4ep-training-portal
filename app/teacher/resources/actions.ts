"use server";

import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function createTeacherResource(formData: FormData) {
  const title = formData.get("title")?.toString().trim();
  const fileUrl = formData.get("fileUrl")?.toString().trim();

  if (!title || !fileUrl) {
    throw new Error("All fields are required.");
  }

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
    throw new Error("Teacher record not found.");
  }

  await db.resource.create({
    data: {
      title,
      track: teacherUser.teacher.track,
      fileUrl,
    },
  });

  revalidatePath("/teacher/resources");
  revalidatePath("/student/resources");
  revalidatePath("/admin/resources");
  revalidatePath("/teacher/dashboard");
}