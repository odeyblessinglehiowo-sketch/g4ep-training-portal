import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 8;

function isPdfFile(url?: string | null) {
  if (!url) return false;
  return url.toLowerCase().includes(".pdf");
}

function isImageFile(url?: string | null) {
  if (!url) return false;

  const lower = url.toLowerCase();

  if (lower.includes(".pdf")) return false;

  return (
    lower.endsWith(".jpg") ||
    lower.endsWith(".jpeg") ||
    lower.endsWith(".png") ||
    lower.endsWith(".webp") ||
    lower.endsWith(".gif")
  );
}

export default async function StudentResourcesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const params = await searchParams;
  const page = Number(params.page ?? "1");

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

  const totalResources = await db.resource.count({
    where: {
      track: student.track,
    },
  });

  const totalPages = Math.max(1, Math.ceil(totalResources / PAGE_SIZE));
  const currentPage = Math.min(Math.max(page, 1), totalPages);

  const resources = await db.resource.findMany({
    where: {
      track: student.track,
    },
    orderBy: {
      createdAt: "desc",
    },
    skip: (currentPage - 1) * PAGE_SIZE,
    take: PAGE_SIZE,
  });

  return (
    <main className="space-y-4">
      <section className="overflow-hidden border border-emerald-200 bg-gradient-to-r from-emerald-950 via-emerald-700 to-lime-500 px-4 py-3 text-white shadow-sm">
        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-emerald-100/90">
          Training Materials
        </p>

        <h1 className="mt-1 text-xl font-bold sm:text-2xl">
          {student.track} Resources
        </h1>

        <p className="mt-1 text-sm text-emerald-50/90">
          Access all study materials shared for your track, including files,
          PDFs, images, and helpful links.
        </p>
      </section>

      <section className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {resources.length > 0 ? (
          resources.map((resource) => (
            <article
              key={resource.id}
              className="border border-emerald-100 bg-white p-4 shadow-sm"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <h3 className="text-sm font-bold leading-6 text-slate-900 sm:text-base">
                  {resource.title}
                </h3>

                <div className="flex flex-wrap gap-1.5">
                  {resource.fileUrl && isPdfFile(resource.fileUrl) && (
                    <span className="bg-sky-100 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-sky-700">
                      PDF
                    </span>
                  )}

                  {resource.fileUrl && isImageFile(resource.fileUrl) && (
                    <span className="bg-emerald-100 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-emerald-700">
                      Image
                    </span>
                  )}

                  {resource.fileUrl &&
                    !isPdfFile(resource.fileUrl) &&
                    !isImageFile(resource.fileUrl) && (
                      <span className="bg-slate-100 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-700">
                        File
                      </span>
                    )}

                  {resource.linkUrl && (
                    <span className="bg-indigo-100 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-indigo-700">
                      Link
                    </span>
                  )}
                </div>
              </div>

              <div className="mt-3 space-y-1.5 text-sm text-slate-600">
                <p>Track: {resource.track}</p>
                <p>
                  Uploaded: {new Date(resource.createdAt).toLocaleDateString()}
                </p>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {resource.fileUrl && isImageFile(resource.fileUrl) && (
                  <a
                    href={resource.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex bg-emerald-700 px-3 py-2 text-sm font-semibold text-white transition hover:bg-emerald-800"
                  >
                    View Image
                  </a>
                )}

                {resource.fileUrl && isPdfFile(resource.fileUrl) && (
                  <a
                    href={resource.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex bg-emerald-700 px-3 py-2 text-sm font-semibold text-white transition hover:bg-emerald-800"
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
                      className="inline-flex bg-emerald-700 px-3 py-2 text-sm font-semibold text-white transition hover:bg-emerald-800"
                    >
                      Open File
                    </a>
                  )}

                {resource.linkUrl && (
                  <a
                    href={resource.linkUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex bg-indigo-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700"
                  >
                    Open Link
                  </a>
                )}
              </div>
            </article>
          ))
        ) : (
          <div className="col-span-2 border border-emerald-100 bg-white p-4 shadow-sm xl:col-span-4">
            <p className="text-sm text-slate-600">
              No resources have been uploaded for your track yet.
            </p>
          </div>
        )}
      </section>

      <section className="flex items-center justify-between text-sm">
        <a
          href={`?page=${currentPage - 1}`}
          className={`font-medium text-slate-700 ${
            currentPage <= 1 ? "pointer-events-none opacity-40" : ""
          }`}
        >
          ← Prev
        </a>

        <span className="font-medium text-slate-700">
          Page {currentPage} of {totalPages}
        </span>

        <a
          href={`?page=${currentPage + 1}`}
          className={`font-medium text-slate-700 ${
            currentPage >= totalPages ? "pointer-events-none opacity-40" : ""
          }`}
        >
          Next →
        </a>
      </section>
    </main>
  );
}