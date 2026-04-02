import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  deleteAssignment,
  toggleAssignmentPublish,
} from "@/app/teacher/assignments/actions";

export const dynamic = "force-dynamic";

const PER_PAGE_OPTIONS = [3, 10, 25, 50, 100];

function buildAssignmentsUrl(params: {
  q?: string;
  track?: string;
  page?: number;
  perPage?: number;
}) {
  const search = new URLSearchParams();

  if (params.q && params.q.trim()) search.set("q", params.q.trim());
  if (params.track && params.track !== "ALL") search.set("track", params.track);
  if (params.page && params.page > 1) search.set("page", String(params.page));
  if (params.perPage) search.set("perPage", String(params.perPage));

  const query = search.toString();
  return query ? `/admin/assignments?${query}` : "/admin/assignments";
}

export default async function AdminAssignmentsPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    track?: string;
    page?: string;
    perPage?: string;
  }>;
}) {
  await requireRole("ADMIN");
  const params = await searchParams;

  const q = params.q?.trim() ?? "";
  const track = params.track ?? "ALL";

  const rawPage = Number(params.page ?? "1");
  const rawPerPage = Number(params.perPage ?? "3");

  const perPage = PER_PAGE_OPTIONS.includes(rawPerPage) ? rawPerPage : 3;
  const page = Number.isFinite(rawPage) && rawPage > 0 ? rawPage : 1;

  const whereClause = {
    AND: [
      track !== "ALL" ? { track } : {},
      q
        ? {
            OR: [
              {
                title: {
                  contains: q,
                  mode: "insensitive" as const,
                },
              },
              {
                question: {
                  contains: q,
                  mode: "insensitive" as const,
                },
              },
              {
                teacher: {
                  user: {
                    name: {
                      contains: q,
                      mode: "insensitive" as const,
                    },
                  },
                },
              },
            ],
          }
        : {},
    ],
  };

  const totalFilteredAssignments = await db.assignment.count({
    where: whereClause,
  });

  const totalPages = Math.max(1, Math.ceil(totalFilteredAssignments / perPage));
  const currentPage = Math.min(page, totalPages);
  const skip = (currentPage - 1) * perPage;

  const assignments = await db.assignment.findMany({
    where: whereClause,
    include: {
      teacher: {
        include: {
          user: true,
        },
      },
      views: true,
    },
    orderBy: {
      createdAt: "desc",
    },
    skip,
    take: perPage,
  });

  const trackRows = await db.student.findMany({
    select: {
      track: true,
    },
    distinct: ["track"],
  });

  const trackOptions = trackRows.map((row) => row.track).sort();

  const studentCountsByTrackRows = await db.student.groupBy({
    by: ["track"],
    _count: {
      _all: true,
    },
  });

  const studentCountMap = new Map(
    studentCountsByTrackRows.map((row) => [row.track, row._count._all])
  );

  const enrichedAssignments = assignments.map((assignment) => {
    const totalStudentsInTrack = studentCountMap.get(assignment.track) ?? 0;
    const seenCount = assignment.views.filter((view) => view.seenAt !== null).length;
    const unreadCount = Math.max(totalStudentsInTrack - seenCount, 0);

    return {
      ...assignment,
      totalStudentsInTrack,
      seenCount,
      unreadCount,
    };
  });

  const totalAssignments = await db.assignment.count();
  const filteredAssignments = totalFilteredAssignments;

  const allFilteredAssignments = await db.assignment.findMany({
    where: whereClause,
    include: {
      views: true,
    },
  });

  const totalViewedRecords = allFilteredAssignments.reduce(
    (sum, assignment) =>
      sum + assignment.views.filter((view) => view.seenAt !== null).length,
    0
  );

  const totalUnreadRecords = allFilteredAssignments.reduce((sum, assignment) => {
    const totalStudentsInTrack = studentCountMap.get(assignment.track) ?? 0;
    const seenCount = assignment.views.filter((view) => view.seenAt !== null).length;
    return sum + Math.max(totalStudentsInTrack - seenCount, 0);
  }, 0);

  const publishedAssignments = allFilteredAssignments.filter(
    (assignment) => assignment.isPublished
  ).length;

  const unpublishedAssignments = allFilteredAssignments.filter(
    (assignment) => !assignment.isPublished
  ).length;

  const hasPreviousPage = currentPage > 1;
  const hasNextPage = currentPage < totalPages;

  return (
    <main className="space-y-4">
      <section className="overflow-hidden border border-emerald-200 bg-gradient-to-r from-emerald-950 via-emerald-700 to-lime-500 px-4 py-4 text-white shadow-[0_18px_45px_-22px_rgba(16,185,129,0.55)] sm:px-5">
        <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-emerald-100/90">
          Assignments
        </p>

        <h1 className="mt-1.5 text-xl font-bold sm:text-2xl">
          Monitor Assignments
        </h1>

        <p className="mt-2 text-xs text-emerald-50/90 sm:text-sm">
          Monitor assignment activity and reading records from one central workspace.
        </p>
      </section>

      <section className="grid grid-cols-2 gap-2.5 xl:grid-cols-4">
        <StatCard
          label="Total Assignments"
          value={totalAssignments}
          note="All assignments"
          soft="from-emerald-50 to-white"
          border="border-emerald-100"
          line="from-emerald-600 to-green-500"
          valueColor="text-emerald-800"
        />
        <StatCard
          label="Filtered Result"
          value={filteredAssignments}
          note="Current filtered view"
          soft="from-lime-50 to-white"
          border="border-lime-100"
          line="from-lime-500 to-emerald-500"
          valueColor="text-lime-800"
        />
        <StatCard
          label="Viewed Records"
          value={totalViewedRecords}
          note="Students who opened"
          soft="from-green-50 to-white"
          border="border-green-100"
          line="from-green-600 to-emerald-600"
          valueColor="text-green-800"
        />
        <StatCard
          label="Unread Records"
          value={totalUnreadRecords}
          note="Students yet to open"
          soft="from-red-50 to-white"
          border="border-red-100"
          line="from-red-500 to-rose-500"
          valueColor="text-red-700"
        />
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <section className="border border-emerald-100 bg-white p-4 shadow-sm">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-emerald-700">
              Assignment Overview
            </p>
            <h2 className="mt-1 text-lg font-bold text-slate-900">
              Activity Summary
            </h2>
          </div>

          <p className="mt-1.5 text-xs text-slate-600 sm:text-sm">
            Admin-level monitoring across teachers and tracks.
          </p>

          <div className="mt-4 grid grid-cols-2 gap-2.5">
            <MiniCard
              label="Published"
              value={publishedAssignments}
              soft="from-emerald-50 to-white border-emerald-100"
              valueClass="text-emerald-700"
            />
            <MiniCard
              label="Unpublished"
              value={unpublishedAssignments}
              soft="from-slate-50 to-white border-slate-200"
              valueClass="text-slate-800"
            />
            <MiniCard
              label="Seen Records"
              value={totalViewedRecords}
              soft="from-lime-50 to-white border-lime-100"
              valueClass="text-lime-700"
            />
            <MiniCard
              label="Unread Records"
              value={totalUnreadRecords}
              soft="from-red-50 to-white border-red-100"
              valueClass="text-red-700"
            />
          </div>
        </section>

        <section className="border border-emerald-100 bg-white p-4 shadow-sm">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-emerald-700">
              Search & Filters
            </p>
            <h2 className="mt-1 text-lg font-bold text-slate-900">
              Filter Assignments
            </h2>
          </div>

          <p className="mt-1.5 text-xs text-slate-600 sm:text-sm">
            Search by title, question, or teacher and filter by track.
          </p>

          <form className="mt-4 grid gap-3">
            <input
              name="q"
              type="text"
              defaultValue={q}
              placeholder="Search title, question, or teacher"
              className="border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-green-600"
            />

            <select
              name="track"
              defaultValue={track}
              className="border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-green-600"
            >
              <option value="ALL">All Tracks</option>
              {trackOptions.map((trackOption) => (
                <option key={trackOption} value={trackOption}>
                  {trackOption}
                </option>
              ))}
            </select>

            <input type="hidden" name="perPage" value={perPage} />

            <div className="grid grid-cols-2 gap-2">
              <button
                type="submit"
                className="bg-green-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-green-800"
              >
                Apply
              </button>

              <a
                href="/admin/assignments"
                className="bg-slate-200 px-4 py-2.5 text-center text-sm font-semibold text-slate-800 transition hover:bg-slate-300"
              >
                Reset
              </a>
            </div>
          </form>
        </section>
      </section>

      <section className="space-y-2.5">
        {enrichedAssignments.length > 0 ? (
          enrichedAssignments.map((assignment) => (
            <article
              key={assignment.id}
              className="border border-emerald-100 bg-white p-3 shadow-sm"
            >
              <div className="flex flex-col gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-sm font-bold text-slate-900 sm:text-base">
                      {assignment.title}
                    </h3>

                    <span
                      className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] ${
                        assignment.isPublished
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-slate-200 text-slate-700"
                      }`}
                    >
                      {assignment.isPublished ? "Published" : "Unpublished"}
                    </span>
                  </div>

                  <div className="mt-2 grid grid-cols-2 gap-1.5 text-[11px] text-slate-600 sm:text-xs">
                    <p>
                      <span className="font-semibold text-slate-700">Teacher:</span>{" "}
                      {assignment.teacher.user.name}
                    </p>
                    <p>
                      <span className="font-semibold text-slate-700">Track:</span>{" "}
                      {assignment.track}
                    </p>
                    <p>
                      <span className="font-semibold text-slate-700">Created:</span>{" "}
                      {formatDateTime(assignment.createdAt)}
                    </p>
                    <p>
                      <span className="font-semibold text-slate-700">Due:</span>{" "}
                      {assignment.dueDate
                        ? formatDateTime(assignment.dueDate)
                        : "No deadline"}
                    </p>
                  </div>

                  {assignment.question && (
                    <div className="mt-3 border border-slate-200 bg-slate-50 p-3">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                        Assignment Content
                      </p>
                      <p className="mt-1.5 whitespace-pre-line text-[11px] leading-5 text-slate-700 sm:text-xs">
                        {assignment.question}
                      </p>
                    </div>
                  )}

                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <Link
                      href={`/admin/assignments/${assignment.id}#seen-students`}
                      className="border border-emerald-100 bg-emerald-50 px-3 py-2 text-center text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100"
                    >
                      Seen: {assignment.seenCount}/{assignment.totalStudentsInTrack}
                    </Link>

                    <Link
                      href={`/admin/assignments/${assignment.id}#unread-students`}
                      className="border border-red-100 bg-red-50 px-3 py-2 text-center text-xs font-semibold text-red-700 transition hover:bg-red-100"
                    >
                      Unread: {assignment.unreadCount}
                    </Link>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    <Link
                      href={`/admin/assignments/${assignment.id}`}
                      className="bg-emerald-700 px-3 py-2 text-xs font-semibold text-white transition hover:bg-emerald-800"
                    >
                      View Details
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
          <div className="border border-emerald-100 bg-white p-4 shadow-sm">
            <p className="text-sm text-slate-600">
              No assignments matched your current filters.
            </p>
          </div>
        )}
      </section>

      <section className="border border-emerald-100 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {hasPreviousPage ? (
              <a
                href={buildAssignmentsUrl({
                  q,
                  track,
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
                  q,
                  track,
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
            <input type="hidden" name="q" value={q} />
            <input type="hidden" name="track" value={track} />
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
          Total results: {filteredAssignments} • Page {currentPage} of {totalPages}
        </p>
      </section>
    </main>
  );
}

function StatCard({
  label,
  value,
  note,
  soft,
  border,
  line,
  valueColor,
}: {
  label: string;
  value: string | number;
  note: string;
  soft: string;
  border: string;
  line: string;
  valueColor: string;
}) {
  return (
    <div
      className={`border bg-gradient-to-br ${soft} ${border} p-3 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md`}
    >
      <div className={`h-1.5 w-16 bg-gradient-to-r ${line}`} />
      <p className="mt-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500 sm:text-[11px]">
        {label}
      </p>
      <h2 className={`mt-1.5 text-lg font-bold sm:text-xl ${valueColor}`}>
        {value}
      </h2>
      <p className="mt-1.5 text-[11px] leading-5 text-slate-600 sm:text-xs">
        {note}
      </p>
    </div>
  );
}

function MiniCard({
  label,
  value,
  soft = "from-slate-50 to-white border-slate-200",
  valueClass = "text-slate-900",
}: {
  label: string;
  value: string | number;
  soft?: string;
  valueClass?: string;
}) {
  return (
    <div className={`border bg-gradient-to-br ${soft} p-2.5`}>
      <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-slate-500">
        {label}
      </p>
      <p className={`mt-1 text-sm font-bold sm:text-base ${valueClass}`}>
        {value}
      </p>
    </div>
  );
}

function formatDateTime(date: Date) {
  return new Intl.DateTimeFormat("en-NG", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(date));
}