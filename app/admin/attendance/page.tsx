import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AdminAttendancePage() {
  await requireRole("ADMIN");

  const sessions = await db.attendanceSession.findMany({
    orderBy: {
      createdAt: "desc",
    },
    include: {
      teacher: {
        include: {
          user: true,
        },
      },
      attendanceRecords: {
        include: {
          student: {
            include: {
              user: true,
            },
          },
        },
      },
    },
  });

  const totalSessions = sessions.length;
  const activeSessions = sessions.filter((session) => session.isActive).length;
  const closedSessions = sessions.filter((session) => !session.isActive).length;
  const totalCheckIns = sessions.reduce(
    (sum, session) => sum + session.attendanceRecords.length,
    0
  );

  return (
    <main className="space-y-6">
      <section className="overflow-hidden rounded-[2rem] bg-gradient-to-r from-emerald-900 via-green-700 to-lime-500 p-6 text-white shadow-lg shadow-emerald-200/50 sm:p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-50/90">
          Attendance
        </p>

        <h1 className="mt-3 text-3xl font-bold sm:text-4xl">
          Training Attendance Overview
        </h1>

        <p className="mt-4 max-w-3xl text-sm leading-7 text-emerald-50/90 sm:text-base">
          Review attendance sessions, monitor class participation, and track student
          check-ins across all training tracks.
        </p>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Sessions" value={totalSessions} />
        <StatCard
          label="Active Sessions"
          value={activeSessions}
          tone="bg-emerald-50"
          valueClass="text-emerald-700"
        />
        <StatCard
          label="Closed Sessions"
          value={closedSessions}
          tone="bg-slate-50"
          valueClass="text-slate-700"
        />
        <StatCard
          label="Total Check-ins"
          value={totalCheckIns}
          tone="bg-lime-50"
          valueClass="text-lime-700"
        />
      </section>

      <section className="grid gap-6">
        {sessions.length > 0 ? (
          sessions.map((session) => (
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
                    <p>Teacher: {session.teacher.user.name}</p>
                    <p>Session Code: {session.code}</p>
                    <p>Ends: {new Date(session.endsAt).toLocaleString()}</p>
                  </div>
                </div>
              </div>

              <div className="mt-6 rounded-[1.5rem] border border-emerald-100 bg-emerald-50/50 p-5">
                <p className="text-sm font-semibold uppercase tracking-[0.14em] text-emerald-700">
                  Students Recorded
                </p>

                <h4 className="mt-2 text-2xl font-bold text-slate-900">
                  {session.attendanceRecords.length}
                </h4>
              </div>

              <div className="mt-6 grid gap-3">
                {session.attendanceRecords.length > 0 ? (
                  session.attendanceRecords.map((record) => (
                    <div
                      key={record.id}
                      className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="font-semibold text-slate-900">
                            {record.student.user.name}
                          </p>

                          <div className="mt-2 grid gap-1 text-sm text-slate-600 sm:grid-cols-2">
                            <p>Track: {record.student.track}</p>
                            <p>
                              Checked In:{" "}
                              {new Date(record.checkedInAt).toLocaleString()}
                            </p>
                          </div>
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
                    No students recorded for this session yet.
                  </p>
                )}
              </div>
            </article>
          ))
        ) : (
          <div className="rounded-[1.75rem] border border-emerald-100 bg-white p-6 shadow-sm">
            <p className="text-sm text-slate-600">
              No attendance sessions recorded yet.
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