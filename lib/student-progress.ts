import { db } from "@/lib/db";

export type StudentAttendanceMetrics = {
  totalSessions: number;
  presentCount: number;
  absentCount: number;
  attendancePercentage: number;
};

export async function getStudentAttendanceMetrics(
  studentId: string
): Promise<StudentAttendanceMetrics> {
  const records = await db.attendanceRecord.findMany({
    where: {
      studentId,
    },
    select: {
      status: true,
    },
  });

  const presentCount = records.filter(
    (record) => record.status === "PRESENT"
  ).length;

  const absentCount = records.filter(
    (record) => record.status === "ABSENT"
  ).length;

  const totalSessions = records.length;

  const attendancePercentage =
    totalSessions === 0
      ? 0
      : Math.round((presentCount / totalSessions) * 100);

  return {
    totalSessions,
    presentCount,
    absentCount,
    attendancePercentage,
  };
}

export type StudentSubmissionMetrics = {
  totalSubmissions: number;
  approvedSubmissions: number;
  pendingSubmissions: number;
  rejectedSubmissions: number;
};

export async function getStudentSubmissionMetrics(
  studentId: string
): Promise<StudentSubmissionMetrics> {
  const totalSubmissions = await db.submission.count({
    where: {
      studentId,
    },
  });

  const approvedSubmissions = await db.submission.count({
    where: {
      studentId,
      status: "APPROVED",
    },
  });

  const pendingSubmissions = await db.submission.count({
    where: {
      studentId,
      status: "PENDING",
    },
  });

  const rejectedSubmissions = await db.submission.count({
    where: {
      studentId,
      status: "REJECTED",
    },
  });

  return {
    totalSubmissions,
    approvedSubmissions,
    pendingSubmissions,
    rejectedSubmissions,
  };
}

export async function getStudentProgress(studentId: string) {
  const attendance = await getStudentAttendanceMetrics(studentId);
  const submissions = await getStudentSubmissionMetrics(studentId);

  const completionScore = Math.round(
    (attendance.attendancePercentage +
      (submissions.approvedSubmissions > 0 ? 100 : 0)) / 2
  );

  return {
    attendance,
    submissions,
    completionScore,
  };
}