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

  return (
    <main className="space-y-6">
      <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-green-700">
          Resources
        </p>

        <h1 className="mt-2 text-3xl font-bold text-slate-900">
          Manage Track Resources
        </h1>

        <p className="mt-2 text-sm text-slate-600">
          Upload and manage learning materials for your assigned teaching track.
        </p>
      </section>

      <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <div className="mb-4 rounded-2xl bg-green-50 p-4">
          <p className="text-sm font-medium text-slate-600">Assigned Track</p>
          <p className="mt-1 text-lg font-bold text-green-800">
            {teacher.track ?? "Not Assigned"}
          </p>
        </div>

        <form action={createTeacherResource} className="grid gap-4 md:grid-cols-2">
          <input
            name="title"
            type="text"
            placeholder="Resource Title"
            className="rounded-lg border border-slate-300 px-4 py-2 outline-none transition focus:border-green-700"
          />

          <input
            name="fileUrl"
            type="text"
            placeholder="File URL"
            className="rounded-lg border border-slate-300 px-4 py-2 outline-none transition focus:border-green-700"
          />

          <button
            type="submit"
            className="md:col-span-2 rounded-lg bg-green-700 py-2 font-semibold text-white transition hover:bg-green-800 active:scale-[0.98]"
          >
            Upload Resource
          </button>
        </form>
      </section>

      <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {resources.length > 0 ? (
          resources.map((resource) => (
            <div
              key={resource.id}
              className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200"
            >
              <h3 className="text-lg font-bold text-slate-900">
                {resource.title}
              </h3>

              <p className="mt-2 text-sm text-slate-600">
                Track: {resource.track}
              </p>

              <a
                href={resource.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-block rounded-lg bg-green-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-green-800 active:scale-[0.98]"
              >
                View Resource
              </a>
            </div>
          ))
        ) : (
          <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <p className="text-sm text-slate-600">
              No resources found for this track yet.
            </p>
          </div>
        )}
      </section>
    </main>
  );
}