import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { updateSubmissionStatus } from "@/app/admin/submissions/actions";

export const dynamic = "force-dynamic";

export default async function TeacherSubmissionsPage() {
  const currentUser = await requireRole("TEACHER");

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

  const submissions = await db.submission.findMany({
    where: {
      student: {
        track: teacher.track,
      },
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

  return (
    <main className="space-y-6">
      <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-green-700">
          Submissions
        </p>

        <h1 className="mt-2 text-3xl font-bold text-slate-900">
          Track Submissions
        </h1>

        <p className="mt-2 text-sm text-slate-600">
          Review submissions for your assigned teaching track.
        </p>
      </section>

      <section className="grid gap-6">
        {submissions.length > 0 ? (
          submissions.map((submission) => (
            <div
              key={submission.id}
              className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    {submission.title}
                  </h3>

                  {submission.assignment && (
                    <p className="mt-2 text-sm font-medium text-emerald-700">
                      Assignment: {submission.assignment.title}
                    </p>
                  )}

                  <p className="mt-2 text-sm text-slate-600">
                    Student: {submission.student.user.name}
                  </p>

                  <p className="mt-1 text-sm text-slate-600">
                    Track: {submission.student.track}
                  </p>

                  <p className="mt-1 text-sm text-slate-600">
                    Submitted on{" "}
                    {new Date(submission.createdAt).toLocaleDateString()}
                  </p>
                </div>

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

              <div className="mt-4">
                <a
                  href={submission.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
                >
                  View Submission
                </a>
              </div>

              {submission.remark && (
                <div className="mt-4 rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
                  <p className="text-sm font-semibold text-slate-800">
                    Current Remark
                  </p>
                  <p className="mt-2 text-sm text-slate-600">
                    {submission.remark}
                  </p>
                </div>
              )}

              <div className="mt-6 grid gap-4 lg:grid-cols-2">
                <form
                  action={updateSubmissionStatus}
                  className="space-y-3 rounded-2xl border border-green-200 bg-green-50 p-4"
                >
                  <input
                    type="hidden"
                    name="submissionId"
                    value={submission.id}
                  />
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
                    className="min-h-[110px] w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-green-700"
                  />

                  <button
                    type="submit"
                    className="rounded-lg bg-green-700 px-4 py-2 text-sm font-semibold text-white hover:bg-green-800"
                  >
                    Approve Submission
                  </button>
                </form>

                <form
                  action={updateSubmissionStatus}
                  className="space-y-3 rounded-2xl border border-red-200 bg-red-50 p-4"
                >
                  <input
                    type="hidden"
                    name="submissionId"
                    value={submission.id}
                  />
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
                    className="min-h-[110px] w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-red-500"
                  />

                  <button
                    type="submit"
                    className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
                  >
                    Reject Submission
                  </button>
                </form>
              </div>
            </div>
          ))
        ) : (
          <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <p className="text-sm text-slate-600">
              No submissions found for this track.
            </p>
          </div>
        )}
      </section>
    </main>
  );
}