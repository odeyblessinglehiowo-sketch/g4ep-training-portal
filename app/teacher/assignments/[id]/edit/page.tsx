import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { updateAssignment } from "../../actions";

export const dynamic = "force-dynamic";

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
    <main className="space-y-6">
      <section className="rounded-[2rem] bg-gradient-to-r from-emerald-800 via-green-700 to-lime-500 p-6 text-white shadow-lg shadow-emerald-200/50 sm:p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-50/90">
          Edit Assignment
        </p>
        <h1 className="mt-3 text-3xl font-bold sm:text-4xl">
          Update Assignment
        </h1>
        <p className="mt-4 max-w-2xl text-sm leading-7 text-emerald-50/90 sm:text-base">
          Update your assignment content, image link, support link, due date,
          and publish state.
        </p>
      </section>

      <section className="rounded-[1.75rem] border border-emerald-100 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-2xl font-bold text-slate-900">Edit Form</h2>

          <Link
            href={`/teacher/assignments/${assignment.id}`}
            className="rounded-xl bg-slate-200 px-4 py-2 text-sm font-semibold text-slate-800 transition hover:bg-slate-300"
          >
            Back to Details
          </Link>
        </div>

        <form action={updateAssignment} className="mt-6 space-y-5">
          <input type="hidden" name="assignmentId" value={assignment.id} />

          <div>
            <label
              htmlFor="title"
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              Assignment Title
            </label>
            <input
              id="title"
              name="title"
              type="text"
              defaultValue={assignment.title}
              required
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-500"
            />
          </div>

          <div>
            <label
              htmlFor="question"
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              Assignment Question / Instructions
            </label>
            <textarea
              id="question"
              name="question"
              rows={7}
              defaultValue={assignment.question ?? ""}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-500"
            />
          </div>

          <div>
            <label
              htmlFor="imageUrl"
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              Image URL
            </label>
            <input
              id="imageUrl"
              name="imageUrl"
              type="url"
              defaultValue={assignment.imageUrl ?? ""}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-500"
            />
          </div>

          <div>
            <label
              htmlFor="linkUrl"
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              Link URL
            </label>
            <input
              id="linkUrl"
              name="linkUrl"
              type="url"
              defaultValue={assignment.linkUrl ?? ""}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-500"
            />
          </div>

          <div>
            <label
              htmlFor="linkLabel"
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              Link Label
            </label>
            <input
              id="linkLabel"
              name="linkLabel"
              type="text"
              defaultValue={assignment.linkLabel ?? ""}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-500"
            />
          </div>

          <div>
            <label
              htmlFor="dueDate"
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              Due Date
            </label>
            <input
              id="dueDate"
              name="dueDate"
              type="datetime-local"
              defaultValue={toDatetimeLocalValue(assignment.dueDate)}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-500"
            />
          </div>

          <div>
            <label
              htmlFor="isPublished"
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              Publish Status
            </label>
            <select
              id="isPublished"
              name="isPublished"
              defaultValue={assignment.isPublished ? "true" : "false"}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-500"
            >
              <option value="true">Published</option>
              <option value="false">Unpublished</option>
            </select>
          </div>

          <button
            type="submit"
            className="inline-flex items-center justify-center rounded-2xl bg-emerald-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-800 active:scale-[0.98]"
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