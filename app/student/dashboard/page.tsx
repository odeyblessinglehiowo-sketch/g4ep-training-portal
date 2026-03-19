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
    },
    {
      title: "Training Materials",
      value: `${resourcesCount} Resources`,
      note: "Slides, guides, and practical files",
    },
    {
      title: "Project Submissions",
      value: `${submissionCount} Total`,
      note: "Upload and manage your work",
    },
    {
      title: "Attendance Rate",
      value: `${metrics.attendancePercentage}%`,
      note: `${metrics.presentCount} present, ${metrics.absentCount} absent`,
    },
  ];

  return (
    <main className="space-y-6">
      <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200 sm:p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-green-700">
          Student Dashboard
        </p>

        <h1 className="mt-2 text-3xl font-bold text-slate-900">
          Welcome back, {studentUser.name ?? "Student"}
        </h1>

        <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">
          Track your training progress, access resources, submit projects, and
          monitor your certificate status from one place.
        </p>
      </section>

      <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <div
            key={card.title}
            className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200"
          >
            <p className="text-sm font-medium text-slate-500">{card.title}</p>

            <h2 className="mt-4 text-2xl font-bold text-slate-900">
              {card.value}
            </h2>

            <p className="mt-3 text-sm leading-6 text-slate-600">
              {card.note}
            </p>
          </div>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-3">
        <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200 xl:col-span-2">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-slate-900">
              Recent Activity
            </h3>

            <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">
              Active
            </span>
          </div>

          <div className="mt-6 space-y-4">
            <div className="rounded-2xl border border-slate-200 p-4">
              <p className="font-semibold text-slate-900">
                Training materials available
              </p>

              <p className="mt-1 text-sm text-slate-600">
                You currently have {resourcesCount} resources for your assigned track.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 p-4">
              <p className="font-semibold text-slate-900">
                Submission tracker updated
              </p>

              <p className="mt-1 text-sm text-slate-600">
                You currently have {submissionCount} submission
                {submissionCount === 1 ? "" : "s"} in the system.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 p-4">
              <p className="font-semibold text-slate-900">
                Attendance performance updated
              </p>

              <p className="mt-1 text-sm text-slate-600">
                Your attendance rate is {metrics.attendancePercentage}% with{" "}
                {metrics.presentCount} present record
                {metrics.presentCount === 1 ? "" : "s"} and {metrics.absentCount} absent
                record{metrics.absentCount === 1 ? "" : "s"}.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 p-4">
              <p className="font-semibold text-slate-900">
                Certificate progress updated
              </p>

              <p className="mt-1 text-sm text-slate-600">
                Your current certificate status is{" "}
                {certificate?.status === "ISSUED"
                  ? "Issued"
                  : certificate?.status === "PENDING"
                  ? "In Progress"
                  : "Not Available"}
                .
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <h3 className="text-xl font-bold text-slate-900">Quick Actions</h3>

          <div className="mt-6 space-y-3">
            <LinkButton href="/student/resources" primary>
              View Materials
            </LinkButton>

            <LinkButton href="/student/submissions">
              Submit Project
            </LinkButton>

            <LinkButton href="/student/attendance">
              View Attendance
            </LinkButton>

            <LinkButton href="/student/certificate">
              Check Certificate
            </LinkButton>

            <LinkButton href="/student/profile">
              Update Profile
            </LinkButton>
          </div>
        </div>
      </section>
    </main>
  );
}

function LinkButton({
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
      className={`block w-full rounded-xl px-4 py-3 text-left font-semibold transition ${
        primary
          ? "bg-green-700 text-white hover:bg-green-800"
          : "bg-slate-100 text-slate-900 hover:bg-slate-200"
      }`}
    >
      {children}
    </a>
  );
}