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
      {/* HEADER */}
      <section className="rounded-2xl bg-white p-6 shadow">
        <h1 className="text-2xl font-bold">Manage Resources</h1>
        <p className="text-sm text-gray-600">
          Upload files or share links for students.
        </p>
      </section>

      {/* FORM */}
      <section className="rounded-2xl bg-white p-6 shadow">
        <h2 className="font-bold text-lg mb-4">Upload Resource</h2>

        <form action={createTeacherResource} className="space-y-4">
          <input
            name="title"
            placeholder="Title"
            className="w-full border p-3 rounded"
          />

          <input
            name="linkUrl"
            placeholder="Optional Link"
            className="w-full border p-3 rounded"
          />

          <input
            type="file"
            name="file"
            className="w-full border p-3 rounded"
          />

          <button className="bg-green-700 text-white px-4 py-2 rounded">
            Upload
          </button>
        </form>
      </section>

      {/* LIST */}
      <section className="grid gap-6">
        {resources.map((resource) => (
          <div key={resource.id} className="bg-white p-6 rounded shadow">
            <h3 className="font-bold text-lg">{resource.title}</h3>

            <p className="text-sm text-gray-500 mt-1">
              {new Date(resource.createdAt).toLocaleDateString()}
            </p>

            {/* IMAGE */}
            {resource.fileUrl && isImageFile(resource.fileUrl) && (
  <img
    src={resource.fileUrl}
    className="mt-4 max-h-[300px] object-contain"
  />
)}

{/* PDF */}
{resource.fileUrl && isPdfFile(resource.fileUrl) && (
  <a
    href={resource.fileUrl}
    target="_blank"
    rel="noopener noreferrer"
    className="mt-4 inline-block bg-green-700 text-white px-4 py-2 rounded"
  >
    View PDF
  </a>
)}

            {/* LINK */}
            {resource.linkUrl && (
              <a
                href={resource.linkUrl}
                target="_blank"
                className="mt-4 inline-block bg-blue-600 text-white px-4 py-2 rounded"
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