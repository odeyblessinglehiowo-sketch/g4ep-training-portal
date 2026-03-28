import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { updateSubmissionStatus } from "./actions";

export const dynamic = "force-dynamic";

export default async function AdminSubmissionsPage({
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

  const trackRows = await db.student.findMany({
    select: {
      track: true,
    },
    distinct: ["track"],
  });

  const trackOptions = trackRows.map((row) => row.track).sort();

  const submissions = await db.submission.findMany({
    where: {
      AND: [
        track !== "ALL"
          ? {
              student: {
                track,
              },
            }
          : {},
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
                  student: {
                    user: {
                      name: {
                        contains: q,
                        mode: "insensitive",
                      },
                    },
                  },
                },
                {
                  assignment: {
                    title: {
                      contains: q,
                      mode: "insensitive",
                    },
                  },
                },
              ],
            }
          : {},
      ],
    },
    orderBy: {
      createdAt: "desc",
    },
    include: {
      student: {
        include: {
          user: true,
        },
      },
      assignment: true,
    },
  });

  const totalSubmissions = submissions.length;
  const pendingSubmissions = submissions.filter(
    (submission) => submission.status === "PENDING"
  ).length;
  const approvedSubmissions = submissions.filter(
    (submission) => submission.status === "APPROVED"
  ).length;
  const rejectedSubmissions = submissions.filter(
    (submission) => submission.status === "REJECTED"
  ).length;

  return (
    <main className="space-y-6">
      <section className="overflow-hidden rounded-[2rem] bg-gradient-to-r from-emerald-900 via-green-700 to-lime-500 p-6 text-white shadow-lg shadow-emerald-200/50 sm:p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-50/90">
          Submissions
        </p>

        <h1 className="mt-3 text-3xl font-bold sm:text-4xl">
          Review Student Projects
        </h1>

        <p className="mt-4 max-w-3xl text-sm leading-7 text-emerald-50/90 sm:text-base">
          Approve or reject student submissions, monitor pending reviews,
          and leave meaningful feedback for corrections and improvement.
        </p>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Total Submissions" value={totalSubmissions} />
          <StatCard
            label="Pending"
            value={pendingSubmissions}
            tone="bg-yellow-50"
            valueClass="text-yellow-700"
          />
          <StatCard
            label="Approved"
            value={approvedSubmissions}
            tone="bg-emerald-50"
            valueClass="text-emerald-700"
          />
          <StatCard
            label="Rejected"
            value={rejectedSubmissions}
            tone="bg-red-50"
            valueClass="text-red-600"
          />
        </section>

        <section className="rounded-[1.75rem] border border-emerald-100 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900">Search & Track Filter</h2>
          <p className="mt-1 text-sm text-slate-600">
            Search by student, submission title, or assignment title and filter by track.
          </p>

          <form className="mt-6 grid gap-4">
            <input
              name="q"
              type="text"
              defaultValue={q}
              placeholder="Search student, project, or assignment"
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
                href="/admin/submissions"
                className="flex-1 rounded-xl bg-slate-200 px-5 py-3 text-center font-semibold text-slate-800 hover:bg-slate-300"
              >
                Reset
              </a>
            </div>
          </form>
        </section>
      </section>

      <section className="grid gap-6">
        {submissions.length > 0 ? (
          submissions.map((submission) => (
            <article
              key={submission.id}
              className="rounded-[1.75rem] border border-emerald-100 bg-white p-6 shadow-sm transition hover:shadow-md"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <h3 className="text-xl font-bold text-slate-900">
                      {submission.title}
                    </h3>

                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
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
                    <p className="mt-3 text-sm font-medium text-emerald-700">
                      Assignment: {submission.assignment.title}
                    </p>
                  )}

                  <div className="mt-3 grid gap-2 text-sm text-slate-600 sm:grid-cols-2">
                    <p>Student: {submission.student.user.name}</p>
                    <p>Track: {submission.student.track}</p>
                    <p>
                      Submitted on{" "}
                      {new Date(submission.createdAt).toLocaleDateString()}
                    </p>
                    <p>Email: {submission.student.user.email}</p>
                  </div>
                </div>

                <a
                  href={submission.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
                >
                  View Submission
                </a>
              </div>

              {submission.remark && (
                <div className="mt-5 rounded-[1.5rem] bg-slate-50 p-4 ring-1 ring-slate-200">
                  <p className="text-sm font-semibold text-slate-800">
                    Current Remark
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    {submission.remark}
                  </p>
                </div>
              )}

              <div className="mt-6 grid gap-4 xl:grid-cols-2">
                <form
                  action={updateSubmissionStatus}
                  className="space-y-3 rounded-[1.5rem] border border-green-200 bg-green-50 p-4"
                >
                  <input type="hidden" name="submissionId" value={submission.id} />
                  <input type="hidden" name="status" value="APPROVED" />

                  <label className="block text-sm font-medium text-slate-700">
                    Approval Remark
                  </label>

                  <textarea
                    name="remark"
                    placeholder="Optional approval feedback"
                    defaultValue={
                      submission.status === "APPROVED"
                        ? submission.remark ?? ""
                        : ""
                    }
                    className="min-h-[110px] w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-green-700"
                  />

                  <button
                    type="submit"
                    className="rounded-xl bg-green-700 px-4 py-2 text-sm font-semibold text-white hover:bg-green-800"
                  >
                    Approve Submission
                  </button>
                </form>

                <form
                  action={updateSubmissionStatus}
                  className="space-y-3 rounded-[1.5rem] border border-red-200 bg-red-50 p-4"
                >
                  <input type="hidden" name="submissionId" value={submission.id} />
                  <input type="hidden" name="status" value="REJECTED" />

                  <label className="block text-sm font-medium text-slate-700">
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
                    className="min-h-[110px] w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-red-500"
                  />

                  <button
                    type="submit"
                    className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
                  >
                    Reject Submission
                  </button>
                </form>
              </div>
            </article>
          ))
        ) : (
          <div className="rounded-[1.75rem] border border-emerald-100 bg-white p-6 shadow-sm">
            <p className="text-sm text-slate-600">No submissions yet.</p>
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