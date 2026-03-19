"use server";

import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function markAttendance(formData: FormData) {
  const code = formData.get("code")?.toString().trim().toUpperCase();

  if (!code) {
    throw new Error("Attendance code is required.");
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

  const student = studentUser.student;

  const session = await db.attendanceSession.findFirst({
    where: {
      code,
      isActive: true,
      track: student.track,
    },
  });

  if (!session) {
    throw new Error("No active attendance session found for this code.");
  }

  const now = new Date();

  if (now < session.startsAt || now > session.endsAt) {
    throw new Error("This attendance session is no longer available.");
  }

  const existingRecord = await db.attendanceRecord.findUnique({
    where: {
      sessionId_studentId: {
        sessionId: session.id,
        studentId: student.id,
      },
    },
  });

  if (existingRecord) {
    throw new Error("You have already checked in for this class.");
  }

  await db.attendanceRecord.create({
    data: {
      sessionId: session.id,
      studentId: student.id,
      status: "PRESENT",
    },
  });

  revalidatePath("/student/attendance");
  revalidatePath("/student/dashboard");
  revalidatePath("/teacher/attendance");
  revalidatePath("/teacher/students");
  revalidatePath("/admin/students");
}