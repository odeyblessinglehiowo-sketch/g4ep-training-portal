import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { createTeacherResource } from "./actions";

export const dynamic = "force-dynamic";

export default async function TeacherResourcesPage() {
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

  const resources = await db.resource.findMany({
    where: {
      track: teacher.track,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const totalResources = resources.length;
  const latestUpload =
    resources.length > 0
      ? new Date(resources[0].createdAt).toLocaleDateString()
      : "No upload yet";

  return (
    <main className="space-y-6">
      <section className="overflow-hidden rounded-[2rem] bg-gradient-to-r from-emerald-800 via-green-700 to-lime-500 p-6 text-white shadow-lg shadow-emerald-200/50 sm:p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-50/90">
          Resources
        </p>

        <h1 className="mt-3 text-3xl font-bold sm:text-4xl">
          Manage Track Resources
        </h1>

        <p className="mt-4 max-w-3xl text-sm leading-7 text-emerald-50/90 sm:text-base">
          Upload and organize learning materials for your assigned track so
          students can access them quickly and consistently.
        </p>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard
          label="Assigned Track"
          value={teacher.track ?? "Not Assigned"}
          tone="bg-emerald-50"
          valueClass="text-emerald-700"
        />
        <StatCard label="Total Resources" value={totalResources} />
        <StatCard
          label="Latest Upload"
          value={latestUpload}
          tone="bg-lime-50"
          valueClass="text-lime-700"
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <section className="rounded-[1.75rem] border border-emerald-100 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900">Upload New Resource</h2>
          <p className="mt-1 text-sm text-slate-600">
            Share a file or hosted document link for your students.
          </p>

          <form action={createTeacherResource} className="mt-6 grid gap-4">
            <input
              name="title"
              type="text"
              placeholder="Resource Title"
              className="rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-green-700"
            />

            <input
              name="fileUrl"
              type="text"
              placeholder="File URL"
              className="rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-green-700"
            />

            <button
              type="submit"
              className="rounded-xl bg-green-700 py-3 font-semibold text-white transition hover:bg-green-800 active:scale-[0.98]"
            >
              Upload Resource
            </button>
          </form>
        </section>

        <section className="rounded-[1.75rem] border border-emerald-100 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900">Track Summary</h2>
          <p className="mt-1 text-sm text-slate-600">
            Quick overview of your current resource space.
          </p>

          <div className="mt-6 space-y-4">
            <SummaryRow label="Track" value={teacher.track} />
            <SummaryRow label="Resources" value={`${totalResources}`} />
            <SummaryRow label="Latest Upload" value={latestUpload} />
          </div>
        </section>
      </section>

      <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {resources.length > 0 ? (
          resources.map((resource) => (
            <article
              key={resource.id}
              className="rounded-[1.75rem] border border-emerald-100 bg-white p-6 shadow-sm transition hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-xl font-bold text-slate-900">
                    {resource.title}
                  </h3>

                  <div className="mt-3 space-y-2 text-sm text-slate-600">
                    <p>Track: {resource.track}</p>
                    <p>
                      Uploaded: {new Date(resource.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="rounded-2xl bg-emerald-50 px-3 py-2 text-xs font-semibold uppercase tracking-[0.15em] text-emerald-700 ring-1 ring-emerald-100">
                  Resource
                </div>
              </div>

              <a
                href={resource.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-6 inline-block rounded-xl bg-green-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-green-800 active:scale-[0.98]"
              >
                View Resource
              </a>
            </article>
          ))
        ) : (
          <div className="rounded-[1.75rem] border border-emerald-100 bg-white p-6 shadow-sm md:col-span-2 xl:col-span-3">
            <p className="text-sm text-slate-600">
              No resources found for this track yet.
            </p>
          </div>
        )}
      </section>
    </main>
  );
}

function StatCard({
  label,
  value,
  tone = "bg-white",
  valueClass = "text-slate-900",
}: {
  label: string;
  value: string | number;
  tone?: string;
  valueClass?: string;
}) {
  return (
    <div className={`rounded-[1.5rem] p-5 shadow-sm ring-1 ring-slate-200 ${tone}`}>
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className={`mt-2 text-3xl font-bold ${valueClass}`}>{value}</p>
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