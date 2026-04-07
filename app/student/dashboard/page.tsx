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

  return (
    <main className="space-y-4">
      <section className="overflow-hidden border border-emerald-200 bg-gradient-to-r from-emerald-950 via-emerald-700 to-lime-500 px-4 py-3 text-white shadow-sm">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="max-w-2xl">
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-emerald-100/90">
              Student Dashboard
            </p>

            <h1 className="mt-1 text-xl font-bold sm:text-2xl">
  Welcome back, {studentUser.name}
</h1>

<p className="mt-1 text-sm text-emerald-50/90">
Stay on top of your training progress from one central workspace.</p>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:w-[300px]">
            <HeroAction href="/student/resources" label="Materials" />
            <HeroAction
              href="/student/assignments"
              label="Assignments"
              badge={unreadAssignmentsCount}
            />
            <HeroAction
              href="/student/submissions"
              label="Submissions"
              badge={reviewedSubmissionsCount}
            />
            <HeroAction href="/student/certificate" label="Certificate" />
          </div>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-2.5 xl:grid-cols-4">
        <StatCard
          label="My Track"
          value={student.track ?? "Not Assigned"}
          note="Assigned training path"
          soft="from-emerald-50 to-white"
          border="border-emerald-100"
          line="from-emerald-600 to-green-500"
          valueColor="text-emerald-800"
        />
        <StatCard
          label="Training Materials"
          value={`${resourcesCount}`}
          note="Available resources"
          soft="from-lime-50 to-white"
          border="border-lime-100"
          line="from-lime-500 to-emerald-500"
          valueColor="text-lime-700"
        />
        <StatCard
          label="Assignments"
          value={`${assignmentsCount}`}
          note={`${unreadAssignmentsCount} unread`}
          soft="from-green-50 to-white"
          border="border-green-100"
          line="from-green-600 to-emerald-600"
          valueColor="text-green-700"
        />
        <StatCard
          label="Attendance Rate"
          value={`${metrics.attendancePercentage}%`}
          note={`${metrics.presentCount} present • ${metrics.absentCount} absent`}
          soft="from-emerald-50 to-lime-50"
          border="border-emerald-100"
          line="from-emerald-700 to-lime-500"
          valueColor="text-emerald-800"
        />
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.3fr_0.7fr]">
        <div className="border border-emerald-100 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-emerald-700">
                Progress Overview
              </p>
              <h2 className="mt-1 text-lg font-bold text-slate-900 sm:text-xl">
                Recent Student Activity
              </h2>
            </div>

            <span className="rounded-full bg-emerald-50 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-emerald-700">
              Active
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
                  ? `You have ${unreadAssignmentsCount} new assignment${unreadAssignmentsCount === 1 ? "" : "s"} waiting for review.`
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
                  ? `You have ${reviewedSubmissionsCount} reviewed submission${reviewedSubmissionsCount === 1 ? "" : "s"} available from your teacher.`
                  : "Your submitted work is still awaiting teacher review."
              }
              tint={
                reviewedSubmissionsCount > 0
                  ? "from-red-50 to-white border-red-200"
                  : "from-lime-50 to-white border-lime-100"
              }
            />

            <ActivityCard
              title="Training materials available"
              text={`You currently have ${resourcesCount} materials available for your track.`}
              tint="from-emerald-50 to-white border-emerald-100"
            />

            <ActivityCard
              title="Assignment tracker updated"
              text={`You currently have ${assignmentsCount} assignment${assignmentsCount === 1 ? "" : "s"} available in the system.`}
              tint="from-green-50 to-white border-green-100"
            />

            <ActivityCard
              title="Attendance performance updated"
              text={`Your attendance rate is ${metrics.attendancePercentage}% with ${metrics.presentCount} present and ${metrics.absentCount} absent.`}
              tint="from-emerald-50 to-white border-emerald-100"
            />

            <div className="mt-5">
              <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-700">
                Quick Actions
              </h3>

              <div className="mt-2.5 grid grid-cols-2 gap-2 sm:grid-cols-3">
                <QuickActionCard href="/student/resources" label="Materials" />
                <QuickActionCard href="/student/assignments" label="Assignments" />
                <QuickActionCard href="/student/submissions" label="Submissions" />
                <QuickActionCard href="/student/attendance" label="Attendance" />
                <QuickActionCard href="/student/certificate" label="Certificate" />
                <QuickActionCard href="/student/profile" label="Profile" />
              </div>
            </div>
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

          <div className="border border-emerald-200 bg-gradient-to-br from-emerald-700 via-green-600 to-lime-500 p-4 text-white shadow-sm">
            <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-emerald-50/90">
              Student Notes
            </p>

            <div className="mt-3 space-y-2 text-xs leading-5 sm:text-sm">
              <p className="border border-white/10 bg-white/10 px-3 py-2.5">
                Keep up with your assignments and review updates regularly.
              </p>
              <p className="border border-white/10 bg-white/10 px-3 py-2.5">
                Current attendance rate: {metrics.attendancePercentage}%.
              </p>
              <p className="border border-white/10 bg-white/10 px-3 py-2.5">
                Your track: {student.track}.
              </p>
              <p className="border border-white/10 bg-white/10 px-3 py-2.5">
                Certificate status: {certificateStatus}.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

function HeroAction({
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
      className="relative border border-white/20 bg-white/15 px-3 py-2 text-center text-xs font-semibold text-white transition hover:bg-white/25"
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