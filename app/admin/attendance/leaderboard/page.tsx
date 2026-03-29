import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AdminAttendanceLeaderboardPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    track?: string;
  }>;
}) {
  await requireRole("ADMIN");
  const params = await searchParams;

  const q = params.q?.trim() ?? "";
  const track = params.track ?? "ALL";

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
      const percentage = total > 0 ? Math.round((presentCount / total) * 100) : 0;

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

  return (
    <main className="space-y-6">
      <section className="overflow-hidden rounded-[2rem] bg-gradient-to-r from-emerald-900 via-green-700 to-lime-500 p-6 text-white shadow-lg shadow-emerald-200/50 sm:p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-50/90">
          Attendance Leaderboard
        </p>

        <h1 className="mt-3 text-3xl font-bold sm:text-4xl">
          Student Attendance Ranking
        </h1>

        <p className="mt-4 max-w-3xl text-sm leading-7 text-emerald-50/90 sm:text-base">
          See attendance performance across all tracks, ranked from most present
          to least present.
        </p>
      </section>

      <section className="rounded-[1.75rem] border border-emerald-100 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-bold text-slate-900">Search & Track Filter</h2>
        <p className="mt-1 text-sm text-slate-600">
          Search students by name and filter the ranking by track.
        </p>

        <form className="mt-6 grid gap-4 md:grid-cols-3">
          <input
            name="q"
            type="text"
            defaultValue={q}
            placeholder="Search student name"
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

          <div className="flex gap-3">
            <button
              type="submit"
              className="flex-1 rounded-xl bg-green-700 px-5 py-3 font-semibold text-white hover:bg-green-800"
            >
              Apply
            </button>

            <a
              href="/admin/attendance/leaderboard"
              className="flex-1 rounded-xl bg-slate-200 px-5 py-3 text-center font-semibold text-slate-800 hover:bg-slate-300"
            >
              Reset
            </a>
          </div>
        </form>
      </section>

      <section className="rounded-[1.75rem] border border-emerald-100 bg-white p-6 shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full border-separate border-spacing-y-3">
            <thead>
              <tr className="text-left text-sm font-semibold text-slate-500">
                <th className="px-4 py-2">Rank</th>
                <th className="px-4 py-2">Student Name</th>
                <th className="px-4 py-2">Track</th>
                <th className="px-4 py-2">Attendance %</th>
                <th className="px-4 py-2">Present</th>
                <th className="px-4 py-2">Absent</th>
              </tr>
            </thead>

            <tbody>
              {leaderboard.length > 0 ? (
                leaderboard.map((student, index) => (
                  <tr
                    key={student.id}
                    className="rounded-2xl bg-slate-50 ring-1 ring-slate-200"
                  >
                    <td className="px-4 py-4 font-bold text-slate-900">
                      #{index + 1}
                    </td>
                    <td className="px-4 py-4 font-semibold text-slate-900">
                      {student.name}
                    </td>
                    <td className="px-4 py-4 text-slate-700">{student.track}</td>
                    <td className="px-4 py-4">
                      <span className="rounded-full bg-emerald-100 px-3 py-1 text-sm font-semibold text-emerald-700">
                        {student.percentage}%
                      </span>
                    </td>
                    <td className="px-4 py-4 font-semibold text-green-700">
                      {student.presentCount}
                    </td>
                    <td className="px-4 py-4 font-semibold text-red-600">
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
    </main>
  );
}