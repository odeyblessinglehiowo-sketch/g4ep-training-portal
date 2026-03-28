"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { uploadFileToCloudinary } from "@/lib/upload-file";

function normalizeOptional(value: FormDataEntryValue | null) {
  const text = value?.toString().trim() ?? "";
  return text === "" ? null : text;
}

async function getTeacherUser(userId: string) {
  return db.user.findUnique({
    where: {
      id: userId,
    },
    include: {
      teacher: true,
    },
  });
}

export async function createAssignment(formData: FormData) {
  const currentUser = await requireRole("TEACHER");

  const teacherUser = await getTeacherUser(currentUser.userId);

  if (!teacherUser?.teacher) {
    throw new Error("Teacher profile not found.");
  }

  const title = formData.get("title")?.toString().trim() ?? "";
  const question = normalizeOptional(formData.get("question"));
  const manualAttachmentUrl = normalizeOptional(formData.get("imageUrl"));
  const linkUrl = normalizeOptional(formData.get("linkUrl"));
  const linkLabel = normalizeOptional(formData.get("linkLabel"));
  const dueDateRaw = normalizeOptional(formData.get("dueDate"));
  const uploadFile = formData.get("uploadFile");

  if (!title) {
    throw new Error("Assignment title is required.");
  }

  let finalAttachmentUrl = manualAttachmentUrl;

  if (uploadFile instanceof File && uploadFile.size > 0) {
    const uploaded = await uploadFileToCloudinary(
      uploadFile,
      "g4ep/assignments"
    );
    finalAttachmentUrl = uploaded?.secure_url || finalAttachmentUrl;
  }

  if (!question && !finalAttachmentUrl && !linkUrl) {
    throw new Error(
      "Add at least one assignment content type: instructions, uploaded file/attachment URL, or link URL."
    );
  }

  await db.assignment.create({
    data: {
      title,
      question,
      imageUrl: finalAttachmentUrl,
      linkUrl,
      linkLabel,
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
  revalidatePath("/admin/assignments");
  revalidatePath("/admin/dashboard");
}

export async function updateAssignment(formData: FormData) {
  const currentUser = await requireRole("TEACHER", "ADMIN");

  const assignmentId = formData.get("assignmentId")?.toString().trim() ?? "";
  const title = formData.get("title")?.toString().trim() ?? "";
  const question = normalizeOptional(formData.get("question"));
  const manualAttachmentUrl = normalizeOptional(formData.get("imageUrl"));
  const linkUrl = normalizeOptional(formData.get("linkUrl"));
  const linkLabel = normalizeOptional(formData.get("linkLabel"));
  const dueDateRaw = normalizeOptional(formData.get("dueDate"));
  const isPublished = formData.get("isPublished")?.toString() === "true";
  const uploadFile = formData.get("uploadFile");

  if (!assignmentId) {
    throw new Error("Assignment ID is required.");
  }

  if (!title) {
    throw new Error("Assignment title is required.");
  }

  const assignment = await db.assignment.findUnique({
    where: {
      id: assignmentId,
    },
    include: {
      teacher: true,
    },
  });

  if (!assignment) {
    throw new Error("Assignment not found.");
  }

  if (currentUser.role === "TEACHER") {
    const teacherUser = await getTeacherUser(currentUser.userId);

    if (!teacherUser?.teacher || assignment.teacherId !== teacherUser.teacher.id) {
      throw new Error("You are not allowed to edit this assignment.");
    }
  }

  let finalAttachmentUrl = manualAttachmentUrl;

  if (uploadFile instanceof File && uploadFile.size > 0) {
    const uploaded = await uploadFileToCloudinary(
      uploadFile,
      "g4ep/assignments"
    );
    finalAttachmentUrl = uploaded?.secure_url || finalAttachmentUrl;
  }

  if (!question && !finalAttachmentUrl && !linkUrl) {
    throw new Error(
      "Add at least one assignment content type: instructions, uploaded file/attachment URL, or link URL."
    );
  }

  await db.assignment.update({
    where: {
      id: assignmentId,
    },
    data: {
      title,
      question,
      imageUrl: finalAttachmentUrl,
      linkUrl,
      linkLabel,
      dueDate: dueDateRaw ? new Date(dueDateRaw) : null,
      isPublished,
    },
  });

  revalidatePath("/teacher/assignments");
  revalidatePath(`/teacher/assignments/${assignmentId}`);
  revalidatePath(`/teacher/assignments/${assignmentId}/edit`);
  revalidatePath("/teacher/dashboard");
  revalidatePath("/student/assignments");
  revalidatePath("/student/dashboard");
  revalidatePath("/admin/assignments");
  revalidatePath(`/admin/assignments/${assignmentId}`);
  revalidatePath("/admin/dashboard");

  if (currentUser.role === "ADMIN") {
    redirect(`/admin/assignments/${assignmentId}`);
  }

  redirect(`/teacher/assignments/${assignmentId}`);
}

export async function deleteAssignment(formData: FormData) {
  const currentUser = await requireRole("TEACHER", "ADMIN");

  const assignmentId = formData.get("assignmentId")?.toString().trim() ?? "";

  if (!assignmentId) {
    throw new Error("Assignment ID is required.");
  }

  const assignment = await db.assignment.findUnique({
    where: {
      id: assignmentId,
    },
  });

  if (!assignment) {
    throw new Error("Assignment not found.");
  }

  if (currentUser.role === "TEACHER") {
    const teacherUser = await getTeacherUser(currentUser.userId);

    if (!teacherUser?.teacher || assignment.teacherId !== teacherUser.teacher.id) {
      throw new Error("You are not allowed to delete this assignment.");
    }
  }

  await db.assignment.delete({
    where: {
      id: assignmentId,
    },
  });

  revalidatePath("/teacher/assignments");
  revalidatePath("/teacher/dashboard");
  revalidatePath("/student/assignments");
  revalidatePath("/student/dashboard");
  revalidatePath("/admin/assignments");
  revalidatePath("/admin/dashboard");

  if (currentUser.role === "ADMIN") {
    redirect("/admin/assignments");
  }

  redirect("/teacher/assignments");
}

export async function toggleAssignmentPublish(formData: FormData) {
  const currentUser = await requireRole("TEACHER", "ADMIN");

  const assignmentId = formData.get("assignmentId")?.toString().trim() ?? "";

  if (!assignmentId) {
    throw new Error("Assignment ID is required.");
  }

  const assignment = await db.assignment.findUnique({
    where: {
      id: assignmentId,
    },
  });

  if (!assignment) {
    throw new Error("Assignment not found.");
  }

  if (currentUser.role === "TEACHER") {
    const teacherUser = await getTeacherUser(currentUser.userId);

    if (!teacherUser?.teacher || assignment.teacherId !== teacherUser.teacher.id) {
      throw new Error("You are not allowed to update this assignment.");
    }
  }

  await db.assignment.update({
    where: {
      id: assignmentId,
    },
    data: {
      isPublished: !assignment.isPublished,
    },
  });

  revalidatePath("/teacher/assignments");
  revalidatePath(`/teacher/assignments/${assignmentId}`);
  revalidatePath(`/teacher/assignments/${assignmentId}/edit`);
  revalidatePath("/teacher/dashboard");
  revalidatePath("/student/assignments");
  revalidatePath("/student/dashboard");
  revalidatePath("/admin/assignments");
  revalidatePath(`/admin/assignments/${assignmentId}`);
  revalidatePath("/admin/dashboard");
}