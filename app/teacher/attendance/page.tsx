import QRCode from "qrcode";
import { requireRole } from "@/lib/auth";
export const dynamic = "force-dynamic";
import { db } from "@/lib/db";
import { syncExpiredAttendanceSessions } from "@/lib/attendance";
import { createAttendanceSession } from "./actions";

export default async function TeacherAttendancePage({
  searchParams,
}: {
  searchParams: Promise<{
    success?: string;
    error?: string;
    title?: string;
  }>;
}) {
  const currentUser = await requireRole("TEACHER");
  const params = await searchParams;

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
    throw new Error("Teacher profile not found.");
  }

  const teacher = teacherUser.teacher;

  const totalStudentsInTrack = await db.student.count({
    where: {
      track: teacher.track,
    },
  });

  const sessions = await db.attendanceSession.findMany({
    where: {
      teacherId: teacher.id,
    },
    orderBy: {
      createdAt: "desc",
    },
    include: {
      attendanceRecords: {
        include: {
          student: {
            include: {
              user: true,
            },
          },
        },
        orderBy: {
          checkedInAt: "asc",
        },
      },
    },
  });

  const appUrl =
    process.env.APP_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    "http://localhost:3000";

  const success = params.success;
  const error = params.error;
  const sessionTitle = params.title;

  return (
    <main className="space-y-6">
      <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-green-700">
          Attendance
        </p>

        <h1 className="mt-2 text-3xl font-bold text-slate-900">
          Attendance Sessions
        </h1>

        <p className="mt-2 text-sm text-slate-600">
          Create attendance sessions and track present and absent students for your class.
        </p>
      </section>

      {error && (
        <section className="rounded-3xl border border-red-200 bg-red-50 p-5 shadow-sm ring-1 ring-red-100">
          <p className="text-base font-bold text-red-800">
            Attendance session could not be created
          </p>
          <p className="mt-1 text-sm text-slate-700">{error}</p>
        </section>
      )}

      {success === "created" && sessionTitle && (
        <section className="rounded-3xl border border-green-200 bg-green-50 p-5 shadow-sm ring-1 ring-green-100">
          <p className="text-base font-bold text-green-800">
            Attendance session created
          </p>
          <p className="mt-1 text-sm text-slate-700">
            {sessionTitle} is now live and ready for students to scan.
          </p>
        </section>
      )}

      <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <div className="mb-4 rounded-2xl bg-green-50 p-4">
          <p className="text-sm font-medium text-slate-600">Assigned Track</p>
          <p className="mt-1 text-lg font-bold text-green-800">{teacher.track}</p>
          <p className="mt-2 text-sm text-slate-600">
            Total students expected per session: {totalStudentsInTrack}
          </p>
        </div>

        <h2 className="text-xl font-bold text-slate-900">
          Start New Attendance Session
        </h2>

        <p className="mt-1 text-sm text-slate-600">
          Create a live session and let students scan the QR code to mark attendance instantly.
        </p>

        <form
          action={createAttendanceSession}
          className="mt-6 grid gap-4 md:grid-cols-2"
        >
          <input
            name="title"
            type="text"
            placeholder="Session title e.g. HTML Class - Morning"
            className="rounded-lg border border-slate-300 px-4 py-2 outline-none transition focus:border-green-700"
          />

          <input
            name="duration"
            type="number"
            min="1"
            placeholder="Duration in minutes e.g. 30"
            className="rounded-lg border border-slate-300 px-4 py-2 outline-none transition focus:border-green-700"
          />

          <button
            type="submit"
            className="md:col-span-2 rounded-lg bg-green-700 py-2 font-semibold text-white transition hover:bg-green-800 active:scale-[0.98]"
          >
            Start Attendance Session
          </button>
        </form>
      </section>

      <section className="grid gap-6">
        {sessions.length > 0 ? (
          await Promise.all(
            sessions.map(async (session) => {
              const qrTarget = `${appUrl}/student/attendance/scan?code=${encodeURIComponent(
                session.code
              )}`;

              const qrCodeDataUrl = await QRCode.toDataURL(qrTarget);

              const presentCount = session.attendanceRecords.filter(
                (record) => record.status === "PRESENT"
              ).length;

              const absentCount = session.attendanceRecords.filter(
                (record) => record.status === "ABSENT"
              ).length;

              return (
                <div
                  key={session.id}
                  className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-bold text-slate-900">
                        {session.title}
                      </h3>

                      <p className="mt-2 text-sm text-slate-600">
                        Track: {session.track}
                      </p>

                      <p className="mt-1 text-sm text-slate-600">
                        Session URL QR is linked to:
                      </p>
                      <p className="mt-1 break-all text-sm text-slate-800">
                        {qrTarget}
                      </p>

                      <p className="mt-2 text-sm text-slate-600">
                        Starts: {new Date(session.startsAt).toLocaleString()}
                      </p>

                      <p className="mt-1 text-sm text-slate-600">
                        Ends: {new Date(session.endsAt).toLocaleString()}
                      </p>
                    </div>

                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        session.isActive
                          ? "bg-green-100 text-green-700"
                          : "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {session.isActive ? "ACTIVE" : "CLOSED"}
                    </span>
                  </div>

                  <div className="mt-6 grid gap-4 md:grid-cols-3">
                    <div className="rounded-2xl bg-green-50 p-4 ring-1 ring-green-100">
                      <p className="text-sm font-medium text-slate-600">Present</p>
                      <p className="mt-2 text-2xl font-bold text-green-700">
                        {presentCount}
                      </p>
                    </div>

                    <div className="rounded-2xl bg-red-50 p-4 ring-1 ring-red-100">
                      <p className="text-sm font-medium text-slate-600">Absent</p>
                      <p className="mt-2 text-2xl font-bold text-red-600">
                        {absentCount}
                      </p>
                    </div>

                    <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
                      <p className="text-sm font-medium text-slate-600">Expected</p>
                      <p className="mt-2 text-2xl font-bold text-slate-900">
                        {totalStudentsInTrack}
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 grid gap-6 lg:grid-cols-2">
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <p className="text-sm font-semibold text-slate-800">
                        Attendance QR Code
                      </p>

                      <div className="mt-4 flex justify-center rounded-2xl bg-white p-4 ring-1 ring-slate-200">
                        <img
                          src={qrCodeDataUrl}
                          alt={`QR code for ${session.title}`}
                          className="h-44 w-44"
                        />
                      </div>

                      <p className="mt-3 text-center text-sm text-slate-600">
                        Students can scan this QR code and attendance will be marked immediately.
                      </p>
                    </div>

                    <div>
                      <p className="text-sm font-semibold text-slate-800">
                        Attendance Records
                      </p>

                      <div className="mt-4 grid gap-3">
                        {session.attendanceRecords.length > 0 ? (
                          session.attendanceRecords.map((record) => (
                            <div
                              key={record.id}
                              className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200"
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <p className="font-semibold text-slate-900">
                                    {record.student.user.name}
                                  </p>

                                  <p className="mt-1 text-sm text-slate-600">
                                    Recorded at:{" "}
                                    {new Date(record.checkedInAt).toLocaleString()}
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
                          <p className="text-sm text-slate-600">
                            No attendance records yet.
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )
        ) : (
          <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <p className="text-sm text-slate-600">
              No attendance sessions found yet.
            </p>
          </div>
        )}
      </section>
    </main>
  );
}