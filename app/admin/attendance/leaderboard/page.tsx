import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

const PER_PAGE_OPTIONS = [10, 25, 50, 100];

function buildLeaderboardUrl(params: {
  q?: string;
  track?: string;
  page?: number;
  perPage?: number;
}) {
  const search = new URLSearchParams();

  if (params.q && params.q.trim()) search.set("q", params.q.trim());
  if (params.track && params.track !== "ALL") search.set("track", params.track);
  if (params.page && params.page > 1) search.set("page", String(params.page));
  if (params.perPage) search.set("perPage", String(params.perPage));

  const query = search.toString();
  return query ? `/admin/attendance/leaderboard?${query}` : "/admin/attendance/leaderboard";
}

export default async function AdminAttendanceLeaderboardPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    track?: string;
    page?: string;
    perPage?: string;
  }>;
}) {
  await requireRole("ADMIN");
  const params = await searchParams;

  const q = params.q?.trim() ?? "";
  const track = params.track ?? "ALL";

  const rawPage = Number(params.page ?? "1");
  const rawPerPage = Number(params.perPage ?? "10");

  const perPage = PER_PAGE_OPTIONS.includes(rawPerPage) ? rawPerPage : 10;
  const page = Number.isFinite(rawPage) && rawPage > 0 ? rawPage : 1;

  const trackRows = await db.student.findMany({
    select: {
      track: true,
    },
    distinct: ["track"],
  });

  const trackOptions = trackRows.map((row) => row.track).sort();

  const students = await db.student.findMany({
    where: {
      AND: [
        track !== "ALL" ? { track } : {},
        q
          ? {
              user: {
                name: {
                  contains: q,
                  mode: "insensitive",
                },
              },
            }
          : {},
      ],
    },
    include: {
      user: true,
      attendanceRecords: true,
    },
  });

  const leaderboard = students
    .map((student) => {
      const presentCount = student.attendanceRecords.filter(
        (record) => record.status === "PRESENT"
      ).length;

      const absentCount = student.attendanceRecords.filter(
        (record) => record.status === "ABSENT"
      ).length;

      const total = presentCount + absentCount;
      const percentage =
        total > 0 ? Math.round((presentCount / total) * 100) : 0;

      return {
        id: student.id,
        name: student.user.name,
        track: student.track,
        percentage,
        presentCount,
        absentCount,
        total,
      };
    })
    .sort((a, b) => {
      if (b.percentage !== a.percentage) return b.percentage - a.percentage;
      if (b.presentCount !== a.presentCount) return b.presentCount - a.presentCount;
      return a.name.localeCompare(b.name);
    });

  const totalResults = leaderboard.length;
  const totalPages = Math.max(1, Math.ceil(totalResults / perPage));
  const currentPage = Math.min(page, totalPages);
  const startIndex = (currentPage - 1) * perPage;
  const paginatedLeaderboard = leaderboard.slice(startIndex, startIndex + perPage);

  const hasPreviousPage = currentPage > 1;
  const hasNextPage = currentPage < totalPages;

  return (
    <main className="space-y-4">
      <section className="overflow-hidden border border-emerald-200 bg-gradient-to-r from-emerald-950 via-emerald-700 to-lime-500 px-4 py-4 text-white shadow-[0_18px_45px_-22px_rgba(16,185,129,0.55)] sm:px-5">
        <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-emerald-100/90">
          Attendance Leaderboard
        </p>

        <h1 className="mt-1.5 text-xl font-bold sm:text-2xl">
          Student Attendance Ranking
        </h1>

        <p className="mt-2 text-xs text-emerald-50/90 sm:text-sm">
          See attendance performance across all tracks, ranked from highest to lowest.
        </p>
      </section>

      <section className="border border-emerald-100 bg-white p-4 shadow-sm">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-emerald-700">
            Search & Filters
          </p>
          <h2 className="mt-1 text-lg font-bold text-slate-900">
            Filter Ranking
          </h2>
        </div>

        <p className="mt-1.5 text-xs text-slate-600 sm:text-sm">
          Search students by name and filter the ranking by track.
        </p>

        <form className="mt-4 grid gap-3 md:grid-cols-3">
          <input
            name="q"
            type="text"
            defaultValue={q}
            placeholder="Search student name"
            className="border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-green-600"
          />

          <select
            name="track"
            defaultValue={track}
            className="border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-green-600"
          >
            <option value="ALL">All Tracks</option>
            {trackOptions.map((trackOption) => (
              <option key={trackOption} value={trackOption}>
                {trackOption}
              </option>
            ))}
          </select>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="submit"
              className="bg-green-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-green-800"
            >
              Apply
            </button>

            <a
              href="/admin/attendance/leaderboard"
              className="bg-slate-200 px-4 py-2.5 text-center text-sm font-semibold text-slate-800 transition hover:bg-slate-300"
            >
              Reset
            </a>
          </div>
        </form>
      </section>

      <section className="border border-emerald-100 bg-white p-4 shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full border-separate border-spacing-y-2">
            <thead>
              <tr className="text-left text-xs font-semibold uppercase tracking-[0.12em] text-slate-500 sm:text-sm">
                <th className="px-3 py-2">Rank</th>
                <th className="px-3 py-2">Student Name</th>
                <th className="px-3 py-2">Track</th>
                <th className="px-3 py-2">Attendance %</th>
                <th className="px-3 py-2">Present</th>
                <th className="px-3 py-2">Absent</th>
              </tr>
            </thead>

            <tbody>
              {paginatedLeaderboard.length > 0 ? (
                paginatedLeaderboard.map((student, index) => (
                  <tr
                    key={student.id}
                    className="bg-slate-50 ring-1 ring-slate-200"
                  >
                    <td className="px-3 py-3 font-bold text-slate-900">
                      #{startIndex + index + 1}
                    </td>
                    <td className="px-3 py-3 font-semibold text-slate-900">
                      {student.name}
                    </td>
                    <td className="px-3 py-3 text-slate-700">{student.track}</td>
                    <td className="px-3 py-3">
                      <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700 sm:text-sm">
                        {student.percentage}%
                      </span>
                    </td>
                    <td className="px-3 py-3 font-semibold text-green-700">
                      {student.presentCount}
                    </td>
                    <td className="px-3 py-3 font-semibold text-red-600">
                      {student.absentCount}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-sm text-slate-600">
                    No students matched your current filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="border border-emerald-100 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {hasPreviousPage ? (
              <a
                href={buildLeaderboardUrl({
                  q,
                  track,
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
                href={buildLeaderboardUrl({
                  q,
                  track,
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
            <input type="hidden" name="q" value={q} />
            <input type="hidden" name="track" value={track} />
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
          Total results: {totalResults} • Page {currentPage} of {totalPages}
        </p>
      </section>
    </main>
  );
}