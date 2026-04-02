import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  await requireRole("ADMIN");

  const totalStudents = await db.student.count();
  const totalResources = await db.resource.count();
  const totalAssignments = await db.assignment.count({
    where: { isPublished: true },
  });

  const unreadAssignmentViews = await db.assignmentView.count({
    where: { seenAt: null },
  });

  const issuedCertificates = await db.certificate.count({
    where: { status: "ISSUED" },
  });

  const pendingSubmissions = await db.submission.count({
    where: { status: "PENDING" },
  });

  const totalTeachers = await db.teacher.count();

  const stats = [
    {
      title: "Total Students",
      value: `${totalStudents}`,
      note: "Registered training participants",
      soft: "from-emerald-50 to-white",
      border: "border-emerald-100",
      line: "from-emerald-600 to-green-500",
      valueColor: "text-emerald-800",
    },
    {
      title: "Resources Uploaded",
      value: `${totalResources}`,
      note: "Training materials available",
      soft: "from-lime-50 to-white",
      border: "border-lime-100",
      line: "from-lime-500 to-emerald-500",
      valueColor: "text-lime-800",
    },
    {
      title: "Assignments",
      value: `${totalAssignments}`,
      note: "Published across all tracks",
      soft: "from-green-50 to-white",
      border: "border-green-100",
      line: "from-green-600 to-emerald-600",
      valueColor: "text-green-800",
    },
    {
      title: "Certificates Issued",
      value: `${issuedCertificates}`,
      note: "Approved and released",
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
              Admin Dashboard
            </p>

            <h1 className="mt-1.5 text-xl font-bold leading-tight sm:text-2xl">
              Training Command Center
            </h1>

            <p className="mt-2 text-xs leading-5 text-emerald-50/90 sm:text-sm">
              Monitor students from one central workspace.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:w-[280px]">
            <QuickLink href="/admin/students" label="Students" />
            <QuickLink href="/admin/resources" label="Resources" />
            <QuickLink href="/admin/submissions" label="Projects" />
            <QuickLink href="/admin/certificates" label="Certificates" />
          </div>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-2.5 xl:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.title}
            className={`border bg-gradient-to-br ${stat.soft} ${stat.border} p-3 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md`}
          >
            <div
              className={`h-1.5 w-16 bg-gradient-to-r ${stat.line}`}
            />

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
                Operations Overview
              </p>

              <h3 className="mt-1.5 text-lg font-bold text-slate-900 sm:text-xl">
                Recent Admin Activity
              </h3>
            </div>

            <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-emerald-700">
              Live
            </span>
          </div>

          <div className="mt-4 space-y-2.5">
            <ActivityItem
              title={`${totalAssignments} assignment${totalAssignments === 1 ? "" : "s"} published`}
              text="Monitor assignment activity across all tracks and confirm task flow is moving well."
              tint="from-emerald-50 to-white border-emerald-100"
            />

            <ActivityItem
              title={`${unreadAssignmentViews} unread assignment view${unreadAssignmentViews === 1 ? "" : "s"} pending`}
              text="Some students still haven’t opened all assignments published for their tracks."
              tint="from-lime-50 to-white border-lime-100"
            />

            <ActivityItem
              title={`${pendingSubmissions} submission${pendingSubmissions === 1 ? "" : "s"} awaiting review`}
              text="Project review is active and still needs teacher or admin attention."
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
              <QuickActionCard href="/admin/students" label="Students" />
              <QuickActionCard href="/admin/resources" label="Resources" />
              <QuickActionCard href="/admin/assignments" label="Assignments" />
              <QuickActionCard href="/admin/submissions" label="Submissions" />
              <QuickActionCard href="/admin/certificates" label="Certificates" />
              <QuickActionCard href="/admin/users" label="Users" />
            </div>
          </div>
        </div>

        <div className="border border-emerald-200 bg-gradient-to-br from-emerald-700 via-green-600 to-lime-500 p-4 text-white shadow-[0_18px_45px_-24px_rgba(16,185,129,0.7)]">
          <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-emerald-50/90">
            Admin Notes
          </p>

          <div className="mt-3 space-y-2 text-xs leading-5 sm:text-sm">
            <p className="border border-white/10 bg-white/10 px-3 py-2.5 backdrop-blur">
              Track teaching activity across all assigned teachers and tracks.
            </p>

            <p className="border border-white/10 bg-white/10 px-3 py-2.5 backdrop-blur">
              Review assignment and submission flow regularly to avoid delays.
            </p>

            <p className="border border-white/10 bg-white/10 px-3 py-2.5 backdrop-blur">
              Keep resources updated so learners always have current materials.
            </p>

            <p className="border border-white/10 bg-white/10 px-3 py-2.5 backdrop-blur">
              Current teacher count: {totalTeachers}
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
}: {
  href: string;
  label: string;
}) {
  return (
    <a
      href={href}
      className="border border-white/20 bg-white/15 px-3 py-2 text-center text-xs font-semibold text-white shadow-sm backdrop-blur transition hover:bg-white/25 hover:shadow-md"
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