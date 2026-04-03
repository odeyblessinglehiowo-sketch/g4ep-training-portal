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

  const totalAssignments = await db.assignment.count({
    where: {
      track: teacher.track,
      teacherId: teacher.id,
      isPublished: true,
    },
  });

  const totalSubmissions = await db.submission.count({
    where: {
      student: {
        track: teacher.track,
      },
    },
  });

  const pendingSubmissions = await db.submission.count({
    where: {
      student: {
        track: teacher.track,
      },
      status: "PENDING",
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
      soft: "from-emerald-50 to-white",
      border: "border-emerald-100",
      line: "from-emerald-600 to-green-500",
      valueColor: "text-emerald-800",
    },
    {
      title: "Students",
      value: `${totalStudents}`,
      note: "Students under this track",
      soft: "from-lime-50 to-white",
      border: "border-lime-100",
      line: "from-lime-500 to-emerald-500",
      valueColor: "text-lime-800",
    },
    {
      title: "Resources",
      value: `${totalResources}`,
      note: "Available track materials",
      soft: "from-green-50 to-white",
      border: "border-green-100",
      line: "from-green-600 to-emerald-600",
      valueColor: "text-green-800",
    },
    {
      title: "Assignments",
      value: `${totalAssignments}`,
      note: "Published tasks for your students",
      soft: "from-emerald-50 to-lime-50",
      border: "border-emerald-100",
      line: "from-emerald-700 to-lime-500",
      valueColor: "text-emerald-800",
    },
  ];

  return (
    <main className="space-y-4">
      <section className="overflow-hidden border border-emerald-200 bg-gradient-to-r from-emerald-950 via-emerald-700 to-lime-500 px-4 py-4 text-white shadow-[0_18px_45px_-22px_rgba(16,185,129,0.55)] sm:px-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-emerald-100/90">
              Teacher Dashboard
            </p>

            <h1 className="mt-1.5 text-xl font-bold leading-tight sm:text-2xl">
              Welcome back, {teacherUser.name ?? "Teacher"}
            </h1>

            <p className="mt-2 text-xs leading-5 text-emerald-50/90 sm:text-sm">
              Manage your learning track and support students from one central workspace.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:w-[280px]">
            <QuickLink href="/teacher/students" label="Students" />
            <QuickLink href="/teacher/resources" label="Resources" />
            <QuickLink
              href="/teacher/assignments"
              label="Assignments"
              
            />
            <QuickLink
              href="/teacher/submissions"
              label="Submissions"
              badge={pendingSubmissions}
            />
          </div>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-2.5 xl:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.title}
            className={`border bg-gradient-to-br ${stat.soft} ${stat.border} p-3 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md`}
          >
            <div className={`h-1.5 w-16 bg-gradient-to-r ${stat.line}`} />

            <p className="mt-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500 sm:text-[11px]">
              {stat.title}
            </p>

            <h2 className={`mt-1.5 text-lg font-bold sm:text-xl ${stat.valueColor}`}>
              {stat.value}
            </h2>

            <p className="mt-1.5 text-[11px] leading-5 text-slate-600 sm:text-xs">
              {stat.note}
            </p>
          </div>
        ))}
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        <div className="border border-emerald-100 bg-white/95 p-4 shadow-sm xl:col-span-2">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-emerald-700">
                Teaching Overview
              </p>

              <h3 className="mt-1.5 text-lg font-bold text-slate-900 sm:text-xl">
                Classroom Activity
              </h3>
            </div>

            <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-emerald-700">
              Live
            </span>
          </div>

          <div className="mt-4 space-y-2.5">
            <ActivityItem
              title={
                pendingSubmissions > 0
                  ? `${pendingSubmissions} submission${pendingSubmissions === 1 ? "" : "s"} awaiting review`
                  : "No pending submissions"
              }
              text={
                pendingSubmissions > 0
                  ? "A student submission needs your attention in the review queue."
                  : "You are all caught up. No submission is waiting for review right now."
              }
              tint={
                pendingSubmissions > 0
                  ? "from-red-50 to-white border-red-100"
                  : "from-emerald-50 to-white border-emerald-100"
              }
            />

            <ActivityItem
              title={
                totalAssignments > 0
                  ? `${totalAssignments} assignment${totalAssignments === 1 ? "" : "s"} published`
                  : "No assignments created yet"
              }
              text={
                totalAssignments > 0
                  ? "Students in your track can already access your published tasks."
                  : "Create your first assignment to start engaging your students."
              }
              tint="from-lime-50 to-white border-lime-100"
            />

            <ActivityItem
              title={`${activeSessions} active attendance session${activeSessions === 1 ? "" : "s"}`}
              text="Your attendance workflow is ready for live class check-ins."
              tint="from-green-50 to-white border-green-100"
            />
          </div>

          <div className="mt-5">
            <div className="mb-2.5 flex items-center justify-between">
              <h4 className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-700">
                Quick Actions
              </h4>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              <QuickActionCard href="/teacher/attendance" label="Attendance" />
              <QuickActionCard href="/teacher/resources" label="Resources" />
              <QuickActionCard href="/teacher/assignments" label="Assignments" />
              <QuickActionCard href="/teacher/submissions" label="Submissions" />
              <QuickActionCard href="/teacher/students" label="Students" />
              <QuickActionCard href="/teacher/dashboard" label="Overview" />
            </div>
          </div>
        </div>

        <div className="border border-emerald-200 bg-gradient-to-br from-emerald-700 via-green-600 to-lime-500 p-4 text-white shadow-[0_18px_45px_-24px_rgba(16,185,129,0.7)]">
          <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-emerald-50/90">
            Teacher Notes
          </p>

          <div className="mt-3 space-y-2 text-xs leading-5 sm:text-sm">
            <p className="border border-white/10 bg-white/10 px-3 py-2.5 backdrop-blur">
              Track students under {teacher.track} and keep class activities moving smoothly.
            </p>

            <p className="border border-white/10 bg-white/10 px-3 py-2.5 backdrop-blur">
              Pending submissions: {pendingSubmissions}
            </p>

            <p className="border border-white/10 bg-white/10 px-3 py-2.5 backdrop-blur">
              Active attendance sessions: {activeSessions}
            </p>

            <p className="border border-white/10 bg-white/10 px-3 py-2.5 backdrop-blur">
              Total submissions received: {totalSubmissions}
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}

function QuickLink({
  href,
  label,
  badge,
}: {
  href: string;
  label: string;
  badge?: number;
}) {
  return (
    <a
      href={href}
      className="relative border border-white/20 bg-white/15 px-3 py-2 text-center text-xs font-semibold text-white shadow-sm backdrop-blur transition hover:bg-white/25 hover:shadow-md"
    >
      {label}

      {badge !== undefined && badge > 0 && (
        <span className="absolute -right-1 -top-1 inline-flex min-h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[9px] font-bold text-white">
          {badge}
        </span>
      )}
    </a>
  );
}

function ActivityItem({
  title,
  text,
  tint,
}: {
  title: string;
  text: string;
  tint: string;
}) {
  return (
    <div className={`border bg-gradient-to-r ${tint} p-3 transition hover:shadow-sm`}>
      <p className="text-xs font-semibold text-slate-900 sm:text-sm">
        {title}
      </p>
      <p className="mt-1.5 text-[11px] leading-5 text-slate-600 sm:text-xs">
        {text}
      </p>
    </div>
  );
}

function QuickActionCard({
  href,
  label,
}: {
  href: string;
  label: string;
}) {
  return (
    <a
      href={href}
      className="border border-slate-200 bg-gradient-to-br from-slate-50 to-white px-3 py-2.5 text-center text-xs font-semibold text-slate-800 shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700 hover:shadow-md"
    >
      {label}
    </a>
  );
} 