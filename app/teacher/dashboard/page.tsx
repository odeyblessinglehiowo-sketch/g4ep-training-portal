import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
export const dynamic = "force-dynamic";
export default async function TeacherDashboardPage() {
  const currentUser = await requireRole("TEACHER");

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

  const totalStudents = await db.student.count({
    where: {
      track: teacher.track,
    },
  });

  const totalResources = await db.resource.count({
    where: {
      track: teacher.track,
    },
  });

  const totalSubmissions = await db.submission.count({
    where: {
      student: {
        track: teacher.track,
      },
    },
  });

  const activeSessions = await db.attendanceSession.count({
    where: {
      track: teacher.track,
      isActive: true,
    },
  });

  const stats = [
    {
      title: "My Track",
      value: teacher.track ?? "Not Assigned",
      note: "Assigned teaching track",
    },
    {
      title: "Students",
      value: totalStudents,
      note: "Students under this track",
    },
    {
      title: "Resources",
      value: totalResources,
      note: "Available track materials",
    },
    {
      title: "Active Attendance",
      value: activeSessions,
      note: "Current active attendance sessions",
    },
  ];

  return (
    <main className="space-y-6">
      <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200 sm:p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-green-700">
          Teacher Dashboard
        </p>

        <h1 className="mt-2 text-3xl font-bold text-slate-900">
          Welcome, {teacherUser.name ?? "Teacher"}
        </h1>

        <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">
          Manage your track attendance, monitor student submissions, and support
          learner progress.
        </p>
      </section>

      <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.title}
            className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200"
          >
            <p className="text-sm font-medium text-slate-500">{stat.title}</p>

            <h2 className="mt-4 text-3xl font-bold text-slate-900">
              {stat.value}
            </h2>

            <p className="mt-3 text-sm leading-6 text-slate-600">
              {stat.note}
            </p>
          </div>
        ))}
      </section>

      <section className="grid gap-6 md:grid-cols-3">
        <a
          href="/teacher/attendance"
          className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200 transition hover:ring-green-300 active:scale-[0.98]"
        >
          <h3 className="text-lg font-semibold text-slate-900">
            Start Attendance
          </h3>

          <p className="mt-2 text-sm text-slate-600">
            Create QR session and track today&apos;s class attendance.
          </p>
        </a>

        <a
          href="/teacher/resources"
          className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200 transition hover:ring-green-300 active:scale-[0.98]"
        >
          <h3 className="text-lg font-semibold text-slate-900">
            Upload Resource
          </h3>

          <p className="mt-2 text-sm text-slate-600">
            Share slides, PDFs, or learning materials with students.
          </p>
        </a>

        <a
          href="/teacher/submissions"
          className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200 transition hover:ring-green-300 active:scale-[0.98]"
        >
          <h3 className="text-lg font-semibold text-slate-900">
            Review Projects
          </h3>

          <p className="mt-2 text-sm text-slate-600">
            Approve or reject student submissions.
          </p>
        </a>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <h3 className="text-xl font-bold text-slate-900">Find Student</h3>

          <p className="mt-2 text-sm text-slate-600">
            Quickly search students in your track.
          </p>

          <input
            type="text"
            placeholder="Search student name..."
            className="mt-4 w-full rounded-lg border border-slate-300 px-4 py-2 outline-none focus:border-green-700"
          />
        </div>

        <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <h3 className="text-xl font-bold text-slate-900">Recent Activity</h3>

          <div className="mt-4 space-y-3 text-sm text-slate-600">
            <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
              📚 New resource uploaded
            </div>

            <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
              🧑‍🎓 Student submitted project
            </div>

            <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
              📅 Attendance session created
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}