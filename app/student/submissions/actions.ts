"use server";

import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { uploadFileToCloudinary } from "@/lib/upload-file";

export async function createSubmission(formData: FormData) {
  const title = formData.get("title")?.toString().trim();
  const fileUrl = formData.get("fileUrl")?.toString().trim() || "";
  const assignmentIdRaw = formData.get("assignmentId")?.toString().trim() || "";
  const uploadFile = formData.get("uploadFile");

  if (!title) {
    throw new Error("Project title is required.");
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

  let finalFileUrl = fileUrl;

  if (uploadFile instanceof File && uploadFile.size > 0) {
    const uploaded = await uploadFileToCloudinary(
      uploadFile,
      "g4ep/submissions"
    );
    finalFileUrl = uploaded?.secure_url || finalFileUrl;
  }

  if (!finalFileUrl) {
    throw new Error("Add a project link or upload a file.");
  }

  let finalAssignmentId: string | null = null;

  if (assignmentIdRaw) {
    const assignment = await db.assignment.findFirst({
      where: {
        id: assignmentIdRaw,
        track: studentUser.student.track,
        isPublished: true,
      },
    });

    if (!assignment) {
      throw new Error("Selected assignment is not available.");
    }

    finalAssignmentId = assignment.id;
  }

  await db.submission.create({
    data: {
      title,
      fileUrl: finalFileUrl,
      studentId: studentUser.student.id,
      assignmentId: finalAssignmentId,
      teacherNotifiedAt: null,
      studentSeenReview: false,
      reviewSeenAt: null,
    },
  });

  revalidatePath("/student/submissions");
  revalidatePath("/student/dashboard");
  revalidatePath("/teacher/submissions");
  revalidatePath("/teacher/dashboard");
  revalidatePath("/admin/submissions");
  revalidatePath("/admin/dashboard");
}