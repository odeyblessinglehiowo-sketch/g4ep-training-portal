"use server";

import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { cloudinary } from "@/lib/cloudinary";

export async function createTeacherResource(formData: FormData) {
  const currentUser = await requireRole("TEACHER");

  const teacherUser = await db.user.findUnique({
    where: { id: currentUser.userId },
    include: { teacher: true },
  });

  if (!teacherUser?.teacher) {
    throw new Error("Teacher not found");
  }

  const teacher = teacherUser.teacher;

  const title = formData.get("title") as string;
  const linkUrl = formData.get("linkUrl") as string;
  const file = formData.get("file") as File;

  let fileUrl = "";

  if (file && file.size > 0) {
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const upload = await new Promise<any>((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          {
            resource_type: "auto",
            folder: "g4ep/resources",
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        )
        .end(buffer);
    });

    fileUrl = upload.secure_url;
  }

  await db.resource.create({
    data: {
      title,
      fileUrl,
      linkUrl,
      track: teacher.track,
    },
  });
}