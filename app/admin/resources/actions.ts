"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { cloudinary } from "@/lib/cloudinary";

export async function createResource(formData: FormData) {
  const title = formData.get("title")?.toString().trim() || "";
  const track = formData.get("track")?.toString().trim() || "";
  const linkUrl = formData.get("linkUrl")?.toString().trim() || "";
  const file = formData.get("file");

  if (!title || !track) {
    throw new Error("Title and track are required.");
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
      track,
      fileUrl,
      linkUrl: linkUrl || null,
    },
  });

  revalidatePath("/admin/resources");
  revalidatePath("/admin/dashboard");
  revalidatePath("/teacher/resources");
  revalidatePath("/teacher/dashboard");
  revalidatePath("/student/resources");
  revalidatePath("/student/dashboard");
}