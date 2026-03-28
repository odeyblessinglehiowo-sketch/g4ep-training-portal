import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  deleteAssignment,
  toggleAssignmentPublish,
} from "@/app/teacher/assignments/actions";

export const dynamic = "force-dynamic";

export default async function AdminAssignmentsPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    track?: string;
  }>;
}) {
  await requireRole("ADMIN");
  const params = await searchParams;

  const q = params.q?.trim() ?? "";
  const track = params.track ?? "ALL";

  const assignments = await db.assignment.findMany({
    where: {
      AND: [
        track !== "ALL" ? { track } : {},
        q
          ? {
              OR: [
                {
                  title: {
                    contains: q,
                    mode: "insensitive",
                  },
                },
                {
                  question: {
                    contains: q,
                    mode: "insensitive",
                  },
                },
                {
                  teacher: {
                    user: {
                      name: {
                        contains: q,
                        mode: "insensitive",
                      },
                    },
                  },
                },
              ],
            }
          : {},
      ],
    },
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
  const filteredAssignments = enrichedAssignments.length;
  const totalViewedRecords = enrichedAssignments.reduce(
    (sum, assignment) => sum + assignment.seenCount,
    0
  );
  const totalUnreadRecords = enrichedAssignments.reduce(
    (sum, assignment) => sum + assignment.unreadCount,
    0
  );

  return (
    <main className="space-y-6">
      <section className="overflow-hidden rounded-[2rem] bg-gradient-to-r from-emerald-900 via-green-700 to-lime-500 p-6 text-white shadow-lg shadow-emerald-200/50 sm:p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-50/90">
          Assignments
        </p>

        <h1 className="mt-3 text-3xl font-bold sm:text-4xl">
          Monitor Assignments
        </h1>

        <p className="mt-4 max-w-3xl text-sm leading-7 text-emerald-50/90 sm:text-base">
          Monitor assignment activity across all tracks, review status, and see
          which students have read each assignment.
        </p>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Assignments" value={totalAssignments} />
        <StatCard
          label="Filtered Result"
          value={filteredAssignments}
          tone="bg-emerald-50"
          valueClass="text-emerald-700"
        />
        <StatCard
          label="Viewed Records"
          value={totalViewedRecords}
          tone="bg-lime-50"
          valueClass="text-lime-700"
        />
        <StatCard
          label="Unread Records"
          value={totalUnreadRecords}
          tone="bg-red-50"
          valueClass="text-red-700"
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <section className="rounded-[1.75rem] border border-emerald-100 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900">Assignment Overview</h2>
          <p className="mt-1 text-sm text-slate-600">
            Admin-level monitoring across teachers and tracks.
          </p>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <MiniCard
              label="Published Assignments"
              value={enrichedAssignments.filter((a) => a.isPublished).length}
              soft="bg-emerald-50 ring-emerald-100"
              valueClass="text-emerald-700"
            />
            <MiniCard
              label="Unpublished Assignments"
              value={enrichedAssignments.filter((a) => !a.isPublished).length}
              soft="bg-slate-50 ring-slate-200"
              valueClass="text-slate-800"
            />
            <MiniCard
              label="Seen Assignment Records"
              value={totalViewedRecords}
              soft="bg-lime-50 ring-lime-100"
              valueClass="text-lime-700"
            />
            <MiniCard
              label="Unread Assignment Records"
              value={totalUnreadRecords}
              soft="bg-red-50 ring-red-100"
              valueClass="text-red-700"
            />
          </div>
        </section>

        <section className="rounded-[1.75rem] border border-emerald-100 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900">Search & Filters</h2>
          <p className="mt-1 text-sm text-slate-600">
            Search by title, question, or teacher and filter by track.
          </p>

          <form className="mt-6 grid gap-4">
            <input
              name="q"
              type="text"
              defaultValue={q}
              placeholder="Search title, question, or teacher"
              className="rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-green-600"
            />

            <select
              name="track"
              defaultValue={track}
              className="rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-green-600"
            >
              <option value="ALL">All Tracks</option>
              {trackOptions.map((trackOption) => (
                <option key={trackOption} value={trackOption}>
                  {trackOption}
                </option>
              ))}
            </select>

            <div className="flex gap-3">
              <button
                type="submit"
                className="flex-1 rounded-xl bg-green-700 px-5 py-3 font-semibold text-white hover:bg-green-800"
              >
                Apply
              </button>

              <a
                href="/admin/assignments"
                className="flex-1 rounded-xl bg-slate-200 px-5 py-3 text-center font-semibold text-slate-800 hover:bg-slate-300"
              >
                Reset
              </a>
            </div>
          </form>
        </section>
      </section>

      <section className="grid gap-6">
        {enrichedAssignments.length > 0 ? (
          enrichedAssignments.map((assignment) => (
            <article
              key={assignment.id}
              className="rounded-[1.75rem] border border-emerald-100 bg-white p-6 shadow-sm"
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-xl font-bold text-slate-900">
                      {assignment.title}
                    </h3>

                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        assignment.isPublished
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-slate-200 text-slate-700"
                      }`}
                    >
                      {assignment.isPublished ? "Published" : "Unpublished"}
                    </span>

                    {assignment.unreadCount > 0 && assignment.isPublished && (
                      <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700">
                        {assignment.unreadCount} unread
                      </span>
                    )}
                  </div>

                  <div className="mt-3 grid gap-2 text-sm text-slate-600 sm:grid-cols-2">
                    <p>Teacher: {assignment.teacher.user.name}</p>
                    <p>Track: {assignment.track}</p>
                    <p>Created: {formatDateTime(assignment.createdAt)}</p>
                    <p>
                      Due Date:{" "}
                      {assignment.dueDate
                        ? formatDateTime(assignment.dueDate)
                        : "No deadline"}
                    </p>
                  </div>

                  {assignment.question && (
                    <div className="mt-5 rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
                      <p className="text-sm font-medium text-slate-500">
                        Assignment Question
                      </p>
                      <p className="mt-2 whitespace-pre-line text-sm leading-7 text-slate-700">
                        {assignment.question}
                      </p>
                    </div>
                  )}

                  <div className="mt-5 flex flex-wrap gap-3">
                    <Link
                      href={`/admin/assignments/${assignment.id}`}
                      className="rounded-xl bg-emerald-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-800"
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
                  <Link
                    href={`/admin/assignments/${assignment.id}#seen-students`}
                    className="rounded-2xl bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100"
                  >
                    Seen: {assignment.seenCount}/{assignment.totalStudentsInTrack}
                  </Link>
                  <Link
                    href={`/admin/assignments/${assignment.id}#unread-students`}
                    className="rounded-2xl bg-red-50 px-3 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-100"
                  >
                    Unread: {assignment.unreadCount}
                  </Link>
                </div>
              </div>
            </article>
          ))
        ) : (
          <div className="rounded-[1.75rem] border border-emerald-100 bg-white p-6 shadow-sm">
            <p className="text-sm text-slate-600">
              No assignments matched your current filters.
            </p>
          </div>
        )}
      </section>
    </main>
  );
}

function StatCard({
  label,
  value,
  tone = "bg-white",
  valueClass = "text-slate-900",
}: {
  label: string;
  value: string | number;
  tone?: string;
  valueClass?: string;
}) {
  return (
    <div className={`rounded-[1.5rem] p-5 shadow-sm ring-1 ring-slate-200 ${tone}`}>
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className={`mt-2 text-3xl font-bold ${valueClass}`}>{value}</p>
    </div>
  );
}

function MiniCard({
  label,
  value,
  soft = "bg-slate-50 ring-slate-200",
  valueClass = "text-slate-900",
}: {
  label: string;
  value: string | number;
  soft?: string;
  valueClass?: string;
}) {
  return (
    <div className={`rounded-2xl p-4 ring-1 ${soft}`}>
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className={`mt-2 text-xl font-bold ${valueClass}`}>{value}</p>
    </div>
  );
}

function formatDateTime(date: Date) {
  return new Intl.DateTimeFormat("en-NG", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(date));
}