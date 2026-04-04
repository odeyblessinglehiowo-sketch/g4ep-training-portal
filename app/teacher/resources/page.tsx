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

  const linkedResources = resources.filter((resource) => !!resource.linkUrl).length;

  return (
    <main className="space-y-4">
      <section className="overflow-hidden border border-emerald-200 bg-gradient-to-r from-emerald-950 via-emerald-700 to-lime-500 px-4 py-2.5 text-white shadow-[0_18px_45px_-22px_rgba(16,185,129,0.55)] sm:px-5">
        <div className="grid gap-2.5 lg:grid-cols-[1.65fr_0.95fr] lg:items-start">
          <div className="max-w-3xl">
            <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-emerald-100/90">
              Teacher Resources Hub
            </p>

            <h1 className="mt-0.5 text-lg font-bold leading-tight sm:text-xl">
              Manage Learning Resources
            </h1>

            <p className="mt-1 text-[11px] leading-4 text-emerald-50/90 sm:text-xs">
              Upload and organize study materials for your students from one central workspace.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <HeroStatCard label="Track" value={teacher.track} />
            <HeroStatCard label="Resources" value={String(totalResources)} />
            <HeroStatCard label="Latest Upload" value={latestUpload} small />
            <HeroStatCard label="Linked Resources" value={String(linkedResources)} />
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <section className="border border-emerald-100 bg-white p-4 shadow-sm">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-emerald-700">
              Upload Resource
            </p>

            <h2 className="mt-1 text-lg font-bold text-slate-900">
              Add New Material
            </h2>
          </div>

          <p className="mt-1.5 text-xs text-slate-600 sm:text-sm">
            Upload a file or paste a useful link for your students. You can use either one, or both.
          </p>

          <form
            action={createTeacherResource}
            encType="multipart/form-data"
            className="mt-4 grid gap-3"
          >
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.12em] text-slate-600 sm:text-sm">
                Resource Title
              </label>
              <input
                name="title"
                placeholder="e.g. HTML Beginner Guide"
                className="w-full border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-emerald-600"
              />
            </div>

            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.12em] text-slate-600 sm:text-sm">
                Link (optional)
              </label>
              <input
                name="linkUrl"
                placeholder="https://example.com"
                className="w-full border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-emerald-600"
              />
            </div>

            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.12em] text-slate-600 sm:text-sm">
                Upload File
              </label>
              <input
                type="file"
                name="file"
                className="w-full border border-slate-300 px-3 py-2.5 text-sm outline-none transition file:mr-4 file:border-0 file:bg-emerald-100 file:px-3 file:py-2 file:font-semibold file:text-emerald-700 hover:file:bg-emerald-200"
              />
              <p className="mt-2 text-[11px] text-slate-500 sm:text-xs">
                Supports PDF, image, and other file types.
              </p>
            </div>

            <button
              type="submit"
              className="inline-flex w-fit bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-800"
            >
              Upload Resource
            </button>
          </form>
        </section>

        <section className="border border-emerald-100 bg-white p-4 shadow-sm">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-emerald-700">
              Track Summary
            </p>

            <h2 className="mt-1 text-lg font-bold text-slate-900">
              Resource Overview
            </h2>
          </div>

          <div className="mt-4 grid gap-2.5">
            <OverviewRow label="Track" value={teacher.track} />
            <OverviewRow label="Resources" value={String(totalResources)} />
            <OverviewRow label="Latest Upload" value={latestUpload} />
            <OverviewRow label="Linked Resources" value={String(linkedResources)} />
          </div>
        </section>
      </section>

      <section className="grid grid-cols-2 gap-2.5 md:grid-cols-2 xl:grid-cols-4">
        {resources.length > 0 ? (
          resources.map((resource) => (
            <article
              key={resource.id}
              className="border border-emerald-100 bg-white p-3 shadow-sm transition hover:shadow-md"
            >
              <div className="flex flex-col gap-2">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 sm:text-base">
                    {resource.title}
                  </h3>

                  <p className="mt-1 text-[11px] text-slate-600 sm:text-xs">
                    Uploaded: {new Date(resource.createdAt).toLocaleDateString()}
                  </p>

                  <p className="mt-1 text-[11px] text-slate-600 sm:text-xs">
                    Track: {resource.track}
                  </p>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {resource.fileUrl && isImageFile(resource.fileUrl) && (
                    <span className="bg-emerald-100 px-2 py-1 text-[10px] font-semibold text-emerald-700">
                      Image
                    </span>
                  )}

                  {resource.fileUrl && isPdfFile(resource.fileUrl) && (
                    <span className="bg-sky-100 px-2 py-1 text-[10px] font-semibold text-sky-700">
                      PDF
                    </span>
                  )}

                  {resource.fileUrl &&
                    !isImageFile(resource.fileUrl) &&
                    !isPdfFile(resource.fileUrl) && (
                      <span className="bg-slate-100 px-2 py-1 text-[10px] font-semibold text-slate-700">
                        File
                      </span>
                    )}

                  {resource.linkUrl && (
                    <span className="bg-indigo-100 px-2 py-1 text-[10px] font-semibold text-indigo-700">
                      Link
                    </span>
                  )}
                </div>

                <div className="mt-1 flex flex-wrap gap-2">
                  {resource.fileUrl && isImageFile(resource.fileUrl) && (
                    <a
                      href={resource.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-emerald-700 px-3 py-2 text-[11px] font-semibold text-white transition hover:bg-emerald-800 sm:text-xs"
                    >
                      View Image
                    </a>
                  )}

                  {resource.fileUrl && isPdfFile(resource.fileUrl) && (
                    <a
                      href={resource.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-emerald-700 px-3 py-2 text-[11px] font-semibold text-white transition hover:bg-emerald-800 sm:text-xs"
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
                        className="bg-emerald-700 px-3 py-2 text-[11px] font-semibold text-white transition hover:bg-emerald-800 sm:text-xs"
                      >
                        Open File
                      </a>
                    )}

                  {resource.linkUrl && (
                    <a
                      href={resource.linkUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-indigo-600 px-3 py-2 text-[11px] font-semibold text-white transition hover:bg-indigo-700 sm:text-xs"
                    >
                      Open Link
                    </a>
                  )}
                </div>
              </div>
            </article>
          ))
        ) : (
          <div className="col-span-2 border border-emerald-100 bg-white p-4 shadow-sm md:col-span-2 xl:col-span-4">
            <p className="text-sm text-slate-600">
              No resources uploaded yet for this track.
            </p>
          </div>
        )}
      </section>
    </main>
  );
}

function HeroStatCard({
  label,
  value,
  small = false,
}: {
  label: string;
  value: string;
  small?: boolean;
}) {
  return (
    <div className="border border-white/20 bg-white/10 px-3 py-1.5 backdrop-blur">
      <p className="text-[9px] font-semibold uppercase tracking-[0.1em] text-emerald-50/80">
        {label}
      </p>
      <p
        className={`mt-0.5 font-bold text-white ${
          small ? "text-[11px] sm:text-xs" : "text-sm sm:text-base"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function OverviewRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between border border-slate-200 bg-slate-50 px-3 py-3">
      <span className="text-sm text-slate-600">{label}</span>
      <span className="text-sm font-semibold text-slate-900">{value}</span>
    </div>
  );
}