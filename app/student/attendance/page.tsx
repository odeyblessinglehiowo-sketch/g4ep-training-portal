import { requireRole } from "@/lib/auth";
export const dynamic = "force-dynamic";
import { db } from "@/lib/db";
import { syncExpiredAttendanceSessions } from "@/lib/attendance";

export default async function StudentAttendancePage() {
  const currentUser = await requireRole("STUDENT");

  await syncExpiredAttendanceSessions();

  const studentUser = await db.user.findUnique({
    where: {
      id: currentUser.userId,
    },
    include: {
      student: {
        include: {
          attendanceRecords: {
            include: {
              session: true,
            },
            orderBy: {
              createdAt: "desc",
            },
          },
        },
      },
    },
  });

  if (!studentUser || !studentUser.student) {
    throw new Error("Student record not found.");
  }

  const student = studentUser.student;
  const attendanceRecords = student.attendanceRecords ?? [];

  const presentCount = attendanceRecords.filter(
    (record) => record.status === "PRESENT"
  ).length;

  const absentCount = attendanceRecords.filter(
    (record) => record.status === "ABSENT"
  ).length;

  const totalCount = attendanceRecords.length;

  const attendanceRate =
    totalCount > 0 ? Math.round((presentCount / totalCount) * 100) : 0;

  return (
    <main className="space-y-6">
      <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-green-700">
          Attendance
        </p>

        <h1 className="mt-2 text-3xl font-bold text-slate-900">
          Class Attendance
        </h1>

        <p className="mt-2 text-sm text-slate-600">
          Scan the QR code shared in class and your attendance will be marked automatically.
        </p>
      </section>

      <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <div className="mb-4 rounded-2xl bg-green-50 p-4">
          <p className="text-sm font-medium text-slate-600">Your Track</p>
          <p className="mt-1 text-lg font-bold text-green-800">
            {student.track ?? "Not Assigned"}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-sm font-semibold text-slate-900">
            How attendance works now
          </p>
          <div className="mt-3 space-y-2 text-sm text-slate-600">
            <p>1. Open your phone camera and scan the class QR code.</p>
            <p>2. The portal opens and marks your attendance instantly.</p>
            <p>3. If the session closes before you scan, it will show as absent automatically.</p>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <p className="text-sm font-medium text-slate-500">Present</p>
          <p className="mt-2 text-3xl font-bold text-green-700">{presentCount}</p>
        </div>

        <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <p className="text-sm font-medium text-slate-500">Absent</p>
          <p className="mt-2 text-3xl font-bold text-red-600">{absentCount}</p>
        </div>

        <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <p className="text-sm font-medium text-slate-500">Attendance Rate</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">
            {attendanceRate}%
          </p>
        </div>
      </section>

      <section className="space-y-4">
        <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <h2 className="text-xl font-bold text-slate-900">
            Attendance History
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            View your present and absent attendance records here.
          </p>
        </div>

        {attendanceRecords.length > 0 ? (
          attendanceRecords.map((record) => (
            <div
              key={record.id}
              className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    {record.session.title}
                  </h3>

                  <p className="mt-2 text-sm text-slate-600">
                    Track: {record.session.track}
                  </p>

                  <p className="mt-1 text-sm text-slate-600">
                    Recorded At: {new Date(record.checkedInAt).toLocaleString()}
                  </p>

                  <p className="mt-1 text-sm text-slate-600">
                    Session Ends: {new Date(record.session.endsAt).toLocaleString()}
                  </p>
                </div>

                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    record.status === "PRESENT"
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {record.status}
                </span>
              </div>
            </div>
          ))
        ) : (
          <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <p className="text-sm text-slate-600">
              No attendance records found yet.
            </p>
          </div>
        )}
      </section>
    </main>
  );
}