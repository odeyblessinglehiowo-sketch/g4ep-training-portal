import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

function isPdfFile(url?: string | null) {
  if (!url) return false;
  return url.toLowerCase().includes(".pdf");
}

function isImageFile(url?: string | null) {
  if (!url) return false;

  const lower = url.toLowerCase();

  if (lower.includes(".pdf")) {
    return false;
  }

  return (
    lower.endsWith(".jpg") ||
    lower.endsWith(".jpeg") ||
    lower.endsWith(".png") ||
    lower.endsWith(".webp") ||
    lower.endsWith(".gif")
  );
}

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
      <section className="rounded-[2rem] bg-gradient-to-r from-emerald-800 via-green-700 to-lime-500 p-6 text-white shadow-lg shadow-emerald-200/50 sm:p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-50/90">
          Training Materials
        </p>

        <h1 className="mt-3 text-3xl font-bold sm:text-4xl">
          {student.track} Resources
        </h1>

        <p className="mt-4 max-w-3xl text-sm leading-7 text-emerald-50/90 sm:text-base">
          Access all study materials shared for your track, including files,
          PDFs, images, and helpful links.
        </p>
      </section>

      <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {resources.length > 0 ? (
          resources.map((resource) => (
            <article
              key={resource.id}
              className="rounded-[1.75rem] border border-emerald-100 bg-white p-6 shadow-sm transition hover:shadow-md"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="text-xl font-bold text-slate-900">
                    {resource.title}
                  </h3>

                  <div className="mt-3 space-y-2 text-sm text-slate-600">
                    <p>Track: {resource.track}</p>
                    <p>
                      Uploaded:{" "}
                      {new Date(resource.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {resource.fileUrl && isPdfFile(resource.fileUrl) && (
                    <span className="rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold text-sky-700">
                      PDF
                    </span>
                  )}

                  {resource.fileUrl && isImageFile(resource.fileUrl) && (
                    <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                      Image
                    </span>
                  )}

                  {resource.fileUrl &&
                    !isPdfFile(resource.fileUrl) &&
                    !isImageFile(resource.fileUrl) && (
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                        File
                      </span>
                    )}

                  {resource.linkUrl && (
                    <span className="rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold text-indigo-700">
                      Link
                    </span>
                  )}
                </div>
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                {resource.fileUrl && isImageFile(resource.fileUrl) && (
                  <a
                    href={resource.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex rounded-xl bg-emerald-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-800"
                  >
                    View Image
                  </a>
                )}

                {resource.fileUrl && isPdfFile(resource.fileUrl) && (
                  <a
                    href={resource.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex rounded-xl bg-emerald-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-800"
                  >
                    Open PDF
                  </a>
                )}

                {resource.fileUrl &&
                  !isPdfFile(resource.fileUrl) &&
                  !isImageFile(resource.fileUrl) && (
                    <a
                      href={resource.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex rounded-xl bg-emerald-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-800"
                    >
                      Open File
                    </a>
                  )}

                {resource.linkUrl && (
                  <a
                    href={resource.linkUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700"
                  >
                    Open Link
                  </a>
                )}
              </div>
            </article>
          ))
        ) : (
          <div className="rounded-[1.75rem] border border-emerald-100 bg-white p-6 shadow-sm md:col-span-2 xl:col-span-3">
            <p className="text-sm text-slate-600">
              No resources have been uploaded for your track yet.
            </p>
          </div>
        )}
      </section>
    </main>
  );
}