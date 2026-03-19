"use server";

import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

function buildCertificatesRedirect(params: {
  success?: string;
  error?: string;
  name?: string;
  q?: string;
  track?: string;
  status?: string;
}) {
  const searchParams = new URLSearchParams();

  if (params.success) searchParams.set("success", params.success);
  if (params.error) searchParams.set("error", params.error);
  if (params.name) searchParams.set("name", params.name);

  if (params.q) searchParams.set("q", params.q);
  if (params.track) searchParams.set("track", params.track);
  if (params.status) searchParams.set("status", params.status);

  return `/admin/certificates?${searchParams.toString()}`;
}

async function generateUniqueCertificateId() {
  const year = new Date().getFullYear();

  const issuedCount = await db.certificate.count({
    where: {
      status: "ISSUED",
    },
  });

  let certificateId = `G4EP-RISE-${year}-${String(issuedCount + 1).padStart(4, "0")}`;

  while (
    await db.certificate.findUnique({
      where: {
        certificateId,
      },
    })
  ) {
    const randomSuffix = Math.floor(Math.random() * 9000 + 1000);
    certificateId = `G4EP-RISE-${year}-${randomSuffix}`;
  }

  return certificateId;
}

export async function issueCertificate(formData: FormData) {
  await requireRole("ADMIN");

  const studentId = formData.get("studentId")?.toString();
  const q = formData.get("q")?.toString() ?? "";
  const track = formData.get("track")?.toString() ?? "ALL";
  const status = formData.get("status")?.toString() ?? "ALL";

  if (!studentId) {
    redirect(
      buildCertificatesRedirect({
        error: "Student record is missing.",
        q,
        track,
        status,
      })
    );
  }

  const student = await db.student.findUnique({
    where: {
      id: studentId,
    },
    include: {
      user: true,
      certificates: {
        orderBy: {
          createdAt: "desc",
        },
      },
    },
  });

  if (!student) {
    redirect(
      buildCertificatesRedirect({
        error: "Student not found.",
        q,
        track,
        status,
      })
    );
  }

  const existingIssuedCertificate = student.certificates.find(
    (certificate) => certificate.status === "ISSUED"
  );

  if (existingIssuedCertificate) {
    redirect(
      buildCertificatesRedirect({
        error: `${student.user.name} already has an issued certificate.`,
        q,
        track,
        status,
      })
    );
  }

  const certificateId = await generateUniqueCertificateId();
  const now = new Date();

  const latestCertificate = student.certificates[0];

  if (latestCertificate) {
    await db.certificate.update({
      where: {
        id: latestCertificate.id,
      },
      data: {
        status: "ISSUED",
        certificateId,
        issuedAt: now,
      },
    });
  } else {
    await db.certificate.create({
      data: {
        studentId: student.id,
        status: "ISSUED",
        certificateId,
        issuedAt: now,
      },
    });
  }

  revalidatePath("/admin/certificates");
  revalidatePath("/admin/students");
  revalidatePath("/teacher/students");
  revalidatePath("/student/dashboard");
  revalidatePath("/student/certificate");
  revalidatePath("/student/certificate/view");
  revalidatePath("/student/certificate/download");

  redirect(
    buildCertificatesRedirect({
      success: "issued",
      name: student.user.name,
      q,
      track,
      status,
    })
  );
}