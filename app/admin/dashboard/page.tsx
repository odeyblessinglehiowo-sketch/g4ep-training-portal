import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  await requireRole("ADMIN");

  const totalStudents = await db.student.count();
  const totalResources = await db.resource.count();
  const totalSubmissions = await db.submission.count();
  const totalAssignments = await db.assignment.count({
    where: {
      isPublished: true,
    },
  });

  const unreadAssignmentViews = await db.assignmentView.count({
    where: {
      seenAt: null,
    },
  });

  const issuedCertificates = await db.certificate.count({
    where: {
      status: "ISSUED",
    },
  });

  const pendingSubmissions = await db.submission.count({
    where: {
      status: "PENDING",
    },
  });

  const totalTeachers = await db.teacher.count();

  const stats = [
    {
      title: "Total Students",
      value: `${totalStudents}`,
      note: "Registered training participants",
      tone: "from-emerald-600 to-green-500",
      soft: "bg-emerald-50 border-emerald-100",
      valueColor: "text-emerald-800",
    },
    {
      title: "Resources Uploaded",
      value: `${totalResources}`,
      note: "Training materials available",
      tone: "from-lime-500 to-emerald-500",
      soft: "bg-lime-50 border-lime-100",
      valueColor: "text-lime-800",
    },
    {
      title: "Assignments",
      value: `${totalAssignments}`,
      note: "Published across all tracks",
      tone: "from-green-600 to-emerald-600",
      soft: "bg-green-50 border-green-100",
      valueColor: "text-green-800",
    },
    {
      title: "Certificates Issued",
      value: `${issuedCertificates}`,
      note: "Certificates approved and released",
      tone: "from-emerald-700 to-lime-500",
      soft: "bg-emerald-50 border-emerald-100",
      valueColor: "text-emerald-800",
    },
  ];

  return (
    <main className="space-y-6">
      <section className="overflow-hidden rounded-[2rem] bg-gradient-to-r from-emerald-900 via-green-700 to-lime-500 p-6 text-white shadow-lg shadow-emerald-200/50 sm:p-8">
        <div className="flex flex-col gap-6 2xl:flex-row 2xl:items-end 2xl:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-50/90">
              Admin Dashboard
            </p>

            <h1 className="mt-3 text-3xl font-bold leading-tight sm:text-4xl">
              Training Command Center
            </h1>

            <p className="mt-4 max-w-2xl text-sm leading-7 text-emerald-50/90 sm:text-base">
              Monitor students, resources, assignments, submissions,
              certificate activity, and operational progress from one central
              management workspace.
            </p>
          </div>

          <div className="grid w-full grid-cols-2 gap-3 sm:max-w-md 2xl:w-auto">
            <QuickLink href="/admin/students" label="Students" />
            <QuickLink href="/admin/resources" label="Resources" />
            <QuickLink href="/admin/assignments" label="Assignments" />
            <QuickLink href="/admin/certificates" label="Certificates" />
          </div>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-4 md:gap-5 xl:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.title}
            className={`rounded-[1.75rem] border p-4 shadow-sm sm:p-5 ${stat.soft}`}
          >
            <div className={`h-2 w-24 rounded-full bg-gradient-to-r ${stat.tone}`} />

            <p className="mt-5 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 sm:text-sm">
              {stat.title}
            </p>

            <h2 className={`mt-3 text-xl font-bold sm:text-2xl ${stat.valueColor}`}>
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
                Operations Overview
              </p>
              <h3 className="mt-2 text-2xl font-bold text-slate-900">
                Recent Admin Activity
              </h3>
            </div>

            <span className="rounded-full bg-emerald-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.15em] text-emerald-700">
              Live
            </span>
          </div>

          <div className="mt-6 space-y-4">
            <ActivityItem
              title={`${totalAssignments} assignment${totalAssignments === 1 ? "" : "s"} published`}
              text="Monitor assignment activity across all tracks and confirm teachers are posting tasks on time."
              tint="bg-emerald-50 border-emerald-100"
            />

            <ActivityItem
              title={`${unreadAssignmentViews} unread assignment view${unreadAssignmentViews === 1 ? "" : "s"} pending`}
              text="Some students have not yet opened all assignments posted for their tracks."
              tint="bg-lime-50 border-lime-100"
            />

            <ActivityItem
              title={`${pendingSubmissions} submission${pendingSubmissions === 1 ? "" : "s"} awaiting review`}
              text="Project review flow is active and still needs attention from teachers or admin."
              tint="bg-green-50 border-green-100"
            />
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-[2rem] border border-emerald-100 bg-white/90 p-6 shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-700">
              Quick Actions
            </p>

            <div className="mt-5 space-y-3">
              <AdminLinkButton href="/admin/students" primary>
                Manage Students
              </AdminLinkButton>

              <AdminLinkButton href="/admin/resources">
                Upload Resources
              </AdminLinkButton>

              <AdminLinkButton href="/admin/assignments">
                Monitor Assignments
              </AdminLinkButton>

              <AdminLinkButton href="/admin/submissions">
                Review Submissions
              </AdminLinkButton>

              <AdminLinkButton href="/admin/certificates">
                Issue Certificates
              </AdminLinkButton>

              <AdminLinkButton href="/admin/users">
                Manage Users
              </AdminLinkButton>
            </div>
          </div>

          <div className="rounded-[2rem] border border-emerald-100 bg-gradient-to-br from-emerald-600 via-green-600 to-lime-500 p-6 text-white shadow-md">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-50/90">
              Admin Notes
            </p>

            <div className="mt-5 space-y-3 text-sm leading-6 text-emerald-50/95">
              <p className="rounded-2xl bg-white/10 px-4 py-3 backdrop-blur">
                Track teaching activity across all assigned teachers and tracks.
              </p>
              <p className="rounded-2xl bg-white/10 px-4 py-3 backdrop-blur">
                Review assignment and submission flow regularly to avoid delays.
              </p>
              <p className="rounded-2xl bg-white/10 px-4 py-3 backdrop-blur">
                Keep resources updated so learners always have current materials.
              </p>
              <p className="rounded-2xl bg-white/10 px-4 py-3 backdrop-blur">
                Current teacher count: {totalTeachers}
              </p>
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
}: {
  href: string;
  label: string;
}) {
  return (
    <a
      href={href}
      className="rounded-2xl border border-white/20 bg-white/15 px-4 py-3 text-center text-sm font-semibold text-white backdrop-blur transition hover:bg-white/20"
    >
      {label}
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

function AdminLinkButton({
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
          ? "bg-emerald-700 text-white hover:bg-emerald-800"
          : "bg-slate-100 text-slate-900 hover:bg-slate-200"
      }`}
    >
      {children}
    </a>
  );
}