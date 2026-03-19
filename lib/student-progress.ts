import { db } from "@/lib/db";

export async function getStudentAttendanceMetrics(studentId: string) {
  const records = await db.attendanceRecord.findMany({
    where: {
      studentId,
    },
    select: {
      status: true,
    },
  });

  const presentCount = records.filter((record) => record.status === "PRESENT").length;
  const absentCount = records.filter((record) => record.status === "ABSENT").length;
  const totalSessions = records.length;

  const attendancePercentage =
    totalSessions > 0 ? Math.round((presentCount / totalSessions) * 100) : 0;

  return {
    totalSessions,
    presentCount,
    absentCount,
    attendancePercentage,
  };
}