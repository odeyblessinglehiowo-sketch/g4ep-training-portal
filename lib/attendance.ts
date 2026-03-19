import { db } from "@/lib/db";

export async function syncExpiredAttendanceSessions() {
  const now = new Date();

  const expiredSessions = await db.attendanceSession.findMany({
    where: {
      isActive: true,
      endsAt: {
        lte: now,
      },
    },
    select: {
      id: true,
      track: true,
    },
  });

  for (const session of expiredSessions) {
    const studentsInTrack = await db.student.findMany({
      where: {
        track: session.track,
      },
      select: {
        id: true,
      },
    });

    const existingRecords = await db.attendanceRecord.findMany({
      where: {
        sessionId: session.id,
      },
      select: {
        studentId: true,
      },
    });

    const existingStudentIds = new Set(
      existingRecords.map((record) => record.studentId)
    );

    const absentStudents = studentsInTrack.filter(
      (student) => !existingStudentIds.has(student.id)
    );

    await db.$transaction(async (tx) => {
      for (const student of absentStudents) {
        await tx.attendanceRecord.create({
          data: {
            sessionId: session.id,
            studentId: student.id,
            status: "ABSENT",
          },
        });
      }

      await tx.attendanceSession.update({
        where: {
          id: session.id,
        },
        data: {
          isActive: false,
        },
      });
    });
  }
}

export async function markAttendanceByCodeForStudent(
  userId: string,
  code: string
) {
  await syncExpiredAttendanceSessions();

  const studentUser = await db.user.findUnique({
    where: {
      id: userId,
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
      track: student.track,
    },
  });

  if (!session) {
    throw new Error("No attendance session was found for this QR code.");
  }

  const now = new Date();

  if (!session.isActive || now < session.startsAt || now > session.endsAt) {
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
    if (existingRecord.status === "PRESENT") {
      throw new Error("You have already checked in for this class.");
    }

    throw new Error("Attendance for this session has already been closed.");
  }

  const record = await db.attendanceRecord.create({
    data: {
      sessionId: session.id,
      studentId: student.id,
      status: "PRESENT",
    },
    include: {
      session: true,
    },
  });

  return {
    sessionTitle: record.session.title,
    checkedInAt: record.checkedInAt.toISOString(),
  };
}