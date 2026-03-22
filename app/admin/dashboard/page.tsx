import { requireRole } from "@/lib/auth";
export const dynamic = "force-dynamic";
import { db } from "@/lib/db";

export default async function AdminDashboardPage() {
  await requireRole("ADMIN");

  const totalStudents = await db.student.count();
  const totalResources = await db.resource.count();
  const totalSubmissions = await db.submission.count();

  const issuedCertificates = await db.certificate.count({
    where: {
      status: "ISSUED",
    },
  });

  const stats = [
    {
      title: "Total Students",
      value: totalStudents,
      note: "Registered training participants",
    },
    {
      title: "Resources Uploaded",
      value: totalResources,
      note: "Training materials available",
    },
    {
      title: "Project Submissions",
      value: totalSubmissions,
      note: "Student assignments submitted",
    },
    {
      title: "Certificates Issued",
      value: issuedCertificates,
      note: "Certificates approved and released",
    },
  ];

  return (
    <main className="space-y-6">
      <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200 sm:p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-green-700">
          Admin Dashboard
        </p>

        <h1 className="mt-2 text-3xl font-bold text-slate-900">
          Training Command Center
        </h1>

        <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">
          Monitor students, resources, submissions, and certificate activity.
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

      <section className="grid gap-6 xl:grid-cols-3">
        <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200 xl:col-span-2">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-slate-900">
              Recent Admin Activity
            </h3>

            <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">
              Live
            </span>
          </div>

          <div className="mt-6 space-y-4">
            <div className="rounded-2xl border border-slate-200 p-4">
              <p className="font-semibold text-slate-900">
                New student batch imported
              </p>
              <p className="mt-1 text-sm text-slate-600">
                Registration data can be reviewed and onboarding can continue
                from the admin panel.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 p-4">
              <p className="font-semibold text-slate-900">
                Learning resources are now live
              </p>
              <p className="mt-1 text-sm text-slate-600">
                Students can instantly access uploaded materials by track.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 p-4">
              <p className="font-semibold text-slate-900">
                Certificate verification is active
              </p>
              <p className="mt-1 text-sm text-slate-600">
                Public verification links can now confirm issued certificates.
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <h3 className="text-xl font-bold text-slate-900">
            Quick Actions
          </h3>

          <div className="mt-6 space-y-3">
            <AdminLinkButton href="/admin/students" primary>
              Manage Students
            </AdminLinkButton>

            <AdminLinkButton href="/admin/resources">
              Upload Resources
            </AdminLinkButton>

            <AdminLinkButton href="/admin/submissions">
              Review Submissions
            </AdminLinkButton>

            <AdminLinkButton href="/admin/certificates">
              Issue Certificates
            </AdminLinkButton>
          </div>
        </div>
      </section>
    </main>
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