"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function updateSubmissionStatus(formData: FormData) {
  const submissionId = formData.get("submissionId")?.toString();
  const status = formData.get("status")?.toString();
  const remark = formData.get("remark")?.toString().trim() || null;

  if (!submissionId || !status) {
    throw new Error("Missing submission data.");
  }

  if (!["PENDING", "APPROVED", "REJECTED"].includes(status)) {
    throw new Error("Invalid submission status.");
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
  revalidatePath("/student/submissions");
  revalidatePath("/student/dashboard");
}