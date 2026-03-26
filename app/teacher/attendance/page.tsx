import QRCode from "qrcode";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { syncExpiredAttendanceSessions } from "@/lib/attendance";
import { createAttendanceSession } from "./actions";

export const dynamic = "force-dynamic";

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

  const totalSessions = sessions.length;
  const activeSessions = sessions.filter((session) => session.isActive).length;
  const totalPresent = sessions.reduce(
    (sum, session) =>
      sum +
      session.attendanceRecords.filter((record) => record.status === "PRESENT")
        .length,
    0
  );
  const totalAbsent = sessions.reduce(
    (sum, session) =>
      sum +
      session.attendanceRecords.filter((record) => record.status === "ABSENT")
        .length,
    0
  );

  return (
    <main className="space-y-6">
      <section className="overflow-hidden rounded-[2rem] bg-gradient-to-r from-emerald-800 via-green-700 to-lime-500 p-6 text-white shadow-lg shadow-emerald-200/50 sm:p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-50/90">
          Attendance
        </p>

        <h1 className="mt-3 text-3xl font-bold sm:text-4xl">
          Attendance Sessions
        </h1>

        <p className="mt-4 max-w-3xl text-sm leading-7 text-emerald-50/90 sm:text-base">
          Create attendance sessions, display QR codes for instant check-in,
          and monitor present and absent students across your assigned track.
        </p>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Track Students" value={totalStudentsInTrack} />
        <StatCard
          label="Sessions"
          value={totalSessions}
          tone="bg-white"
          valueClass="text-slate-900"
        />
        <StatCard
          label="Active Sessions"
          value={activeSessions}
          tone="bg-emerald-50"
          valueClass="text-emerald-700"
        />
        <StatCard
          label="Total Check-ins"
          value={totalPresent}
          tone="bg-lime-50"
          valueClass="text-lime-700"
        />
      </section>

      {error && (
        <section className="rounded-[1.75rem] border border-red-200 bg-red-50 p-5 shadow-sm ring-1 ring-red-100">
          <p className="text-base font-bold text-red-800">
            Attendance session could not be created
          </p>
          <p className="mt-1 text-sm text-slate-700">{error}</p>
        </section>
      )}

      {success === "created" && sessionTitle && (
        <section className="rounded-[1.75rem] border border-green-200 bg-green-50 p-5 shadow-sm ring-1 ring-green-100">
          <p className="text-base font-bold text-green-800">
            Attendance session created
          </p>
          <p className="mt-1 text-sm text-slate-700">
            {sessionTitle} is now live and ready for students to scan.
          </p>
        </section>
      )}

      <section className="grid gap-6 xl:grid-cols-[1fr_0.95fr]">
        <section className="rounded-[1.75rem] border border-emerald-100 bg-white p-6 shadow-sm">
          <div className="mb-5 rounded-[1.5rem] bg-emerald-50 p-4 ring-1 ring-emerald-100">
            <p className="text-sm font-medium text-slate-600">Assigned Track</p>
            <p className="mt-1 text-lg font-bold text-emerald-800">
              {teacher.track}
            </p>
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
              className="rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-green-700"
            />

            <input
              name="duration"
              type="number"
              min="1"
              placeholder="Duration in minutes e.g. 30"
              className="rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-green-700"
            />

            <button
              type="submit"
              className="md:col-span-2 rounded-xl bg-green-700 py-3 font-semibold text-white transition hover:bg-green-800 active:scale-[0.98]"
            >
              Start Attendance Session
            </button>
          </form>
        </section>

        <section className="rounded-[1.75rem] border border-emerald-100 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900">Attendance Summary</h2>
          <p className="mt-1 text-sm text-slate-600">
            Quick overview of your attendance workflow across all sessions.
          </p>

          <div className="mt-6 space-y-4">
            <SummaryRow label="Track" value={teacher.track} />
            <SummaryRow label="Students" value={`${totalStudentsInTrack}`} />
            <SummaryRow label="Active Sessions" value={`${activeSessions}`} />
            <SummaryRow label="Present Records" value={`${totalPresent}`} />
            <SummaryRow label="Absent Records" value={`${totalAbsent}`} />
          </div>
        </section>
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
                <article
                  key={session.id}
                  className="rounded-[1.75rem] border border-emerald-100 bg-white p-6 shadow-sm transition hover:shadow-md"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <div className="flex flex-wrap items-center gap-3">
                        <h3 className="text-xl font-bold text-slate-900">
                          {session.title}
                        </h3>

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

                      <div className="mt-3 grid gap-2 text-sm text-slate-600 sm:grid-cols-2">
                        <p>Track: {session.track}</p>
                        <p>Starts: {new Date(session.startsAt).toLocaleString()}</p>
                        <p>Ends: {new Date(session.endsAt).toLocaleString()}</p>
                        <p>Expected: {totalStudentsInTrack}</p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 grid gap-4 md:grid-cols-3">
                    <MiniCard
                      label="Present"
                      value={presentCount}
                      soft="bg-green-50 ring-green-100"
                      valueClass="text-green-700"
                    />
                    <MiniCard
                      label="Absent"
                      value={absentCount}
                      soft="bg-red-50 ring-red-100"
                      valueClass="text-red-600"
                    />
                    <MiniCard
                      label="Expected"
                      value={totalStudentsInTrack}
                      soft="bg-slate-50 ring-slate-200"
                      valueClass="text-slate-900"
                    />
                  </div>

                  <div className="mt-6 grid gap-6 lg:grid-cols-2">
                    <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4">
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

                      <div className="mt-4 rounded-2xl bg-white p-4 ring-1 ring-slate-200">
                        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                          Linked URL
                        </p>
                        <p className="mt-2 break-all text-sm text-slate-800">
                          {qrTarget}
                        </p>
                      </div>
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
                </article>
              );
            })
          )
        ) : (
          <div className="rounded-[1.75rem] border border-emerald-100 bg-white p-6 shadow-sm">
            <p className="text-sm text-slate-600">
              No attendance sessions found yet.
            </p>
          </div>
        )}
      </section>
    </main>
  );
}

function StatCard({
  label,
  value,
  tone = "bg-white",
  valueClass = "text-slate-900",
}: {
  label: string;
  value: string | number;
  tone?: string;
  valueClass?: string;
}) {
  return (
    <div className={`rounded-[1.5rem] p-5 shadow-sm ring-1 ring-slate-200 ${tone}`}>
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className={`mt-2 text-3xl font-bold ${valueClass}`}>{value}</p>
    </div>
  );
}

function MiniCard({
  label,
  value,
  soft = "bg-slate-50 ring-slate-200",
  valueClass = "text-slate-900",
}: {
  label: string;
  value: string | number;
  soft?: string;
  valueClass?: string;
}) {
  return (
    <div className={`rounded-2xl p-4 ring-1 ${soft}`}>
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className={`mt-2 text-2xl font-bold ${valueClass}`}>{value}</p>
    </div>
  );
}

function SummaryRow({
  label,
  value,
}: {
  label: string;
  value?: string | null;
}) {
  return (
    <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
      <span className="text-sm font-medium text-slate-500">{label}</span>
      <span className="text-sm font-semibold text-slate-900">
        {value ?? "Not Available"}
      </span>
    </div>
  );
}