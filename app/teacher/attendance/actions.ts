"use server";

import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { syncExpiredAttendanceSessions } from "@/lib/attendance";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

function generateAttendanceCode(length = 6) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";

  for (let i = 0; i < length; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  return code;
}

function buildTeacherAttendanceRedirect(params: {
  success?: string;
  error?: string;
  title?: string;
}) {
  const searchParams = new URLSearchParams();

  if (params.success) searchParams.set("success", params.success);
  if (params.error) searchParams.set("error", params.error);
  if (params.title) searchParams.set("title", params.title);

  return `/teacher/attendance?${searchParams.toString()}`;
}

export async function createAttendanceSession(formData: FormData) {
  const title = formData.get("title")?.toString().trim();
  const duration = Number(formData.get("duration"));

  if (!title || !duration || duration < 1) {
    redirect(
      buildTeacherAttendanceRedirect({
        error: "Session title and a valid duration are required.",
      })
    );
  }

  const currentUser = await requireRole("TEACHER");

  await syncExpiredAttendanceSessions();

  const teacherUser = await db.user.findUnique({
    where: {
      id: currentUser.userId,
    },
    include: {
      teacher: true,
    },
  });

  if (!teacherUser || !teacherUser.teacher) {
    redirect(
      buildTeacherAttendanceRedirect({
        error: "Teacher profile not found.",
      })
    );
  }

  const teacher = teacherUser.teacher;

  const existingActiveSession = await db.attendanceSession.findFirst({
    where: {
      teacherId: teacher.id,
      track: teacher.track,
      isActive: true,
    },
  });

  if (existingActiveSession) {
    redirect(
      buildTeacherAttendanceRedirect({
        error:
          "You already have an active attendance session for this track. Wait for it to expire before creating another one.",
      })
    );
  }

  const now = new Date();
  const endsAt = new Date(now.getTime() + duration * 60 * 1000);

  let code = generateAttendanceCode();

  while (
    await db.attendanceSession.findFirst({
      where: {
        track: teacher.track,
        code,
      },
    })
  ) {
    code = generateAttendanceCode();
  }

  await db.attendanceSession.create({
    data: {
      title,
      track: teacher.track,
      teacherId: teacher.id,
      code,
      startsAt: now,
      endsAt,
      isActive: true,
    },
  });

  revalidatePath("/teacher/attendance");
  revalidatePath("/student/attendance");
  revalidatePath("/student/attendance/scan/result");
  revalidatePath("/teacher/dashboard");
  revalidatePath("/admin/attendance");
  revalidatePath("/admin/dashboard");

  redirect(
    buildTeacherAttendanceRedirect({
      success: "created",
      title,
    })
  );
}