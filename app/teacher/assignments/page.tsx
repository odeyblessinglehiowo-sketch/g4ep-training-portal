import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  createAssignment,
  deleteAssignment,
  toggleAssignmentPublish,
} from "./actions";

export const dynamic = "force-dynamic";

const PER_PAGE_OPTIONS = [2, 10, 25, 50, 100];

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

function buildAssignmentsUrl(params: {
  page?: number;
  perPage?: number;
}) {
  const search = new URLSearchParams();

  if (params.page && params.page > 1) {
    search.set("page", String(params.page));
  }

  if (params.perPage) {
    search.set("perPage", String(params.perPage));
  }

  const query = search.toString();
  return query ? `/teacher/assignments?${query}` : "/teacher/assignments";
}

export default async function TeacherAssignmentsPage({
  searchParams,
}: {
  searchParams?: Promise<{
    page?: string;
    perPage?: string;
  }>;
}) {
  const currentUser = await requireRole("TEACHER");
  const params = (await searchParams) ?? {};

  const rawPage = Number(params.page ?? "1");
  const rawPerPage = Number(params.perPage ?? "2");

  const perPage = PER_PAGE_OPTIONS.includes(rawPerPage) ? rawPerPage : 2;
  const page = Number.isFinite(rawPage) && rawPage > 0 ? rawPage : 1;

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

  const totalAssignmentsCount = await db.assignment.count({
    where: {
      teacherId: teacher.id,
      track: teacher.track,
    },
  });

  const totalPages = Math.max(1, Math.ceil(totalAssignmentsCount / perPage));
  const currentPage = Math.min(page, totalPages);
  const skip = (currentPage - 1) * perPage;

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
    skip,
    take: perPage,
  });

  const allAssignments = await db.assignment.findMany({
    where: {
      teacherId: teacher.id,
      track: teacher.track,
    },
    include: {
      views: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const activeAssignments = allAssignments.filter(
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

  const unreadAssignmentBadgeCount = allAssignments
    .map((assignment) => {
      const seenCount = assignment.views.filter((view) => view.seenAt !== null).length;
      const unreadCount = Math.max(totalStudents - seenCount, 0);

      return {
        ...assignment,
        unreadCount,
      };
    })
    .filter((assignment) => assignment.unreadCount > 0 && assignment.isPublished).length;

  const hasPreviousPage = currentPage > 1;
  const hasNextPage = currentPage < totalPages;

  return (
    <main className="space-y-4">
      <section className="overflow-hidden border border-emerald-200 bg-gradient-to-r from-emerald-950 via-emerald-700 to-lime-500 px-4 py-2.5 text-white shadow-[0_18px_45px_-22px_rgba(16,185,129,0.55)] sm:px-5">
        <div className="grid gap-2.5 lg:grid-cols-[1.6fr_0.95fr] lg:items-start">
          <div className="max-w-3xl">
            <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-emerald-100/90">
              Assignment Management
            </p>

            <h1 className="mt-0.5 text-lg font-bold leading-tight sm:text-xl">
              Create and Manage Assignments
            </h1>

            <p className="mt-1 text-[11px] leading-4 text-emerald-50/90 sm:text-xs">
              Publish tasks, attach files or links, and monitor student engagement from one central workspace.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <HeroStatCard label="Track" value={teacher.track} />
            <HeroStatCard label="Students" value={`${totalStudents}`} />
            <HeroStatCard label="Assignments" value={`${activeAssignments.length}`} />
            <HeroStatCard label="Unread Alerts" value={`${unreadAssignmentBadgeCount}`} />
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
        <section className="border border-emerald-100 bg-white p-4 shadow-sm">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-emerald-700">
              New Assignment
            </p>

            <h2 className="mt-1 text-lg font-bold text-slate-900">
              Publish Task
            </h2>
          </div>

          <p className="mt-1.5 text-xs text-slate-600 sm:text-sm">
            Add written instructions, upload a file, attach a manual URL, and include a support link if needed.
          </p>

          <form
            action={createAssignment}
            encType="multipart/form-data"
            className="mt-4 grid gap-3"
          >
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
                placeholder="e.g. Homepage Design Task"
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
                rows={5}
                placeholder="Write the assignment task, instructions, and important notes..."
                className="w-full border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-emerald-500"
              />
            </div>

            <div>
              <label
                htmlFor="uploadFile"
                className="mb-2 block text-xs font-semibold uppercase tracking-[0.12em] text-slate-600 sm:text-sm"
              >
                Upload Assignment File <span className="text-slate-400">(Optional)</span>
              </label>
              <input
                id="uploadFile"
                name="uploadFile"
                type="file"
                accept=".pdf,image/*"
                className="w-full border border-slate-300 px-3 py-2.5 text-sm outline-none transition file:mr-4 file:border-0 file:bg-emerald-100 file:px-3 file:py-2 file:font-semibold file:text-emerald-700 hover:file:bg-emerald-200"
              />
              <p className="mt-2 text-[11px] text-slate-500 sm:text-xs">
                Upload an image or PDF directly from your device.
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
                placeholder="https://example.com/assignment-file.jpg or .pdf"
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
                placeholder="https://example.com/reference-link"
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
                placeholder="e.g. Figma file, Example site, Starter files"
                className="w-full border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-emerald-500"
              />
            </div>

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
                className="w-full border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-emerald-500"
              />
            </div>

            <button
              type="submit"
              className="inline-flex w-fit items-center justify-center bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-800 active:scale-[0.98]"
            >
              Publish Assignment
            </button>
          </form>
        </section>

        <section className="border border-emerald-100 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-emerald-700">
                Published Assignments
              </p>
              <h2 className="mt-1 text-lg font-bold text-slate-900">
                Assignment History
              </h2>
            </div>

            <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-emerald-700">
              {totalAssignmentsCount} Total
            </span>
          </div>

          <div className="mt-4 space-y-3">
            {assignmentsWithStats.length > 0 ? (
              assignmentsWithStats.map((assignment) => (
                <article
                  key={assignment.id}
                  className="border border-slate-200 bg-slate-50/70 p-4"
                >
                  <div className="flex flex-col gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-base font-bold text-slate-900">
                          {assignment.title}
                        </h3>

                        <span
                          className={`px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] ${
                            assignment.isPublished
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-slate-200 text-slate-700"
                          }`}
                        >
                          {assignment.isPublished ? "Published" : "Unpublished"}
                        </span>

                        {assignment.attachmentUrl && (
                          <span className="bg-sky-100 px-2.5 py-1 text-[10px] font-semibold text-sky-700">
                            {isPdfFile(assignment.attachmentUrl)
                              ? "PDF"
                              : isImageFile(assignment.attachmentUrl)
                              ? "Image"
                              : "Attachment"}
                          </span>
                        )}
                      </div>

                      {assignment.question && (
                        <p className="mt-2 whitespace-pre-line text-[11px] leading-5 text-slate-600 sm:text-sm sm:leading-6">
                          {assignment.question}
                        </p>
                      )}

                      <div className="mt-3 grid grid-cols-2 gap-2 text-[11px] text-slate-600 sm:text-xs">
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
                        <InfoPill
                          label="Status"
                          value={assignment.isPublished ? "Published" : "Unpublished"}
                          tone={
                            assignment.isPublished
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-slate-100 text-slate-700"
                          }
                        />
                      </div>

                      <div className="mt-3 grid grid-cols-2 gap-2">
                        <Link
                          href={`/teacher/assignments/${assignment.id}#seen-students`}
                          className="border border-emerald-100 bg-emerald-50 px-3 py-2 text-center text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100"
                        >
                          Seen: {assignment.seenCount}/{totalStudents}
                        </Link>

                        <Link
                          href={`/teacher/assignments/${assignment.id}#unread-students`}
                          className="border border-red-100 bg-red-50 px-3 py-2 text-center text-xs font-semibold text-red-700 transition hover:bg-red-100"
                        >
                          Unread: {assignment.unreadCount}
                        </Link>
                      </div>

                      <div className="mt-3 flex flex-wrap gap-2">
                        <Link
                          href={`/teacher/assignments/${assignment.id}`}
                          className="bg-emerald-700 px-3 py-2 text-xs font-semibold text-white transition hover:bg-emerald-800"
                        >
                          View Details
                        </Link>

                        <Link
                          href={`/teacher/assignments/${assignment.id}/edit`}
                          className="bg-slate-200 px-3 py-2 text-xs font-semibold text-slate-800 transition hover:bg-slate-300"
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
                            className="bg-lime-100 px-3 py-2 text-xs font-semibold text-lime-800 transition hover:bg-lime-200"
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
                            className="bg-red-100 px-3 py-2 text-xs font-semibold text-red-700 transition hover:bg-red-200"
                          >
                            Delete
                          </button>
                        </form>
                      </div>
                    </div>
                  </div>
                </article>
              ))
            ) : (
              <div className="border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
                <h3 className="text-base font-bold text-slate-900">
                  No assignments yet
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  You have not published any assignment for this track yet.
                </p>
              </div>
            )}
          </div>

          <div className="mt-4 border border-emerald-100 bg-white p-4 shadow-sm">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                {hasPreviousPage ? (
                  <a
                    href={buildAssignmentsUrl({
                      page: currentPage - 1,
                      perPage,
                    })}
                    className="border border-emerald-200 bg-white px-4 py-2.5 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-50"
                  >
                    ← Prev
                  </a>
                ) : (
                  <span className="border border-slate-200 bg-slate-100 px-4 py-2.5 text-sm font-semibold text-slate-400">
                    ← Prev
                  </span>
                )}

                {hasNextPage ? (
                  <a
                    href={buildAssignmentsUrl({
                      page: currentPage + 1,
                      perPage,
                    })}
                    className="border border-emerald-200 bg-white px-4 py-2.5 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-50"
                  >
                    Next →
                  </a>
                ) : (
                  <span className="border border-slate-200 bg-slate-100 px-4 py-2.5 text-sm font-semibold text-slate-400">
                    Next →
                  </span>
                )}

                <p className="text-sm font-semibold text-slate-900">
                  Page: <span className="ml-1">{currentPage}</span>
                </p>
              </div>

              <form className="flex flex-wrap items-center gap-2 sm:gap-3">
                <input type="hidden" name="page" value="1" />

                <label
                  htmlFor="perPage"
                  className="text-sm font-semibold text-slate-900"
                >
                  Per page:
                </label>

                <select
                  id="perPage"
                  name="perPage"
                  defaultValue={String(perPage)}
                  className="border border-emerald-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-900 outline-none transition focus:border-emerald-500"
                >
                  {PER_PAGE_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>

                <button
                  type="submit"
                  className="bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-800"
                >
                  Apply
                </button>
              </form>
            </div>

            <p className="mt-3 text-sm font-semibold text-slate-800">
              Total results: {totalAssignmentsCount} • Page {currentPage} of {totalPages}
            </p>
          </div>
        </section>
      </section>
    </main>
  );
}

function HeroStatCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="border border-white/20 bg-white/10 px-3 py-1.5 backdrop-blur">
      <p className="text-[9px] font-semibold uppercase tracking-[0.1em] text-emerald-50/80">
        {label}
      </p>
      <p className="mt-0.5 text-sm font-bold text-white sm:text-base">
        {value}
      </p>
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
    <div className={`px-3 py-2 ${tone}`}>
      <p className="text-[9px] font-semibold uppercase tracking-[0.12em] opacity-80">
        {label}
      </p>
      <p className="mt-1 text-[11px] font-semibold sm:text-xs">{value}</p>
    </div>
  );
}

function formatDateTime(date: Date) {
  return new Intl.DateTimeFormat("en-NG", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(date));
}