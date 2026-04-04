import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { updateSubmissionStatus } from "@/app/admin/submissions/actions";

export const dynamic = "force-dynamic";

const PER_PAGE_OPTIONS = [2, 10, 25, 50, 100];

function buildTeacherSubmissionsUrl(params: {
  status?: string;
  page?: number;
  perPage?: number;
}) {
  const search = new URLSearchParams();

  if (params.status && params.status !== "ALL") {
    search.set("status", params.status);
  }

  if (params.page && params.page > 1) {
    search.set("page", String(params.page));
  }

  if (params.perPage) {
    search.set("perPage", String(params.perPage));
  }

  const query = search.toString();
  return query ? `/teacher/submissions?${query}` : "/teacher/submissions";
}

export default async function TeacherSubmissionsPage({
  searchParams,
}: {
  searchParams?: Promise<{
    status?: string;
    page?: string;
    perPage?: string;
  }>;
}) {
  const currentUser = await requireRole("TEACHER");
  const params = (await searchParams) ?? {};

  const status = params.status ?? "ALL";

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

  if (!teacherUser || !teacherUser.teacher) {
    throw new Error("Teacher profile not found.");
  }

  const teacher = teacherUser.teacher;

  await db.submission.updateMany({
    where: {
      student: {
        track: teacher.track,
      },
      teacherNotifiedAt: null,
    },
    data: {
      teacherNotifiedAt: new Date(),
    },
  });

  const whereClause = {
    AND: [
      {
        student: {
          track: teacher.track,
        },
      },
      status !== "ALL"
        ? {
            status: status as "PENDING" | "APPROVED" | "REJECTED",
          }
        : {},
    ],
  };

  const totalFilteredSubmissions = await db.submission.count({
    where: whereClause,
  });

  const totalPages = Math.max(1, Math.ceil(totalFilteredSubmissions / perPage));
  const currentPage = Math.min(page, totalPages);
  const skip = (currentPage - 1) * perPage;

  const submissions = await db.submission.findMany({
    where: whereClause,
    orderBy: {
      createdAt: "desc",
    },
    skip,
    take: perPage,
    include: {
      student: {
        include: {
          user: true,
        },
      },
      assignment: true,
    },
  });

  const allTrackSubmissions = await db.submission.findMany({
    where: {
      student: {
        track: teacher.track,
      },
    },
  });

  const totalSubmissions = allTrackSubmissions.length;
  const pendingSubmissions = allTrackSubmissions.filter(
    (submission) => submission.status === "PENDING"
  ).length;
  const approvedSubmissions = allTrackSubmissions.filter(
    (submission) => submission.status === "APPROVED"
  ).length;
  const rejectedSubmissions = allTrackSubmissions.filter(
    (submission) => submission.status === "REJECTED"
  ).length;

  const hasPreviousPage = currentPage > 1;
  const hasNextPage = currentPage < totalPages;

  return (
    <main className="space-y-4">
      <section className="overflow-hidden border border-emerald-200 bg-gradient-to-r from-emerald-950 via-emerald-700 to-lime-500 px-4 py-3 text-white shadow-[0_18px_45px_-22px_rgba(16,185,129,0.55)] sm:px-5">
        <div className="max-w-3xl">
          <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-emerald-100/90">
            Submissions
          </p>

          <h1 className="mt-0.5 text-lg font-bold leading-tight sm:text-xl">
            Track Submissions
          </h1>

          <p className="mt-1 text-[11px] leading-4 text-emerald-50/90 sm:text-xs">
            Review submissions for your assigned teaching track from one central workspace.
          </p>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-2.5 xl:grid-cols-4">
        <StatCard
          label="Total Submissions"
          value={totalSubmissions}
          note="All track submissions"
          soft="from-emerald-50 to-white"
          border="border-emerald-100"
          line="from-emerald-600 to-green-500"
          valueColor="text-emerald-800"
        />
        <StatCard
          label="Pending"
          value={pendingSubmissions}
          note="Awaiting review"
          soft="from-yellow-50 to-white"
          border="border-yellow-100"
          line="from-yellow-500 to-amber-500"
          valueColor="text-yellow-700"
        />
        <StatCard
          label="Approved"
          value={approvedSubmissions}
          note="Accepted submissions"
          soft="from-green-50 to-white"
          border="border-green-100"
          line="from-green-600 to-emerald-600"
          valueColor="text-green-700"
        />
        <StatCard
          label="Rejected"
          value={rejectedSubmissions}
          note="Needs correction"
          soft="from-red-50 to-white"
          border="border-red-100"
          line="from-red-500 to-rose-500"
          valueColor="text-red-600"
        />
      </section>

      <section className="border border-emerald-100 bg-white p-4 shadow-sm">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-emerald-700">
            Search & Filters
          </p>
          <h2 className="mt-1 text-lg font-bold text-slate-900">
            Filter Submissions
          </h2>
        </div>

        <p className="mt-1.5 text-xs text-slate-600 sm:text-sm">
          Filter submissions by review status.
        </p>

        <form className="mt-4 grid gap-3 md:grid-cols-2">
          <select
            name="status"
            defaultValue={status}
            className="border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-green-600"
          >
            <option value="ALL">All Statuses</option>
            <option value="PENDING">Pending</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
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
              href="/teacher/submissions"
              className="bg-slate-200 px-4 py-2.5 text-center text-sm font-semibold text-slate-800 transition hover:bg-slate-300"
            >
              Reset
            </a>
          </div>
        </form>
      </section>

      <section className="space-y-3">
        {submissions.length > 0 ? (
          submissions.map((submission) => (
            <article
              key={submission.id}
              className="border border-emerald-100 bg-white p-4 shadow-sm transition hover:shadow-md"
            >
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-base font-bold text-slate-900 sm:text-lg">
                      {submission.title}
                    </h3>

                    <span
                      className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] ${
                        submission.status === "APPROVED"
                          ? "bg-green-100 text-green-700"
                          : submission.status === "REJECTED"
                          ? "bg-red-100 text-red-700"
                          : "bg-yellow-100 text-yellow-700"
                      }`}
                    >
                      {submission.status}
                    </span>
                  </div>

                  {submission.assignment && (
                    <p className="mt-2 text-xs font-medium text-emerald-700 sm:text-sm">
                      Assignment: {submission.assignment.title}
                    </p>
                  )}

                  <div className="mt-3 grid gap-1.5 text-[11px] text-slate-600 sm:grid-cols-2 sm:text-xs">
                    <p>
                      <span className="font-semibold text-slate-700">Student:</span>{" "}
                      {submission.student.user.name}
                    </p>
                    <p>
                      <span className="font-semibold text-slate-700">Track:</span>{" "}
                      {submission.student.track}
                    </p>
                    <p>
                      <span className="font-semibold text-slate-700">Submitted:</span>{" "}
                      {new Date(submission.createdAt).toLocaleDateString()}
                    </p>
                    <p className="break-all">
                      <span className="font-semibold text-slate-700">Email:</span>{" "}
                      {submission.student.user.email}
                    </p>
                  </div>
                </div>

                <a
                  href={submission.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-slate-900 px-3 py-2 text-xs font-semibold text-white transition hover:bg-slate-800 sm:px-4 sm:text-sm"
                >
                  View Submission
                </a>
              </div>

              {submission.remark && (
                <div className="mt-4 border border-slate-200 bg-slate-50 p-3">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500 sm:text-xs">
                    Current Remark
                  </p>
                  <p className="mt-1.5 text-[11px] leading-5 text-slate-600 sm:text-sm sm:leading-6">
                    {submission.remark}
                  </p>
                </div>
              )}

              <div className="mt-4 grid gap-3 xl:grid-cols-2">
                <form
                  action={updateSubmissionStatus}
                  className="space-y-3 border border-green-200 bg-green-50 p-3"
                >
                  <input
                    type="hidden"
                    name="submissionId"
                    value={submission.id}
                  />
                  <input type="hidden" name="status" value="APPROVED" />

                  <label className="block text-xs font-semibold uppercase tracking-[0.12em] text-slate-700 sm:text-sm">
                    Approval Remark
                  </label>

                  <textarea
                    name="remark"
                    placeholder="Approval feedback (Optional)"
                    defaultValue={
                      submission.status === "APPROVED"
                        ? submission.remark ?? ""
                        : ""
                    }
                    className="min-h-[90px] w-full border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-green-700"
                  />

                  <button
                    type="submit"
                    className="bg-green-700 px-4 py-2 text-xs font-semibold text-white transition hover:bg-green-800 sm:text-sm"
                  >
                    Approve Submission
                  </button>
                </form>

                <form
                  action={updateSubmissionStatus}
                  className="space-y-3 border border-red-200 bg-red-50 p-3"
                >
                  <input
                    type="hidden"
                    name="submissionId"
                    value={submission.id}
                  />
                  <input type="hidden" name="status" value="REJECTED" />

                  <label className="block text-xs font-semibold uppercase tracking-[0.12em] text-slate-700 sm:text-sm">
                    Rejection Remark
                  </label>

                  <textarea
                    name="remark"
                    placeholder="State why this project was rejected and what to fix"
                    defaultValue={
                      submission.status === "REJECTED"
                        ? submission.remark ?? ""
                        : ""
                    }
                    className="min-h-[90px] w-full border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-red-500"
                  />

                  <button
                    type="submit"
                    className="bg-red-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-red-700 sm:text-sm"
                  >
                    Reject Submission
                  </button>
                </form>
              </div>
            </article>
          ))
        ) : (
          <div className="border border-emerald-100 bg-white p-4 shadow-sm">
            <p className="text-sm text-slate-600">
              No submissions found for this track.
            </p>
          </div>
        )}
      </section>

      <section className="border border-emerald-100 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {hasPreviousPage ? (
              <a
                href={buildTeacherSubmissionsUrl({
                  status,
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
                href={buildTeacherSubmissionsUrl({
                  status,
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
            <input type="hidden" name="status" value={status} />
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
          Total results: {totalFilteredSubmissions} • Page {currentPage} of {totalPages}
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

      <p className="mt-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500 sm:text-[11px]">
        {label}
      </p>

      <h2 className={`mt-1 text-base font-bold sm:text-lg ${valueColor}`}>
        {value}
      </h2>

      <p className="mt-1 text-[10px] leading-4 text-slate-600 sm:text-[11px]">
        {note}
      </p>
    </div>
  );
}