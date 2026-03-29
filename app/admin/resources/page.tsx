import { db } from "@/lib/db";
export const dynamic = "force-dynamic";
import { createResource } from "./actions";

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
        <form action={createResource} className="grid gap-4 md:grid-cols-3">
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
            name="fileUrl"
            type="text"
            placeholder="File URL"
            className="rounded-lg border border-slate-300 px-4 py-2 outline-none focus:border-green-700"
          />

          <button
            type="submit"
            className="col-span-3 rounded-lg bg-green-700 py-2 font-semibold text-white hover:bg-green-800"
          >
            Upload Resource
          </button>
        </form>
      </section>

      <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {resources.map((resource) => (
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

            {resource.fileUrl && (
  <a
    href={resource.fileUrl}
    target="_blank"
    rel="noopener noreferrer"
    className="mt-4 ml-3 inline-block rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
  >
    Open Link
  </a>
)}
          </div>
        ))}
      </section>
    </main>
  );
}