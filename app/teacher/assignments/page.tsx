import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  createAssignment,
  deleteAssignment,
  toggleAssignmentPublish,
} from "./actions";

export const dynamic = "force-dynamic";

function isPdfFile(url?: string | null) {
  if (!url) return false;
  return url.toLowerCase().includes(".pdf");
}

function isImageFile(url?: string | null) {
  if (!url) return false;
  const lower = url.toLowerCase();
  return (
    lower.includes(".jpg") ||
    lower.includes(".jpeg") ||
    lower.includes(".png") ||
    lower.includes(".webp") ||
    lower.includes(".gif") ||
    lower.includes("/image/upload/")
  );
}

export default async function TeacherAssignmentsPage() {
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

  const teacher = teacherUser.teacher;

  const totalStudents = await db.student.count({
    where: {
      track: teacher.track,
    },
  });

  const assignments = await db.assignment.findMany({
    where: {
      teacherId: teacher.id,
      track: teacher.track,
    },
    include: {
      views: {
        include: {
          student: {
            include: {
              user: true,
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const activeAssignments = assignments.filter(
    (assignment) => assignment.isPublished
  );

  const assignmentsWithStats = assignments.map((assignment) => {
    const seenCount = assignment.views.filter((view) => view.seenAt !== null).length;
    const unreadCount = Math.max(totalStudents - seenCount, 0);

    return {
      ...assignment,
      seenCount,
      unreadCount,
    };
  });

  const unreadAssignmentBadgeCount = assignmentsWithStats.filter(
    (assignment) => assignment.unreadCount > 0 && assignment.isPublished
  ).length;

  return (
    <main className="space-y-6">
      <section className="overflow-hidden rounded-[2rem] bg-gradient-to-r from-emerald-800 via-green-700 to-lime-500 p-6 text-white shadow-lg shadow-emerald-200/50 sm:p-8">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-50/90">
              Assignment Management
            </p>

            <h1 className="mt-3 text-3xl font-bold leading-tight sm:text-4xl">
              Create and Manage Assignments
            </h1>

            <p className="mt-4 max-w-2xl text-sm leading-7 text-emerald-50/90 sm:text-base">
              Create assignments with text, uploaded images or PDFs, manual attachment URLs, and useful links.
            </p>
          </div>

          <div className="grid w-full grid-cols-2 gap-3 sm:max-w-md xl:w-auto">
            <StatMini label="Track" value={teacher.track} />
            <StatMini label="Students" value={`${totalStudents}`} />
            <StatMini label="Assignments" value={`${activeAssignments.length}`} />
            <StatMini label="Unread Alerts" value={`${unreadAssignmentBadgeCount}`} />
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-5">
        <div className="xl:col-span-2">
          <div className="rounded-[2rem] border border-emerald-100 bg-white/90 p-6 shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-700">
              New Assignment
            </p>

            <h2 className="mt-2 text-2xl font-bold text-slate-900">
              Publish Task
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-600">
              Add written instructions, upload an image or PDF, attach a manual file URL, and add an optional support link.
            </p>

            <form
              action={createAssignment}
              encType="multipart/form-data"
              className="mt-6 space-y-5"
            >
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
                  placeholder="e.g. Homepage Design Task"
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
                  rows={6}
                  placeholder="Write the full assignment task, instructions, and any important details students should follow..."
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-500"
                />
              </div>

              <div>
                <label
                  htmlFor="uploadFile"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Upload Assignment File <span className="text-slate-400">(Optional)</span>
                </label>
                <input
                  id="uploadFile"
                  name="uploadFile"
                  type="file"
                  accept=".pdf,image/*"
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-500 file:mr-4 file:rounded-md file:border-0 file:bg-emerald-100 file:px-3 file:py-2 file:font-semibold file:text-emerald-700"
                />
                <p className="mt-2 text-xs text-slate-500">
                  Upload an image or PDF directly from your device.
                </p>
              </div>

              <div>
                <label
                  htmlFor="imageUrl"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Attachment URL <span className="text-slate-400">(Optional)</span>
                </label>
                <input
                  id="imageUrl"
                  name="imageUrl"
                  type="url"
                  placeholder="https://example.com/assignment-file.jpg or .pdf"
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-500"
                />
              </div>

              <div>
                <label
                  htmlFor="linkUrl"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Support Link <span className="text-slate-400">(Optional)</span>
                </label>
                <input
                  id="linkUrl"
                  name="linkUrl"
                  type="url"
                  placeholder="https://example.com/reference-link"
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-500"
                />
              </div>

              <div>
                <label
                  htmlFor="linkLabel"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Link Label <span className="text-slate-400">(Optional)</span>
                </label>
                <input
                  id="linkLabel"
                  name="linkLabel"
                  type="text"
                  placeholder="e.g. Figma file, Example site, Starter files"
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-500"
                />
              </div>

              <div>
                <label
                  htmlFor="dueDate"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Due Date <span className="text-slate-400">(Optional)</span>
                </label>
                <input
                  id="dueDate"
                  name="dueDate"
                  type="datetime-local"
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-500"
                />
              </div>

              <button
                type="submit"
                className="inline-flex items-center justify-center rounded-2xl bg-emerald-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-800 active:scale-[0.98]"
              >
                Publish Assignment
              </button>
            </form>
          </div>
        </div>

        <div className="xl:col-span-3">
          <div className="rounded-[2rem] border border-emerald-100 bg-white/90 p-6 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-700">
                  Published Assignments
                </p>
                <h2 className="mt-2 text-2xl font-bold text-slate-900">
                  Assignment History
                </h2>
              </div>

              <span className="rounded-full bg-emerald-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.15em] text-emerald-700">
                {assignments.length} Total
              </span>
            </div>

            <div className="mt-6 space-y-4">
              {assignmentsWithStats.length > 0 ? (
                assignmentsWithStats.map((assignment) => (
                  <article
                    key={assignment.id}
                    className="rounded-[1.75rem] border border-slate-200 bg-slate-50/70 p-5"
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-lg font-bold text-slate-900">
                            {assignment.title}
                          </h3>

                          <span
                            className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                              assignment.isPublished
                                ? "bg-emerald-100 text-emerald-700"
                                : "bg-slate-200 text-slate-700"
                            }`}
                          >
                            {assignment.isPublished ? "Published" : "Unpublished"}
                          </span>

                          {assignment.unreadCount > 0 && assignment.isPublished && (
                            <span className="rounded-full bg-red-100 px-2.5 py-1 text-xs font-semibold text-red-700">
                              {assignment.unreadCount} unread
                            </span>
                          )}

                          {assignment.imageUrl && (
                            <span className="rounded-full bg-sky-100 px-2.5 py-1 text-xs font-semibold text-sky-700">
                              {isPdfFile(assignment.imageUrl) ? "PDF" : isImageFile(assignment.imageUrl) ? "Image" : "Attachment"}
                            </span>
                          )}
                        </div>

                        {assignment.question && (
                          <p className="mt-3 whitespace-pre-line text-sm leading-7 text-slate-600">
                            {assignment.question}
                          </p>
                        )}

                        <div className="mt-4 flex flex-wrap gap-3">
                          <Link
                            href={`/teacher/assignments/${assignment.id}`}
                            className="rounded-xl bg-emerald-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-800"
                          >
                            View Details
                          </Link>

                          <Link
                            href={`/teacher/assignments/${assignment.id}/edit`}
                            className="rounded-xl bg-slate-200 px-4 py-2 text-sm font-semibold text-slate-800 transition hover:bg-slate-300"
                          >
                            Edit
                          </Link>

                          <form action={toggleAssignmentPublish}>
                            <input
                              type="hidden"
                              name="assignmentId"
                              value={assignment.id}
                            />
                            <button
                              type="submit"
                              className="rounded-xl bg-lime-100 px-4 py-2 text-sm font-semibold text-lime-800 transition hover:bg-lime-200"
                            >
                              {assignment.isPublished ? "Unpublish" : "Publish"}
                            </button>
                          </form>

                          <form action={deleteAssignment}>
                            <input
                              type="hidden"
                              name="assignmentId"
                              value={assignment.id}
                            />
                            <button
                              type="submit"
                              className="rounded-xl bg-red-100 px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-200"
                            >
                              Delete
                            </button>
                          </form>
                        </div>
                      </div>

                      <div className="grid shrink-0 gap-2 text-sm lg:min-w-[220px]">
                        <InfoPill
                          label="Track"
                          value={assignment.track}
                          tone="bg-emerald-50 text-emerald-700"
                        />
                        <InfoPill
                          label="Created"
                          value={formatDateTime(assignment.createdAt)}
                          tone="bg-lime-50 text-lime-700"
                        />
                        <InfoPill
                          label="Due"
                          value={
                            assignment.dueDate
                              ? formatDateTime(assignment.dueDate)
                              : "No deadline"
                          }
                          tone="bg-green-50 text-green-700"
                        />
                        <Link
                          href={`/teacher/assignments/${assignment.id}#seen-students`}
                          className="rounded-2xl bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100"
                        >
                          Seen: {assignment.seenCount}/{totalStudents}
                        </Link>
                        <Link
                          href={`/teacher/assignments/${assignment.id}#unread-students`}
                          className="rounded-2xl bg-red-50 px-3 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-100"
                        >
                          Unread: {assignment.unreadCount}
                        </Link>
                      </div>
                    </div>
                  </article>
                ))
              ) : (
                <div className="rounded-[1.75rem] border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
                  <h3 className="text-lg font-bold text-slate-900">
                    No assignments yet
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    You have not published any assignment for this track yet.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

function StatMini({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-white/20 bg-white/15 p-4 backdrop-blur">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-50/85">
        {label}
      </p>
      <p className="mt-2 text-xl font-bold text-white">{value}</p>
    </div>
  );
}

function InfoPill({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: string;
}) {
  return (
    <div className={`rounded-2xl px-3 py-2 ${tone}`}>
      <p className="text-[11px] font-semibold uppercase tracking-[0.15em] opacity-80">
        {label}
      </p>
      <p className="mt-1 text-sm font-semibold">{value}</p>
    </div>
  );
}

function formatDateTime(date: Date) {
  return new Intl.DateTimeFormat("en-NG", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(date));
}