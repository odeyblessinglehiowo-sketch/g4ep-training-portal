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
    <main className="space-y-6">
      <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-green-700">
          Resources
        </p>

        <h1 className="mt-2 text-3xl font-bold text-slate-900">
          Training Materials
        </h1>

        <p className="mt-2 text-sm text-slate-600">
          Upload and manage learning resources for each training track.
        </p>
      </section>

      <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <form
          action={createResource}
          encType="multipart/form-data"
          className="grid gap-4 md:grid-cols-2"
        >
          <input
            name="title"
            type="text"
            placeholder="Resource Title"
            className="rounded-lg border border-slate-300 px-4 py-2 outline-none focus:border-green-700"
          />

          <input
            name="track"
            type="text"
            placeholder="Track (Web Design, AI, Photography...)"
            className="rounded-lg border border-slate-300 px-4 py-2 outline-none focus:border-green-700"
          />

          <input
            name="linkUrl"
            type="text"
            placeholder="Optional Link"
            className="rounded-lg border border-slate-300 px-4 py-2 outline-none focus:border-green-700 md:col-span-2"
          />

          <input
            name="file"
            type="file"
            className="rounded-lg border border-slate-300 px-4 py-2 outline-none focus:border-green-700 md:col-span-2"
          />

          <button
            type="submit"
            className="md:col-span-2 rounded-lg bg-green-700 py-2 font-semibold text-white hover:bg-green-800"
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
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    {resource.title}
                  </h3>

                  <p className="mt-2 text-sm text-slate-600">
                    Track: {resource.track}
                  </p>

                  <p className="mt-1 text-sm text-slate-500">
                    Uploaded: {new Date(resource.createdAt).toLocaleDateString()}
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

              <div className="mt-5 flex flex-wrap gap-3">
                {resource.fileUrl && isImageFile(resource.fileUrl) && (
                  <a
                    href={resource.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block rounded-lg bg-green-700 px-4 py-2 text-sm font-semibold text-white hover:bg-green-800"
                  >
                    View Image
                  </a>
                )}

                {resource.fileUrl && isPdfFile(resource.fileUrl) && (
                  <a
                    href={resource.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block rounded-lg bg-green-700 px-4 py-2 text-sm font-semibold text-white hover:bg-green-800"
                  >
                    View PDF
                  </a>
                )}

                {resource.fileUrl &&
                  !isPdfFile(resource.fileUrl) &&
                  !isImageFile(resource.fileUrl) && (
                    <a
                      href={resource.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block rounded-lg bg-green-700 px-4 py-2 text-sm font-semibold text-white hover:bg-green-800"
                    >
                      Open File
                    </a>
                  )}

                {resource.linkUrl && (
                  <a
                    href={resource.linkUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
                  >
                    Open Link
                  </a>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200 md:col-span-2 xl:col-span-3">
            <p className="text-sm text-slate-600">
              No resources uploaded yet.
            </p>
          </div>
        )}
      </section>
    </main>
  );
}