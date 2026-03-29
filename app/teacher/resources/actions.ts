"use server";

import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { cloudinary } from "@/lib/cloudinary";
import { revalidatePath } from "next/cache";

export async function createTeacherResource(formData: FormData) {
  const currentUser = await requireRole("TEACHER");

  const teacherUser = await db.user.findUnique({
    where: { id: currentUser.userId },
    include: { teacher: true },
  });

  if (!teacherUser?.teacher) {
    throw new Error("Teacher not found.");
  }

  const teacher = teacherUser.teacher;

  const title = formData.get("title")?.toString().trim() || "";
  const linkUrl = formData.get("linkUrl")?.toString().trim() || "";
  const file = formData.get("file");

  if (!title) {
    throw new Error("Resource title is required.");
  }

  let fileUrl: string | null = null;

  if (file instanceof File && file.size > 0) {
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const upload = await new Promise<{
      secure_url: string;
    }>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          resource_type: "auto",
          type: "upload",
          folder: "g4ep/resources",
        },
        (error, result) => {
          if (error || !result) {
            reject(error || new Error("Upload failed."));
            return;
          }

          resolve({
            secure_url: result.secure_url,
          });
        }
      );

      stream.end(buffer);
    });

    fileUrl = upload.secure_url;
  }

  if (!fileUrl && !linkUrl) {
    throw new Error("Upload a file or add a link.");
  }

  await db.resource.create({
    data: {
      title,
      fileUrl,
      linkUrl: linkUrl || null,
      track: teacher.track,
    },
  });

  revalidatePath("/teacher/resources");
  revalidatePath("/teacher/dashboard");
  revalidatePath("/student/resources");
  revalidatePath("/student/dashboard");
  revalidatePath("/admin/resources");
  revalidatePath("/admin/dashboard");
}