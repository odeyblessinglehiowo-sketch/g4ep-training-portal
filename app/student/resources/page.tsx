import { requireRole } from "@/lib/auth";
export const dynamic = "force-dynamic";
import { db } from "@/lib/db";

export default async function StudentResourcesPage() {
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

  const resources = await db.resource.findMany({
    where: {
      track: student.track,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return (
    <main className="space-y-6">
      <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-green-700">
          Training Materials
        </p>

        <h1 className="mt-2 text-3xl font-bold text-slate-900">
          {student.track} Resources
        </h1>

        <p className="mt-2 text-sm text-slate-600">
          Access all learning materials for your training track.
        </p>
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
                Training material for {resource.track}
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
              No resources have been uploaded for your track yet.
            </p>
          </div>
        )}
      </section>
    </main>
  );
}