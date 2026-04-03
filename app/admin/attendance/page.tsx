import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

const PER_PAGE_OPTIONS = [3, 10, 25, 50, 100];

function buildAttendanceUrl(params: {
  page?: number;
  perPage?: number;
}) {
  const search = new URLSearchParams();

  if (params.page && params.page > 1) {
    search.set("page", String(params.page));
  }

  if (params.perPage) {
    search.set("perPage", String(params.perPage));
  }

  const query = search.toString();
  return query ? `/admin/attendance?${query}` : "/admin/attendance";
}

export default async function AdminAttendancePage({
  searchParams,
}: {
  searchParams?: Promise<{
    page?: string;
    perPage?: string;
  }>;
}) {
  await requireRole("ADMIN");

  const params = (await searchParams) ?? {};
  const rawPage = Number(params.page ?? "1");
  const rawPerPage = Number(params.perPage ?? "3");

  const perPage = PER_PAGE_OPTIONS.includes(rawPerPage) ? rawPerPage : 3;
  const page = Number.isFinite(rawPage) && rawPage > 0 ? rawPage : 1;

  const totalSessions = await db.attendanceSession.count();

  const totalPages = Math.max(1, Math.ceil(totalSessions / perPage));
  const currentPage = Math.min(page, totalPages);
  const skip = (currentPage - 1) * perPage;

  const sessions = await db.attendanceSession.findMany({
    orderBy: {
      createdAt: "desc",
    },
    skip,
    take: perPage,
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

  const allSessions = await db.attendanceSession.findMany({
    include: {
      attendanceRecords: true,
    },
  });

  const activeSessions = allSessions.filter((session) => session.isActive).length;
  const closedSessions = allSessions.filter((session) => !session.isActive).length;
  const totalCheckIns = allSessions.reduce(
    (sum, session) => sum + session.attendanceRecords.length,
    0
  );

  const hasPreviousPage = currentPage > 1;
  const hasNextPage = currentPage < totalPages;

  return (
    <main className="space-y-4">
      <section className="overflow-hidden border border-emerald-200 bg-gradient-to-r from-emerald-950 via-emerald-700 to-lime-500 px-4 py-4 text-white shadow-[0_18px_45px_-22px_rgba(16,185,129,0.55)] sm:px-5">
        <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-emerald-100/90">
          Attendance
        </p>

        <h1 className="mt-1.5 text-xl font-bold sm:text-2xl">
          Training Attendance Overview
        </h1>

        <p className="mt-2 text-xs text-emerald-50/90 sm:text-sm">
          Review attendance sessions and track check-ins from one central workspace.
        </p>
      </section>

      <section className="grid grid-cols-2 gap-2.5 xl:grid-cols-4">
        <StatCard
          label="Total Sessions"
          value={totalSessions}
          note="All attendance sessions"
          soft="from-emerald-50 to-white"
          border="border-emerald-100"
          line="from-emerald-600 to-green-500"
          valueColor="text-emerald-800"
        />
        <StatCard
          label="Active Sessions"
          value={activeSessions}
          note="Open attendance windows"
          soft="from-green-50 to-white"
          border="border-green-100"
          line="from-green-600 to-emerald-600"
          valueColor="text-green-700"
        />
        <StatCard
          label="Closed Sessions"
          value={closedSessions}
          note="Completed attendance windows"
          soft="from-slate-50 to-white"
          border="border-slate-200"
          line="from-slate-500 to-slate-400"
          valueColor="text-slate-700"
        />
        <StatCard
          label="Total Check-ins"
          value={totalCheckIns}
          note="Recorded attendance entries"
          soft="from-lime-50 to-white"
          border="border-lime-100"
          line="from-lime-500 to-emerald-500"
          valueColor="text-lime-700"
        />
      </section>

      <section className="space-y-3">
        {sessions.length > 0 ? (
          sessions.map((session) => (
            <article
              key={session.id}
              className="border border-emerald-100 bg-white p-4 shadow-sm transition hover:shadow-md"
            >
              <div className="flex flex-col gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-base font-bold text-slate-900 sm:text-lg">
                      {session.title}
                    </h3>

                    <span
                      className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] ${
                        session.isActive
                          ? "bg-green-100 text-green-700"
                          : "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {session.isActive ? "Active" : "Closed"}
                    </span>
                  </div>

                  <div className="mt-3 grid gap-1.5 text-[11px] text-slate-600 sm:grid-cols-2 sm:text-xs">
                    <p>
                      <span className="font-semibold text-slate-700">Track:</span>{" "}
                      {session.track}
                    </p>
                    <p>
                      <span className="font-semibold text-slate-700">Teacher:</span>{" "}
                      {session.teacher.user.name}
                    </p>
                    <p>
                      <span className="font-semibold text-slate-700">Session Code:</span>{" "}
                      {session.code}
                    </p>
                    <p>
                      <span className="font-semibold text-slate-700">Ends:</span>{" "}
                      {new Date(session.endsAt).toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="border border-emerald-100 bg-emerald-50/60 p-3">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-emerald-700 sm:text-xs">
                    Students Recorded
                  </p>

                  <h4 className="mt-1 text-lg font-bold text-slate-900 sm:text-xl">
                    {session.attendanceRecords.length}
                  </h4>
                </div>

                <div className="grid gap-2">
                  {session.attendanceRecords.length > 0 ? (
                    session.attendanceRecords.map((record) => (
                      <div
                        key={record.id}
                        className="border border-slate-200 bg-slate-50 p-3"
                      >
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <p className="text-sm font-semibold text-slate-900">
                              {record.student.user.name}
                            </p>

                            <div className="mt-1.5 grid gap-1 text-[11px] text-slate-600 sm:grid-cols-2 sm:text-xs">
                              <p>
                                <span className="font-semibold text-slate-700">
                                  Track:
                                </span>{" "}
                                {record.student.track}
                              </p>
                              <p>
                                <span className="font-semibold text-slate-700">
                                  Checked In:
                                </span>{" "}
                                {new Date(record.checkedInAt).toLocaleString()}
                              </p>
                            </div>
                          </div>

                          <span
                            className={`w-fit rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] ${
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
                    <div className="border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600">
                      No students recorded for this session yet.
                    </div>
                  )}
                </div>
              </div>
            </article>
          ))
        ) : (
          <div className="border border-emerald-100 bg-white p-4 shadow-sm">
            <p className="text-sm text-slate-600">
              No attendance sessions recorded yet.
            </p>
          </div>
        )}
      </section>

      <section className="border border-emerald-100 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {hasPreviousPage ? (
              <a
                href={buildAttendanceUrl({
                  page: currentPage - 1,
                  perPage,
                })}
                className="border border-emerald-200 bg-white px-4 py-2.5 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-50"
              >
                ← Prev
              </a>
            ) : (
              <span className="border border-slate-200 bg-slate-100 px-4 py-2.5 text-sm font-semibold text-slate-400">
                ← Prev
              </span>
            )}

            {hasNextPage ? (
              <a
                href={buildAttendanceUrl({
                  page: currentPage + 1,
                  perPage,
                })}
                className="border border-emerald-200 bg-white px-4 py-2.5 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-50"
              >
                Next →
              </a>
            ) : (
              <span className="border border-slate-200 bg-slate-100 px-4 py-2.5 text-sm font-semibold text-slate-400">
                Next →
              </span>
            )}

            <p className="text-sm font-semibold text-slate-900">
              Page: <span className="ml-1">{currentPage}</span>
            </p>
          </div>

          <form className="flex flex-wrap items-center gap-2 sm:gap-3">
            <input type="hidden" name="page" value="1" />

            <label
              htmlFor="perPage"
              className="text-sm font-semibold text-slate-900"
            >
              Per page:
            </label>

            <select
              id="perPage"
              name="perPage"
              defaultValue={String(perPage)}
              className="border border-emerald-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-900 outline-none transition focus:border-emerald-500"
            >
              {PER_PAGE_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>

            <button
              type="submit"
              className="bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-800"
            >
              Apply
            </button>
          </form>
        </div>

        <p className="mt-3 text-sm font-semibold text-slate-800">
          Total results: {totalSessions} • Page {currentPage} of {totalPages}
        </p>
      </section>
    </main>
  );
}

function StatCard({
  label,
  value,
  note,
  soft,
  border,
  line,
  valueColor,
}: {
  label: string;
  value: string | number;
  note: string;
  soft: string;
  border: string;
  line: string;
  valueColor: string;
}) {
  return (
    <div
      className={`border bg-gradient-to-br ${soft} ${border} p-3 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md`}
    >
      <div className={`h-1.5 w-16 bg-gradient-to-r ${line}`} />

      <p className="mt-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500 sm:text-[11px]">
        {label}
      </p>

      <h2 className={`mt-1 text-base font-bold sm:text-lg ${valueColor}`}>
        {value}
      </h2>

      <p className="mt-1 text-[10px] leading-4 text-slate-600 sm:text-[11px]">
        {note}
      </p>
    </div>
  );
}