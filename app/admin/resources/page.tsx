import { db } from "@/lib/db";
import { createResource } from "./actions";

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

export default async function AdminResourcesPage() {
  const resources = await db.resource.findMany({
    orderBy: {
      createdAt: "desc",
    },
  });

  return (
    <main className="space-y-4">

      {/* HERO (NOW GREEN) */}
      <section className="overflow-hidden border border-emerald-200 bg-gradient-to-r from-emerald-950 via-emerald-700 to-lime-500 px-4 py-4 text-white shadow-[0_18px_45px_-22px_rgba(16,185,129,0.55)] sm:px-5">
        <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-emerald-100/90">
          Resources
        </p>

        <h1 className="mt-1.5 text-xl font-bold sm:text-2xl">
          Training Materials
        </h1>

        <p className="mt-2 text-xs text-emerald-50/90 sm:text-sm">
          Upload and manage learning resources from one central workspace.
        </p>
      </section>

      {/* FORM (TIGHT + CLEAN) */}
      <section className="border border-emerald-100 bg-white p-3 shadow-sm">
        <form
          action={createResource}
          encType="multipart/form-data"
          className="grid gap-3 md:grid-cols-2"
        >
          <input
            name="title"
            type="text"
            placeholder="Resource Title"
            className="border border-slate-300 px-3 py-2 text-sm outline-none focus:border-green-600"
          />

          <input
            name="track"
            type="text"
            placeholder="Track (Web Design, AI, Photography...)"
            className="border border-slate-300 px-3 py-2 text-sm outline-none focus:border-green-600"
          />

          <input
            name="linkUrl"
            type="text"
            placeholder="Link (optional)"
            className="border border-slate-300 px-3 py-2 text-sm outline-none focus:border-green-600 md:col-span-2"
          />

          <input
            name="file"
            type="file"
            className="border border-slate-300 px-3 py-2 text-sm outline-none focus:border-green-600 md:col-span-2"
          />

          <button
            type="submit"
            className="md:col-span-2 bg-green-700 py-2 text-sm font-semibold text-white transition hover:bg-green-800"
          >
            Upload Resource
          </button>
        </form>
      </section>

      {/* RESOURCE LIST */}
      <section className="grid grid-cols-2 gap-2.5 md:grid-cols-2 xl:grid-cols-3">
        {resources.length > 0 ? (
          resources.map((resource) => (
            <div
              key={resource.id}
              className="border border-emerald-100 bg-white p-4 shadow-sm transition hover:shadow-md"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    {resource.title}
                  </h3>

                  <p className="mt-1 text-xs text-slate-600">
                    Track: {resource.track}
                  </p>

                  <p className="text-[11px] text-slate-500">
                    {new Date(resource.createdAt).toLocaleDateString()}
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

                  {resource.linkUrl && (
                    <span className="bg-indigo-100 px-2 py-1 text-[10px] font-semibold text-indigo-700">
                      Link
                    </span>
                  )}
                </div>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                {resource.fileUrl && (
                  <a
                    href={resource.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-green-700 px-3 py-2 text-xs font-semibold text-white hover:bg-green-800"
                  >
                    View File
                  </a>
                )}

                {resource.linkUrl && (
                  <a
                    href={resource.linkUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-indigo-600 px-3 py-2 text-xs font-semibold text-white hover:bg-indigo-700"
                  >
                    Open Link
                  </a>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="border border-emerald-100 bg-white p-4 shadow-sm md:col-span-2 xl:col-span-3">
            <p className="text-sm text-slate-600">
              No resources uploaded yet.
            </p>
          </div>
        )}
      </section>
    </main>
  );
}