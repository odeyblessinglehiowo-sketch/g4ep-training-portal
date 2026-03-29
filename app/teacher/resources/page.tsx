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

  return (
    <main className="space-y-6">
      <section className="rounded-2xl bg-white p-6 shadow">
        <h1 className="text-2xl font-bold">Manage Resources</h1>
        <p className="text-sm text-gray-600">
          Upload files or share links for students.
        </p>
      </section>

      <section className="rounded-2xl bg-white p-6 shadow">
        <h2 className="mb-4 text-lg font-bold">Upload Resource</h2>

        <form
          action={createTeacherResource}
          encType="multipart/form-data"
          className="space-y-4"
        >
          <input
            name="title"
            placeholder="Resource Title"
            className="w-full rounded border p-3"
          />

          <input
            name="linkUrl"
            placeholder="Optional Link"
            className="w-full rounded border p-3"
          />

          <input
            type="file"
            name="file"
            className="w-full rounded border p-3"
          />

          <button
            type="submit"
            className="rounded bg-green-700 px-4 py-2 text-white"
          >
            Upload Resource
          </button>
        </form>
      </section>

      <section className="grid gap-6">
        {resources.length > 0 ? (
          resources.map((resource) => (
            <div key={resource.id} className="rounded bg-white p-6 shadow">
              <h3 className="text-lg font-bold">{resource.title}</h3>

              <p className="mt-1 text-sm text-gray-500">
                {new Date(resource.createdAt).toLocaleDateString()}
              </p>

              <div className="mt-4 flex flex-wrap gap-2">
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

              <div className="mt-5 flex flex-wrap gap-3">
                {resource.fileUrl && isImageFile(resource.fileUrl) && (
                  <a
                    href={resource.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block rounded bg-green-700 px-4 py-2 text-white"
                  >
                    View Image
                  </a>
                )}

                {resource.fileUrl && isPdfFile(resource.fileUrl) && (
                  <a
                    href={resource.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block rounded bg-green-700 px-4 py-2 text-white"
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
                      className="inline-block rounded bg-green-700 px-4 py-2 text-white"
                    >
                      Open File
                    </a>
                  )}

                {resource.linkUrl && (
                  <a
                    href={resource.linkUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block rounded bg-blue-600 px-4 py-2 text-white"
                  >
                    Open Link
                  </a>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="rounded bg-white p-6 shadow">
            <p className="text-sm text-gray-600">
              No resources uploaded yet for this track.
            </p>
          </div>
        )}
      </section>
    </main>
  );
}