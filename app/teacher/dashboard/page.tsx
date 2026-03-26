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
      tone: "from-emerald-600 to-green-500",
      soft: "bg-emerald-50 border-emerald-100",
      valueColor: "text-emerald-800",
    },
    {
      title: "Students",
      value: `${totalStudents}`,
      note: "Students under this track",
      tone: "from-lime-500 to-emerald-500",
      soft: "bg-lime-50 border-lime-100",
      valueColor: "text-lime-800",
    },
    {
      title: "Resources",
      value: `${totalResources}`,
      note: "Available track materials",
      tone: "from-green-600 to-emerald-600",
      soft: "bg-green-50 border-green-100",
      valueColor: "text-green-800",
    },
    {
      title: "Active Attendance",
      value: `${activeSessions}`,
      note: "Current live attendance sessions",
      tone: "from-emerald-700 to-lime-500",
      soft: "bg-emerald-50 border-emerald-100",
      valueColor: "text-emerald-800",
    },
  ];

  return (
    <main className="space-y-6">
      <section className="overflow-hidden rounded-[2rem] bg-gradient-to-r from-emerald-800 via-green-700 to-lime-500 p-6 text-white shadow-lg shadow-emerald-200/50 sm:p-8">
        <div className="flex flex-col gap-6 2xl:flex-row 2xl:items-end 2xl:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-50/90">
              Teacher Dashboard
            </p>

            <h1 className="mt-3 text-3xl font-bold leading-tight sm:text-4xl">
              Welcome back, {teacherUser.name ?? "Teacher"}
            </h1>

            <p className="mt-4 max-w-2xl text-sm leading-7 text-emerald-50/90 sm:text-base">
              Manage your learning track, support students, monitor attendance,
              publish resources, and review project submissions from one clean
              teaching workspace.
            </p>
          </div>

          <div className="grid w-full grid-cols-2 gap-3 sm:max-w-md 2xl:w-auto">
                       <QuickLink href="/teacher/attendance" label="Attendance" />
            <QuickLink href="/teacher/resources" label="Resources" />
            <QuickLink
              href="/teacher/submissions"
              label="Projects"
              badge={pendingSubmissions}
            />
            <QuickLink href="/teacher/students" label="Students" />
          </div>
        </div>
      </section>

      <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.title}
            className={`rounded-[1.75rem] border p-5 shadow-sm ${stat.soft}`}
          >
            <div className={`h-2 w-24 rounded-full bg-gradient-to-r ${stat.tone}`} />

            <p className="mt-5 text-sm font-semibold uppercase tracking-[0.14em] text-slate-500">
              {stat.title}
            </p>

            <h2 className={`mt-3 text-2xl font-bold ${stat.valueColor}`}>
              {stat.value}
            </h2>

            <p className="mt-3 text-sm leading-6 text-slate-600">
              {stat.note}
            </p>
          </div>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-3">
        <div className="rounded-[2rem] border border-emerald-100 bg-white/90 p-6 shadow-sm xl:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-700">
                Teaching Overview
              </p>
              <h3 className="mt-2 text-2xl font-bold text-slate-900">
                Classroom Activity
              </h3>
            </div>

            <span className="rounded-full bg-emerald-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.15em] text-emerald-700">
              Active Teacher
            </span>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <ActionCard
              href="/teacher/attendance"
              title="Start Attendance"
              text="Create a QR session and track your students' attendance in real time."
              tint="bg-emerald-50 border-emerald-100"
            />

            <ActionCard
              href="/teacher/resources"
              title="Upload Resource"
              text="Share slides, PDFs, and training materials with your assigned track."
              tint="bg-lime-50 border-lime-100"
            />

            <ActionCard
              href="/teacher/submissions"
              title="Review Projects"
              text="Approve, reject, and manage student submissions efficiently."
              tint="bg-green-50 border-green-100"
            />
          </div>

          <div className="mt-6 rounded-[1.75rem] border border-emerald-100 bg-emerald-50/60 p-5">
            <h4 className="text-lg font-bold text-slate-900">Find Student</h4>
            <p className="mt-2 text-sm text-slate-600">
              Quickly search students in your track.
            </p>

            <input
              type="text"
              placeholder="Search student name..."
              className="mt-4 w-full rounded-2xl border border-emerald-100 bg-white px-4 py-3 text-sm outline-none transition focus:border-emerald-500"
            />
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-[2rem] border border-emerald-100 bg-white/90 p-6 shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-700">
              Recent Activity
            </p>

                      <div className="mt-5 space-y-4">
              <ActivityItem
                title={
                  pendingSubmissions > 0
                    ? `${pendingSubmissions} submission${pendingSubmissions === 1 ? "" : "s"} awaiting review`
                    : "No pending submissions"
                }
                text={
                  pendingSubmissions > 0
                    ? "A student project needs your review. Open the submissions page to approve or reject it."
                    : "You are all caught up. No student project is currently awaiting review."
                }
                tint={
                  pendingSubmissions > 0
                    ? "bg-red-50 border-red-200"
                    : "bg-emerald-50 border-emerald-100"
                }
              />

              <ActivityItem
                title="New resource uploaded"
                text="Fresh training materials can now be accessed by students in your track."
                tint="bg-emerald-50 border-emerald-100"
              />

              <ActivityItem
                title="Student submitted project"
                text="A learner submission is awaiting your review in the projects section."
                tint="bg-lime-50 border-lime-100"
              />

              <ActivityItem
                title="Attendance session created"
                text="Your attendance workflow is ready for the next live class session."
                tint="bg-green-50 border-green-100"
              />
            </div>
          </div>

          <div className="rounded-[2rem] border border-emerald-100 bg-gradient-to-br from-emerald-600 via-green-600 to-lime-500 p-6 text-white shadow-md">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-50/90">
              Quick Actions
            </p>

            <div className="mt-5 space-y-3">
              <QuickActionLink href="/teacher/students" primary>
                View Students
              </QuickActionLink>

              <QuickActionLink href="/teacher/resources">
                Manage Resources
              </QuickActionLink>

              <QuickActionLink href="/teacher/attendance">
                Open Attendance
              </QuickActionLink>

              <QuickActionLink href="/teacher/submissions">
                Review Projects
              </QuickActionLink>
            </div>
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
      className="relative rounded-2xl border border-white/20 bg-white/15 px-4 py-3 text-center text-sm font-semibold text-white backdrop-blur transition hover:bg-white/20"
    >
      <span>{label}</span>

      {badge !== undefined && badge > 0 && (
        <span className="absolute -right-2 -top-2 inline-flex min-h-6 min-w-6 items-center justify-center rounded-full bg-red-600 px-2 text-xs font-bold text-white shadow">
          {badge}
        </span>
      )}
    </a>
  );
}

function ActionCard({
  href,
  title,
  text,
  tint,
}: {
  href: string;
  title: string;
  text: string;
  tint: string;
}) {
  return (
    <a
      href={href}
      className={`rounded-[1.5rem] border p-5 shadow-sm transition hover:shadow-md ${tint}`}
    >
      <p className="text-lg font-bold text-slate-900">{title}</p>
      <p className="mt-3 text-sm leading-6 text-slate-600">{text}</p>
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
    <div className={`rounded-[1.5rem] border p-4 ${tint}`}>
      <p className="font-semibold text-slate-900">{title}</p>
      <p className="mt-2 text-sm leading-6 text-slate-600">{text}</p>
    </div>
  );
}

function QuickActionLink({
  href,
  children,
  primary = false,
}: {
  href: string;
  children: React.ReactNode;
  primary?: boolean;
}) {
  return (
    <a
      href={href}
      className={`block w-full rounded-2xl px-4 py-3 text-left text-sm font-semibold transition ${
        primary
          ? "bg-white text-emerald-700 hover:bg-emerald-50"
          : "bg-white/15 text-white backdrop-blur hover:bg-white/20"
      }`}
    >
      {children}
    </a>
  );
}