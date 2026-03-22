import { requireRole } from "@/lib/auth";
export const dynamic = "force-dynamic";
import { db } from "@/lib/db";
import { syncExpiredAttendanceSessions } from "@/lib/attendance";

export default async function AdminAttendancePage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    track?: string;
    sessionStatus?: string;
    attendanceStatus?: string;
  }>;
}) {
  await requireRole("ADMIN");
  const params = await searchParams;

  await syncExpiredAttendanceSessions();

  const q = params.q?.trim() ?? "";
  const track = params.track ?? "ALL";
  const sessionStatus = params.sessionStatus ?? "ALL";
  const attendanceStatus = params.attendanceStatus ?? "ALL";

  const trackRows = await db.attendanceSession.findMany({
    select: {
      track: true,
    },
    distinct: ["track"],
  });

  const trackOptions = trackRows.map((row) => row.track).sort();

  const sessions = await db.attendanceSession.findMany({
    where: {
      AND: [
        q
          ? {
              OR: [
                {
                  title: {
                    contains: q,
                  },
                },
                {
                  code: {
                    contains: q,
                  },
                },
                {
                  teacher: {
                    user: {
                      name: {
                        contains: q,
                      },
                    },
                  },
                },
              ],
            }
          : {},
        track !== "ALL"
          ? {
              track,
            }
          : {},
        sessionStatus === "ACTIVE"
          ? {
              isActive: true,
            }
          : sessionStatus === "CLOSED"
          ? {
              isActive: false,
            }
          : {},
        attendanceStatus !== "ALL"
          ? {
              attendanceRecords: {
                some: {
                  status: attendanceStatus as "PRESENT" | "ABSENT",
                },
              },
            }
          : {},
      ],
    },
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
        orderBy: {
          checkedInAt: "asc",
        },
      },
    },
  });

  const totalSessions = sessions.length;
  const totalPresent = sessions.reduce(
    (sum, session) =>
      sum +
      session.attendanceRecords.filter((record) => record.status === "PRESENT").length,
    0
  );
  const totalAbsent = sessions.reduce(
    (sum, session) =>
      sum +
      session.attendanceRecords.filter((record) => record.status === "ABSENT").length,
    0
  );

  return (
    <main className="space-y-6">
      <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-green-700">
          Attendance
        </p>

        <h1 className="mt-2 text-3xl font-bold text-slate-900">
          Training Attendance Overview
        </h1>

        <p className="mt-2 text-sm text-slate-600">
          Search and review attendance sessions, present students, and absentees across all tracks.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <p className="text-sm font-medium text-slate-500">Sessions Shown</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">{totalSessions}</p>
        </div>

        <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <p className="text-sm font-medium text-slate-500">Present Records</p>
          <p className="mt-2 text-3xl font-bold text-green-700">{totalPresent}</p>
        </div>

        <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <p className="text-sm font-medium text-slate-500">Absent Records</p>
          <p className="mt-2 text-3xl font-bold text-red-600">{totalAbsent}</p>
        </div>
      </section>

      <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <h2 className="text-xl font-bold text-slate-900">Search & Filters</h2>
        <p className="mt-1 text-sm text-slate-600">
          Search by session title, teacher, or code. Filter by track, session state, and attendance status.
        </p>

        <form className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <input
            name="q"
            type="text"
            defaultValue={q}
            placeholder="Search title, teacher, or code"
            className="rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-green-600"
          />

          <select
            name="track"
            defaultValue={track}
            className="rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-green-600"
          >
            <option value="ALL">All Tracks</option>
            {trackOptions.map((trackOption) => (
              <option key={trackOption} value={trackOption}>
                {trackOption}
              </option>
            ))}
          </select>

          <select
            name="sessionStatus"
            defaultValue={sessionStatus}
            className="rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-green-600"
          >
            <option value="ALL">All Session States</option>
            <option value="ACTIVE">Active</option>
            <option value="CLOSED">Closed</option>
          </select>

          <select
            name="attendanceStatus"
            defaultValue={attendanceStatus}
            className="rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-green-600"
          >
            <option value="ALL">All Attendance Statuses</option>
            <option value="PRESENT">Present</option>
            <option value="ABSENT">Absent</option>
          </select>

          <div className="flex gap-3">
            <button
              type="submit"
              className="flex-1 rounded-xl bg-green-700 px-5 py-3 font-semibold text-white transition duration-200 hover:bg-green-800 active:scale-[0.97] active:shadow-inner"
            >
              Apply
            </button>

            <a
              href="/admin/attendance"
              className="flex-1 rounded-xl bg-slate-200 px-5 py-3 text-center font-semibold text-slate-800 transition duration-200 hover:bg-slate-300 active:scale-[0.97] active:shadow-inner"
            >
              Reset
            </a>
          </div>
        </form>
      </section>

      <section className="grid gap-6">
        {sessions.length > 0 ? (
          sessions.map((session) => {
            const filteredRecords =
              attendanceStatus === "ALL"
                ? session.attendanceRecords
                : session.attendanceRecords.filter(
                    (record) => record.status === attendanceStatus
                  );

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
                      Teacher: {session.teacher.user.name}
                    </p>

                    <p className="mt-1 text-sm text-slate-600">
                      Session Code: {session.code}
                    </p>

                    <p className="mt-1 text-sm text-slate-600">
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

                <div className="mt-6 grid gap-4 md:grid-cols-2">
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
                </div>

                <div className="mt-6">
                  <p className="text-sm font-semibold text-slate-800">
                    Attendance Records
                    {attendanceStatus !== "ALL" ? ` (${attendanceStatus})` : ""}
                  </p>

                  <div className="mt-4 grid gap-3">
                    {filteredRecords.length > 0 ? (
                      filteredRecords.map((record) => (
                        <div
                          key={record.id}
                          className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200"
                        >
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div>
                              <p className="font-semibold text-slate-900">
                                {record.student.user.name}
                              </p>

                              <p className="mt-1 text-sm text-slate-600">
                                Track: {record.student.track}
                              </p>

                              <p className="mt-1 text-sm text-slate-600">
                                Recorded At:{" "}
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
                        No records matched the selected attendance status.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <p className="text-sm text-slate-600">
              No attendance sessions matched your current filters.
            </p>
          </div>
        )}
      </section>
    </main>
  );
}