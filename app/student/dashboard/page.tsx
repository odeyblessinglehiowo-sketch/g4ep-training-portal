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

  const cards = [
    {
      title: "My Track",
      value: student.track ?? "Not Assigned",
      note: "Your assigned training path",
      tone: "from-emerald-600 to-green-500",
      soft: "bg-emerald-50 border-emerald-100",
      valueColor: "text-emerald-800",
    },
    {
      title: "Training Materials",
      value: `${resourcesCount} Resources`,
      note: "Slides, guides, and practical files",
      tone: "from-lime-500 to-emerald-500",
      soft: "bg-lime-50 border-lime-100",
      valueColor: "text-lime-800",
    },
    {
      title: "Project Submissions",
      value: `${submissionCount} Total`,
      note: "Upload and manage your work",
      tone: "from-green-600 to-emerald-600",
      soft: "bg-green-50 border-green-100",
      valueColor: "text-green-800",
    },
    {
      title: "Attendance Rate",
      value: `${metrics.attendancePercentage}%`,
      note: `${metrics.presentCount} present, ${metrics.absentCount} absent`,
      tone: "from-emerald-700 to-lime-500",
      soft: "bg-emerald-50 border-emerald-100",
      valueColor: "text-emerald-800",
    },
  ];

  const certificateStatus =
    certificate?.status === "ISSUED"
      ? "Issued"
      : certificate?.status === "PENDING"
      ? "In Progress"
      : "Not Available";

  return (
    <main className="space-y-6">
      <section className="overflow-hidden rounded-[2rem] bg-gradient-to-r from-emerald-800 via-green-700 to-lime-500 p-6 text-white shadow-lg shadow-emerald-200/50 sm:p-8">
        <div className="flex flex-col gap-6 2xl:flex-row 2xl:items-end 2xl:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-50/90">
              Student Dashboard
            </p>

            <h1 className="mt-3 text-3xl font-bold leading-tight sm:text-4xl">
              Welcome back, {studentUser.name ?? "Student"}
            </h1>

            <p className="mt-4 max-w-2xl text-sm leading-7 text-emerald-50/90 sm:text-base">
              Stay on top of your learning journey, monitor your attendance,
              submit projects, access study materials, and track your certificate progress from one clean workspace.
            </p>
          </div>

          <div className="grid w-full grid-cols-2 gap-3 sm:max-w-md 2xl:w-auto">
                        <QuickLink href="/student/resources" label="View Materials" />
            <QuickLink
              href="/student/submissions"
              label="Submit Project"
              badge={reviewedSubmissionsCount}
            />
            <QuickLink href="/student/attendance" label="Attendance" />
            <QuickLink href="/student/certificate" label="Certificate" />
          </div>
        </div>
      </section>

      <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <div
            key={card.title}
            className={`rounded-[1.75rem] border p-5 shadow-sm ${card.soft}`}
          >
            <div className={`h-2 w-24 rounded-full bg-gradient-to-r ${card.tone}`} />

            <p className="mt-5 text-sm font-semibold uppercase tracking-[0.14em] text-slate-500">
              {card.title}
            </p>

            <h2 className={`mt-3 text-2xl font-bold ${card.valueColor}`}>
              {card.value}
            </h2>

            <p className="mt-3 text-sm leading-6 text-slate-600">
              {card.note}
            </p>
          </div>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-3">
        <div className="rounded-[2rem] border border-emerald-100 bg-white/90 p-6 shadow-sm xl:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-700">
                Progress Overview
              </p>
              <h3 className="mt-2 text-2xl font-bold text-slate-900">
                Recent Activity
              </h3>
            </div>

            <span className="rounded-full bg-emerald-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.15em] text-emerald-700">
              Active Student
            </span>
          </div>
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
                  ? "bg-red-50 border-red-200"
                  : "bg-emerald-50 border-emerald-100"
              }
            />
          <div className="mt-6 space-y-4">
            <ActivityCard
              title="Training materials available"
              text={`You currently have ${resourcesCount} resources available for your assigned track.`}
              tint="bg-emerald-50 border-emerald-100"
            />

            <ActivityCard
              title="Submission tracker updated"
              text={`You currently have ${submissionCount} submission${submissionCount === 1 ? "" : "s"} in the system.`}
              tint="bg-lime-50 border-lime-100"
            />

            <ActivityCard
              title="Attendance performance updated"
              text={`Your attendance rate is ${metrics.attendancePercentage}% with ${metrics.presentCount} present record${metrics.presentCount === 1 ? "" : "s"} and ${metrics.absentCount} absent record${metrics.absentCount === 1 ? "" : "s"}.`}
              tint="bg-green-50 border-green-100"
            />

            <ActivityCard
              title="Certificate progress updated"
              text={`Your current certificate status is ${certificateStatus}.`}
              tint="bg-emerald-50 border-emerald-100"
            />
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-[2rem] border border-emerald-100 bg-white/90 p-6 shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-700">
              Student Summary
            </p>

            <div className="mt-5 space-y-4">
              <SummaryRow label="Track" value={student.track} />
              <SummaryRow label="Attendance" value={`${metrics.attendancePercentage}%`} />
              <SummaryRow label="Certificate" value={certificateStatus} />
              <SummaryRow
                label="Submissions"
                value={`${submissionCount} total`}
              />
            </div>
          </div>

          <div className="rounded-[2rem] border border-emerald-100 bg-gradient-to-br from-emerald-600 via-green-600 to-lime-500 p-6 text-white shadow-md">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-50/90">
              Quick Actions
            </p>

            <div className="mt-5 space-y-3">
              <ActionLink href="/student/resources" primary>
                View Materials
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
    <div className={`rounded-[1.5rem] border p-4 ${tint}`}>
      <p className="font-semibold text-slate-900">{title}</p>
      <p className="mt-2 text-sm leading-6 text-slate-600">{text}</p>
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
    <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
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