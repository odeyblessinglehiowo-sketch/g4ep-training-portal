"use server";

import bcrypt from "bcrypt";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { redirect } from "next/navigation";
import { sendAccountEmail } from "@/lib/email";
import { revalidatePath } from "next/cache";

function generateTemporaryPassword(length = 8) {
  const chars =
    "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
  let password = "";

  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  return password;
}

function buildStudentsRedirect(params: {
  created?: string;
  success?: string;
  error?: string;
  email?: string;
  password?: string;
  emailSent?: string;
  name?: string;
  trackName?: string;
  q?: string;
  track?: string;
}) {
  const searchParams = new URLSearchParams();

  if (params.created) searchParams.set("created", params.created);
  if (params.success) searchParams.set("success", params.success);
  if (params.error) searchParams.set("error", params.error);
  if (params.email) searchParams.set("email", params.email);
  if (params.password) searchParams.set("password", params.password);
  if (params.emailSent) searchParams.set("emailSent", params.emailSent);
  if (params.name) searchParams.set("name", params.name);
  if (params.trackName) searchParams.set("trackName", params.trackName);
  if (params.q) searchParams.set("q", params.q);
  if (params.track) searchParams.set("track", params.track);

  return `/admin/students?${searchParams.toString()}`;
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

export async function createStudent(formData: FormData) {
  await requireRole("ADMIN");

  const name = formData.get("name")?.toString().trim();
  const email = formData.get("email")?.toString().trim().toLowerCase();
  const track = formData.get("track")?.toString().trim();

  if (!name || !email || !track) {
    redirect(
      buildStudentsRedirect({
        error: "Name, email, and track are required.",
      })
    );
  }

  const existingUser = await db.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    redirect(
      buildStudentsRedirect({
        error: "A user with this email already exists.",
      })
    );
  }

  const temporaryPassword = generateTemporaryPassword();
  const hashedPassword = await bcrypt.hash(temporaryPassword, 10);

  const user = await db.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
      role: "STUDENT",
    },
  });

  await db.student.create({
    data: {
      userId: user.id,
      track,
      certificates: {
        create: {
          status: "PENDING",
        },
      },
    },
  });

  let emailSent = "0";

  try {
    await sendAccountEmail({
      name,
      email,
      password: temporaryPassword,
      role: "Student",
    });
    emailSent = "1";
  } catch (error) {
    console.error("Student account email failed:", error);
  }

  revalidatePath("/admin/students");
  revalidatePath("/admin/certificates");

  redirect(
    buildStudentsRedirect({
      created: "1",
      email,
      password: temporaryPassword,
      emailSent,
    })
  );
}

export async function issueStudentCertificate(formData: FormData) {
  await requireRole("ADMIN");

  const studentId = formData.get("studentId")?.toString();
  const q = formData.get("q")?.toString() ?? "";
  const track = formData.get("track")?.toString() ?? "ALL";

  if (!studentId) {
    redirect(
      buildStudentsRedirect({
        error: "Student record is missing.",
        q,
        track,
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
      buildStudentsRedirect({
        error: "Student not found.",
        q,
        track,
      })
    );
  }

  const issuedAlready = student.certificates.find(
    (certificate) => certificate.status === "ISSUED"
  );

  if (issuedAlready) {
    redirect(
      buildStudentsRedirect({
        error: `${student.user.name} already has an issued certificate.`,
        q,
        track,
      })
    );
  }

  const certificateId = await generateUniqueCertificateId();
  const issuedAt = new Date();
  const latestCertificate = student.certificates[0];

  if (latestCertificate) {
    await db.certificate.update({
      where: {
        id: latestCertificate.id,
      },
      data: {
        status: "ISSUED",
        certificateId,
        issuedAt,
      },
    });
  } else {
    await db.certificate.create({
      data: {
        studentId: student.id,
        status: "ISSUED",
        certificateId,
        issuedAt,
      },
    });
  }

  revalidatePath("/admin/students");
  revalidatePath("/admin/certificates");
  revalidatePath("/teacher/students");
  revalidatePath("/student/dashboard");
  revalidatePath("/student/certificate");
  revalidatePath("/student/certificate/view");

  redirect(
    buildStudentsRedirect({
      success: "issued",
      name: student.user.name,
      q,
      track,
    })
  );
}

export async function issueCertificatesByTrack(formData: FormData) {
  await requireRole("ADMIN");

  const selectedTrack = formData.get("selectedTrack")?.toString().trim();
  const q = formData.get("q")?.toString() ?? "";
  const track = formData.get("track")?.toString() ?? "ALL";

  if (!selectedTrack || selectedTrack === "ALL") {
    redirect(
      buildStudentsRedirect({
        error: "Select a specific track before issuing certificates by track.",
        q,
        track,
      })
    );
  }

  const students = await db.student.findMany({
    where: {
      track: selectedTrack,
    },
    include: {
      certificates: {
        orderBy: {
          createdAt: "desc",
        },
      },
      user: true,
    },
  });

  if (students.length === 0) {
    redirect(
      buildStudentsRedirect({
        error: `No students found under ${selectedTrack}.`,
        q,
        track,
      })
    );
  }

  for (const student of students) {
    const issuedAlready = student.certificates.find(
      (certificate) => certificate.status === "ISSUED"
    );

    if (issuedAlready) {
      continue;
    }

    const certificateId = await generateUniqueCertificateId();
    const issuedAt = new Date();
    const latestCertificate = student.certificates[0];

    if (latestCertificate) {
      await db.certificate.update({
        where: {
          id: latestCertificate.id,
        },
        data: {
          status: "ISSUED",
          certificateId,
          issuedAt,
        },
      });
    } else {
      await db.certificate.create({
        data: {
          studentId: student.id,
          status: "ISSUED",
          certificateId,
          issuedAt,
        },
      });
    }
  }

  revalidatePath("/admin/students");
  revalidatePath("/admin/certificates");
  revalidatePath("/teacher/students");

  redirect(
    buildStudentsRedirect({
      success: "track-issued",
      trackName: selectedTrack,
      q,
      track,
    })
  );
}