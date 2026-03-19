"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function createResource(formData: FormData) {
  const title = formData.get("title")?.toString().trim();
  const track = formData.get("track")?.toString().trim();
  const fileUrl = formData.get("fileUrl")?.toString().trim();

  if (!title || !track || !fileUrl) {
    throw new Error("All fields are required.");
  }

  await db.resource.create({
    data: {
      title,
      track,
      fileUrl,
    },
  });

  revalidatePath("/admin/resources");
  revalidatePath("/student/resources");
}