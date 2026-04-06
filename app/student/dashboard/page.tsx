import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { getStudentAttendanceMetrics } from "@/lib/student-progress";

export default async function StudentDashboardPage() {
  const currentUser = await requireRole("STUDENT");

  const studentUser = await db.user.findUnique({
    where: {
      id: currentUser.userId,
    },
    include: {
      student: true,
    },
  });

  if (!studentUser || !studentUser.student) {
    throw new Error("Student profile not found.");
  }

  const student = studentUser.student;

  const resourcesCount = await db.resource.count({
    where: {
      track: student.track,
    },
  });

  const assignmentsCount = await db.assignment.count({
    where: {
      track: student.track,
      isPublished: true,
    },
  });

  const unreadAssignmentsCount = await db.assignment.count({
    where: {
      track: student.track,
      isPublished: true,
      views: {
        none: {
          studentId: student.id,
          seenAt: {
            not: null,
          },
        },
      },
    },
  });

  const submissionCount = await db.submission.count({
    where: {
      studentId: student.id,
    },
  });

  const reviewedSubmissionsCount = await db.submission.count({
    where: {
      studentId: student.id,
      status: {
        in: ["APPROVED", "REJECTED"],
      },
      studentSeenReview: false,
    },
  });

  const certificate = await db.certificate.findFirst({
    where: {
      studentId: student.id,
    },
    orderBy: {
      issuedAt: "desc",
    },
  });

  const metrics = await getStudentAttendanceMetrics(student.id);

  const certificateStatus =
    certificate?.status === "ISSUED"
      ? "Issued"
      : certificate?.status === "PENDING"
      ? "In Progress"
      : "Not Available";

  const stats = [
    {
      title: "My Track",
      value: student.track ?? "Not Assigned",
      note: "Your assigned training path",
      soft: "from-emerald-50 to-white",
      border: "border-emerald-100",
      line: "from-emerald-600 to-green-500",
      valueColor: "text-emerald-800",
    },
    {
      title: "Training Materials",
      value: `${resourcesCount} Resources`,
      note: "Slides, guides, and practical files",
      soft: "from-lime-50 to-white",
      border: "border-lime-100",
      line: "from-lime-500 to-emerald-500",
      valueColor: "text-lime-800",
    },
    {
      title: "Assignments",
      value: `${assignmentsCount} Total`,
      note: `${unreadAssignmentsCount} new assignment${unreadAssignmentsCount === 1 ? "" : "s"} waiting`,
      soft: "from-green-50 to-white",
      border: "border-green-100",
      line: "from-green-600 to-emerald-600",
      valueColor: "text-green-800",
    },
    {
      title: "Attendance Rate",
      value: `${metrics.attendancePercentage}%`,
      note: `${metrics.presentCount} present, ${metrics.absentCount} absent`,
      soft: "from-emerald-50 to-lime-50",
      border: "border-emerald-100",
      line: "from-emerald-700 to-lime-500",
      valueColor: "text-emerald-800",
    },
  ];

  return (
    <main className="space-y-4">
      <section className="overflow-hidden border border-emerald-200 bg-gradient-to-r from-emerald-950 via-emerald-700 to-lime-500 px-4 py-3 text-white shadow-[0_18px_45px_-22px_rgba(16,185,129,0.55)] sm:px-5">
        <div className="grid gap-3 xl:grid-cols-[1.2fr_0.9fr] xl:items-start">
          <div className="max-w-3xl">
            <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-emerald-100/90">
              Student Dashboard
            </p>

            <h1 className="mt-0.5 text-lg font-bold leading-tight sm:text-xl">
              Welcome back, {studentUser.name ?? "Student"}
            </h1>

            <p className="mt-1 text-[11px] leading-4 text-emerald-50/90 sm:text-xs">
              Stay on top of your learning journey, monitor attendance, view assignments, submit projects, access materials, and track certificate progress.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <QuickLink href="/student/resources" label="View Materials" />
            <QuickLink
              href="/student/assignments"
              label="Assignments"
              badge={unreadAssignmentsCount}
            />
            <QuickLink
              href="/student/submissions"
              label="Submit Project"
              badge={reviewedSubmissionsCount}
            />
            <QuickLink href="/student/certificate" label="Certificate" />
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

            <p className="mt-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500 sm:text-[11px]">
              {stat.title}
            </p>

            <h2 className={`mt-1 text-base font-bold sm:text-lg ${stat.valueColor}`}>
              {stat.value}
            </h2>

            <p className="mt-1 text-[10px] leading-4 text-slate-600 sm:text-[11px]">
              {stat.note}
            </p>
          </div>
        ))}
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.3fr_0.7fr]">
        <div className="border border-emerald-100 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-emerald-700">
                Progress Overview
              </p>
              <h3 className="mt-1 text-lg font-bold text-slate-900 sm:text-xl">
                Recent Activity
              </h3>
            </div>

            <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-emerald-700">
              Active Student
            </span>
          </div>

          <div className="mt-4 space-y-2.5">
            <ActivityCard
              title={
                unreadAssignmentsCount > 0
                  ? "New assignment available"
                  : "No new assignment yet"
              }
              text={
                unreadAssignmentsCount > 0
                  ? `You have ${unreadAssignmentsCount} new assignment${unreadAssignmentsCount === 1 ? "" : "s"} to check from your teacher.`
                  : "No unread assignment is waiting for you right now."
              }
              tint={
                unreadAssignmentsCount > 0
                  ? "from-red-50 to-white border-red-200"
                  : "from-emerald-50 to-white border-emerald-100"
              }
            />

            <ActivityCard
              title={
                reviewedSubmissionsCount > 0
                  ? "Submission review available"
                  : "No new review yet"
              }
              text={
                reviewedSubmissionsCount > 0
                  ? `You have ${reviewedSubmissionsCount} submission review update${reviewedSubmissionsCount === 1 ? "" : "s"} available from your teacher.`
                  : "Your submitted projects are still awaiting teacher review."
              }
              tint={
                reviewedSubmissionsCount > 0
                  ? "from-red-50 to-white border-red-200"
                  : "from-lime-50 to-white border-lime-100"
              }
            />

            <ActivityCard
              title="Training materials available"
              text={`You currently have ${resourcesCount} resources available for your assigned track.`}
              tint="from-emerald-50 to-white border-emerald-100"
            />

            <ActivityCard
              title="Assignment tracker updated"
              text={`You currently have ${assignmentsCount} assignment${assignmentsCount === 1 ? "" : "s"} available in the system.`}
              tint="from-green-50 to-white border-green-100"
            />

            <ActivityCard
              title="Attendance performance updated"
              text={`Your attendance rate is ${metrics.attendancePercentage}% with ${metrics.presentCount} present record${metrics.presentCount === 1 ? "" : "s"} and ${metrics.absentCount} absent record${metrics.absentCount === 1 ? "" : "s"}.`}
              tint="from-emerald-50 to-white border-emerald-100"
            />

            <ActivityCard
              title="Certificate progress updated"
              text={`Your current certificate status is ${certificateStatus}.`}
              tint="from-lime-50 to-white border-lime-100"
            />
          </div>
        </div>

        <div className="space-y-4">
          <div className="border border-emerald-100 bg-white p-4 shadow-sm">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-emerald-700">
              Student Summary
            </p>

            <div className="mt-4 space-y-2.5">
              <SummaryRow label="Track" value={student.track} />
              <SummaryRow label="Attendance" value={`${metrics.attendancePercentage}%`} />
              <SummaryRow label="Assignments" value={`${assignmentsCount} total`} />
              <SummaryRow label="Certificate" value={certificateStatus} />
              <SummaryRow label="Submissions" value={`${submissionCount} total`} />
            </div>
          </div>

          <div className="border border-emerald-200 bg-gradient-to-br from-emerald-700 via-green-600 to-lime-500 p-4 text-white shadow-[0_18px_45px_-24px_rgba(16,185,129,0.7)]">
            <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-emerald-50/90">
              Quick Actions
            </p>

            <div className="mt-3 space-y-2">
              <ActionLink href="/student/resources" primary>
                View Materials
              </ActionLink>

              <ActionLink href="/student/assignments">
                View Assignments
              </ActionLink>

              <ActionLink href="/student/submissions">
                Submit Project
              </ActionLink>

              <ActionLink href="/student/attendance">
                Check Attendance
              </ActionLink>

              <ActionLink href="/student/certificate">
                Check Certificate
              </ActionLink>

              <ActionLink href="/student/profile">
                Update Profile
              </ActionLink>
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
      className="relative border border-white/20 bg-white/15 px-3 py-2 text-center text-xs font-semibold text-white backdrop-blur transition hover:bg-white/25"
    >
      <span>{label}</span>

      {badge !== undefined && badge > 0 && (
        <span className="absolute -right-1 -top-1 inline-flex min-h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[9px] font-bold text-white">
          {badge}
        </span>
      )}
    </a>
  );
}

function ActivityCard({
  title,
  text,
  tint,
}: {
  title: string;
  text: string;
  tint: string;
}) {
  return (
    <div className={`border bg-gradient-to-r ${tint} p-3`}>
      <p className="text-sm font-semibold text-slate-900">{title}</p>
      <p className="mt-1.5 text-[11px] leading-5 text-slate-600 sm:text-xs">
        {text}
      </p>
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
    <div className="flex items-center justify-between border border-slate-200 bg-slate-50 px-3 py-3">
      <span className="text-sm font-medium text-slate-500">{label}</span>
      <span className="text-sm font-semibold text-slate-900">
        {value ?? "Not Available"}
      </span>
    </div>
  );
}

function ActionLink({
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
      className={`block w-full px-3 py-2 text-sm font-semibold transition ${
        primary
          ? "bg-white text-emerald-700 hover:bg-emerald-50"
          : "bg-white/15 text-white backdrop-blur hover:bg-white/20"
      }`}
    >
      {children}
    </a>
  );
}