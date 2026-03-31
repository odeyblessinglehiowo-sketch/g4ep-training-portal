import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { createTeacherResource } from "./actions";

export const dynamic = "force-dynamic";

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

export default async function TeacherResourcesPage() {
  const currentUser = await requireRole("TEACHER");

  const teacherUser = await db.user.findUnique({
    where: { id: currentUser.userId },
    include: { teacher: true },
  });

  if (!teacherUser?.teacher) {
    throw new Error("Teacher profile not found.");
  }

  const teacher = teacherUser.teacher;

  const resources = await db.resource.findMany({
    where: { track: teacher.track },
    orderBy: { createdAt: "desc" },
  });

  const totalResources = resources.length;
  const latestUpload =
    resources.length > 0
      ? new Date(resources[0].createdAt).toLocaleDateString()
      : "No uploads yet";

  return (
    <main className="space-y-6">
      <section className="rounded-[2rem] bg-gradient-to-r from-emerald-800 via-green-700 to-lime-500 p-6 text-white shadow-lg shadow-emerald-200/50 sm:p-8">
        <div className="grid gap-6 lg:grid-cols-[1.6fr_0.9fr] lg:items-start">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-50/90">
              Teacher Resources Hub
            </p>

            <h1 className="mt-3 text-3xl font-bold sm:text-4xl">
              Manage Learning Resources
            </h1>

            <p className="mt-4 max-w-3xl text-sm leading-7 text-emerald-50/90 sm:text-base">
              Upload and organize study materials for your students. Share PDFs,
              images, files, or useful links for your assigned track in one
              clean workspace.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
            <div className="rounded-2xl border border-white/20 bg-white/10 p-4 backdrop-blur">
              <p className="text-xs font-semibold uppercase tracking-[0.15em] text-emerald-50/80">
                Assigned Track
              </p>
              <p className="mt-2 text-2xl font-bold">{teacher.track}</p>
            </div>

            <div className="rounded-2xl border border-white/20 bg-white/10 p-4 backdrop-blur">
              <p className="text-xs font-semibold uppercase tracking-[0.15em] text-emerald-50/80">
                Total Resources
              </p>
              <p className="mt-2 text-2xl font-bold">{totalResources}</p>
            </div>

            <div className="rounded-2xl border border-white/20 bg-white/10 p-4 backdrop-blur">
              <p className="text-xs font-semibold uppercase tracking-[0.15em] text-emerald-50/80">
                Latest Upload
              </p>
              <p className="mt-2 text-lg font-bold">{latestUpload}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <section className="rounded-[1.75rem] border border-emerald-100 bg-white p-6 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-700">
            Upload Resource
          </p>

          <h2 className="mt-2 text-2xl font-bold text-slate-900">
            Add New Material
          </h2>

          <p className="mt-2 text-sm text-slate-600">
            Upload a file or paste a useful link for your students. You can use
            either one, or both.
          </p>

          <form
            action={createTeacherResource}
            encType="multipart/form-data"
            className="mt-6 space-y-4"
          >
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Resource Title
              </label>
              <input
                name="title"
                placeholder="e.g. HTML Beginner Guide"
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-emerald-600"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Optional Link
              </label>
              <input
                name="linkUrl"
                placeholder="https://example.com"
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-emerald-600"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Upload File
              </label>
              <input
                type="file"
                name="file"
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition file:mr-4 file:rounded-xl file:border-0 file:bg-emerald-100 file:px-4 file:py-2 file:font-semibold file:text-emerald-700 hover:file:bg-emerald-200"
              />
              <p className="mt-2 text-xs text-slate-500">
                Supports PDF, image, and other file types.
              </p>
            </div>

            <button
              type="submit"
              className="inline-flex rounded-2xl bg-emerald-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-800"
            >
              Upload Resource
            </button>
          </form>
        </section>

        <section className="rounded-[1.75rem] border border-emerald-100 bg-white p-6 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-700">
            Track Summary
          </p>

          <h2 className="mt-2 text-2xl font-bold text-slate-900">
            Resource Overview
          </h2>

          <div className="mt-6 space-y-4">
            <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-4">
              <span className="text-sm text-slate-600">Track</span>
              <span className="text-sm font-semibold text-slate-900">
                {teacher.track}
              </span>
            </div>

            <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-4">
              <span className="text-sm text-slate-600">Resources</span>
              <span className="text-sm font-semibold text-slate-900">
                {totalResources}
              </span>
            </div>

            <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-4">
              <span className="text-sm text-slate-600">Latest Upload</span>
              <span className="text-sm font-semibold text-slate-900">
                {latestUpload}
              </span>
            </div>
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
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="text-2xl font-bold text-slate-900">
                    {resource.title}
                  </h3>

                  <p className="mt-3 text-sm text-slate-600">
                    Uploaded:{" "}
                    {new Date(resource.createdAt).toLocaleDateString()}
                  </p>

                  <p className="mt-1 text-sm text-slate-600">
                    Track: {resource.track}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  {resource.fileUrl && isImageFile(resource.fileUrl) && (
                    <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                      Image
                    </span>
                  )}

                  {resource.fileUrl && isPdfFile(resource.fileUrl) && (
                    <span className="rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold text-sky-700">
                      PDF
                    </span>
                  )}

                  {resource.fileUrl &&
                    !isImageFile(resource.fileUrl) &&
                    !isPdfFile(resource.fileUrl) && (
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
                    className="inline-flex rounded-2xl bg-emerald-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-800"
                  >
                    View Image
                  </a>
                )}

                {resource.fileUrl && isPdfFile(resource.fileUrl) && (
                  <a
                    href={resource.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex rounded-2xl bg-emerald-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-800"
                  >
                    View PDF
                  </a>
                )}

                {resource.fileUrl &&
                  !isImageFile(resource.fileUrl) &&
                  !isPdfFile(resource.fileUrl) && (
                    <a
                      href={resource.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex rounded-2xl bg-emerald-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-800"
                    >
                      Open File
                    </a>
                  )}

                {resource.linkUrl && (
                  <a
                    href={resource.linkUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex rounded-2xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700"
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
              No resources uploaded yet for this track.
            </p>
          </div>
        )}
      </section>
    </main>
  );
}