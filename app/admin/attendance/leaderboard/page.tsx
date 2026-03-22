import { db } from "@/lib/db";
export const dynamic = "force-dynamic";

export default async function AttendanceLeaderboard() {

  const students = await db.student.findMany({
    include: {
      user: true,
      attendanceRecords: true,
    },
  });

  const leaderboard = students
    .map((student) => ({
      name: student.user.name,
      track: student.track,
      totalAttendance: student.attendanceRecords.length,
    }))
    .sort((a, b) => b.totalAttendance - a.totalAttendance);

  return (
    <main className="space-y-6">

      <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-green-700">
          Attendance Leaderboard
        </p>

        <h1 className="mt-2 text-3xl font-bold text-slate-900">
          Most Consistent Students
        </h1>

        <p className="mt-2 text-sm text-slate-600">
          Students ranked by number of classes attended.
        </p>
      </section>

      <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">

        <table className="w-full text-left">
          <thead>
            <tr className="text-sm text-slate-500">
              <th className="pb-4">Rank</th>
              <th className="pb-4">Student</th>
              <th className="pb-4">Track</th>
              <th className="pb-4">Attendance</th>
            </tr>
          </thead>

          <tbody>
            {leaderboard.map((student, index) => (
              <tr key={index} className="border-t border-slate-200">

                <td className="py-4 font-bold text-green-700">
                  #{index + 1}
                </td>

                <td className="py-4 font-semibold text-slate-900">
                  {student.name}
                </td>

                <td className="py-4 text-slate-600">
                  {student.track}
                </td>

                <td className="py-4 text-slate-600">
                  {student.totalAttendance} classes
                </td>

              </tr>
            ))}
          </tbody>
        </table>

      </section>

    </main>
  );
}