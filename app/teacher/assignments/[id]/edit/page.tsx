import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { updateAssignment } from "../../actions";

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
    lower.includes(".jpg") ||
    lower.includes(".jpeg") ||
    lower.includes(".png") ||
    lower.includes(".webp") ||
    lower.includes(".gif") ||
    lower.includes("/image/upload/")
  );
}

export default async function TeacherEditAssignmentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const currentUser = await requireRole("TEACHER");

  const teacherUser = await db.user.findUnique({
    where: {
      id: currentUser.userId,
    },
    include: {
      teacher: true,
    },
  });

  if (!teacherUser?.teacher) {
    throw new Error("Teacher profile not found.");
  }

  const assignment = await db.assignment.findUnique({
    where: {
      id,
    },
  });

  if (!assignment || assignment.teacherId !== teacherUser.teacher.id) {
    throw new Error("Assignment not found.");
  }

  return (
    <main className="space-y-4">
      <section className="overflow-hidden border border-emerald-200 bg-gradient-to-r from-emerald-950 via-emerald-700 to-lime-500 px-4 py-3 text-white shadow-[0_18px_45px_-22px_rgba(16,185,129,0.55)] sm:px-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-emerald-100/90">
              Edit Assignment
            </p>

            <h1 className="mt-0.5 text-lg font-bold leading-tight sm:text-xl">
              Update Assignment
            </h1>

            <p className="mt-1 text-[11px] leading-4 text-emerald-50/90 sm:text-xs">
              Update the content, attachment, due date, link details, and publish status.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              href={`/teacher/assignments/${assignment.id}`}
              className="bg-white px-3 py-2 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-50"
            >
              Back to Details
            </Link>
          </div>
        </div>
      </section>

      <section className="border border-emerald-100 bg-white p-4 shadow-sm">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-emerald-700">
            Edit Form
          </p>

          <h2 className="mt-1 text-lg font-bold text-slate-900">
            Assignment Update
          </h2>
        </div>

        <form
          action={updateAssignment}
          encType="multipart/form-data"
          className="mt-4 grid gap-3"
        >
          <input type="hidden" name="assignmentId" value={assignment.id} />

          <div>
            <label
              htmlFor="title"
              className="mb-2 block text-xs font-semibold uppercase tracking-[0.12em] text-slate-600 sm:text-sm"
            >
              Assignment Title
            </label>
            <input
              id="title"
              name="title"
              type="text"
              defaultValue={assignment.title}
              required
              className="w-full border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-emerald-500"
            />
          </div>

          <div>
            <label
              htmlFor="question"
              className="mb-2 block text-xs font-semibold uppercase tracking-[0.12em] text-slate-600 sm:text-sm"
            >
              Assignment Question / Instructions
            </label>
            <textarea
              id="question"
              name="question"
              rows={6}
              defaultValue={assignment.question ?? ""}
              className="w-full border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-emerald-500"
            />
          </div>

          {assignment.attachmentUrl && (
            <div className="border border-slate-200 bg-slate-50 p-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500 sm:text-xs">
                Current Attachment
              </p>

              <div className="mt-3">
                {isImageFile(assignment.attachmentUrl) ? (
                  <img
                    src={assignment.attachmentUrl}
                    alt={assignment.title}
                    className="max-h-64 w-full object-contain ring-1 ring-slate-200"
                  />
                ) : (
                  <a
                    href={assignment.attachmentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex bg-emerald-700 px-3 py-2 text-xs font-semibold text-white transition hover:bg-emerald-800 sm:px-4 sm:text-sm"
                  >
                    {isPdfFile(assignment.attachmentUrl)
                      ? "Open Current PDF"
                      : "Open Current Attachment"}
                  </a>
                )}
              </div>
            </div>
          )}

          <div>
            <label
              htmlFor="uploadFile"
              className="mb-2 block text-xs font-semibold uppercase tracking-[0.12em] text-slate-600 sm:text-sm"
            >
              Upload New Assignment File <span className="text-slate-400">(Optional)</span>
            </label>
            <input
              id="uploadFile"
              name="uploadFile"
              type="file"
              accept=".pdf,image/*"
              className="w-full border border-slate-300 px-3 py-2.5 text-sm outline-none transition file:mr-4 file:border-0 file:bg-emerald-100 file:px-3 file:py-2 file:font-semibold file:text-emerald-700 hover:file:bg-emerald-200"
            />
            <p className="mt-2 text-[11px] text-slate-500 sm:text-xs">
              Uploading a new file will replace the current attachment URL below.
            </p>
          </div>

          <div>
            <label
              htmlFor="imageUrl"
              className="mb-2 block text-xs font-semibold uppercase tracking-[0.12em] text-slate-600 sm:text-sm"
            >
              Attachment URL <span className="text-slate-400">(Optional)</span>
            </label>
            <input
              id="imageUrl"
              name="imageUrl"
              type="url"
              defaultValue={assignment.attachmentUrl ?? ""}
              className="w-full border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-emerald-500"
            />
          </div>

          <div>
            <label
              htmlFor="linkUrl"
              className="mb-2 block text-xs font-semibold uppercase tracking-[0.12em] text-slate-600 sm:text-sm"
            >
              Support Link <span className="text-slate-400">(Optional)</span>
            </label>
            <input
              id="linkUrl"
              name="linkUrl"
              type="url"
              defaultValue={assignment.linkUrl ?? ""}
              className="w-full border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-emerald-500"
            />
          </div>

          <div>
            <label
              htmlFor="linkLabel"
              className="mb-2 block text-xs font-semibold uppercase tracking-[0.12em] text-slate-600 sm:text-sm"
            >
              Link Label <span className="text-slate-400">(Optional)</span>
            </label>
            <input
              id="linkLabel"
              name="linkLabel"
              type="text"
              defaultValue={assignment.linkLabel ?? ""}
              className="w-full border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-emerald-500"
            />
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <label
                htmlFor="dueDate"
                className="mb-2 block text-xs font-semibold uppercase tracking-[0.12em] text-slate-600 sm:text-sm"
              >
                Due Date <span className="text-slate-400">(Optional)</span>
              </label>
              <input
                id="dueDate"
                name="dueDate"
                type="datetime-local"
                defaultValue={toDatetimeLocalValue(assignment.dueDate)}
                className="w-full border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-emerald-500"
              />
            </div>

            <div>
              <label
                htmlFor="isPublished"
                className="mb-2 block text-xs font-semibold uppercase tracking-[0.12em] text-slate-600 sm:text-sm"
              >
                Publish Status
              </label>
              <select
                id="isPublished"
                name="isPublished"
                defaultValue={assignment.isPublished ? "true" : "false"}
                className="w-full border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-emerald-500"
              >
                <option value="true">Published</option>
                <option value="false">Unpublished</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            className="inline-flex w-fit items-center justify-center bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-800 active:scale-[0.98]"
          >
            Save Changes
          </button>
        </form>
      </section>
    </main>
  );
}

function toDatetimeLocalValue(date: Date | null) {
  if (!date) return "";
  const d = new Date(date);
  const year = d.getFullYear();
  const month = `${d.getMonth() + 1}`.padStart(2, "0");
  const day = `${d.getDate()}`.padStart(2, "0");
  const hours = `${d.getHours()}`.padStart(2, "0");
  const minutes = `${d.getMinutes()}`.padStart(2, "0");
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}