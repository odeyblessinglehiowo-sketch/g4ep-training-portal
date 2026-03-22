import { requireRole } from "@/lib/auth";
export const dynamic = "force-dynamic";
import { db } from "@/lib/db";
import { createSubmission } from "./actions";

export default async function StudentSubmissionsPage() {
  const currentUser = await requireRole("STUDENT");

  const studentUser = await db.user.findUnique({
    where: {
      id: currentUser.userId,
    },
    include: {
      student: true,
    },
  });

  if (!studentUser || !studentUser.student) {
    throw new Error("Student profile not found.");
  }

  const student = studentUser.student;

  const submissions = await db.submission.findMany({
    where: {
      studentId: student.id,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return (
    <main className="space-y-6">
      <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-green-700">
          Project Submission
        </p>

        <h1 className="mt-2 text-3xl font-bold text-slate-900">
          My Submissions
        </h1>

        <p className="mt-2 text-sm text-slate-600">
          Upload your assignments and track their review status here.
        </p>
      </section>

      <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <form action={createSubmission} className="grid gap-4 md:grid-cols-2">
          <input
            name="title"
            type="text"
            placeholder="Project Title"
            className="rounded-lg border border-slate-300 px-4 py-2 outline-none transition focus:border-green-700"
          />

          <input
            name="fileUrl"
            type="text"
            placeholder="Project Link"
            className="rounded-lg border border-slate-300 px-4 py-2 outline-none transition focus:border-green-700"
          />

          <button
            type="submit"
            className="md:col-span-2 rounded-lg bg-green-700 py-2 font-semibold text-white transition hover:bg-green-800 active:scale-[0.98]"
          >
            Submit Project
          </button>
        </form>
      </section>

      <section className="grid gap-6">
        {submissions.length > 0 ? (
          submissions.map((submission) => (
            <div
              key={submission.id}
              className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h3 className="text-lg font-bold text-slate-900">
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

              <p className="mt-3 text-sm text-slate-600">
                Submitted on{" "}
                {new Date(submission.createdAt).toLocaleDateString()}
              </p>

              <a
                href={submission.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-block rounded-lg bg-green-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-green-800 active:scale-[0.98]"
              >
                View Submission
              </a>

              {submission.remark && (
                <div
                  className={`mt-4 rounded-2xl p-4 ${
                    submission.status === "REJECTED"
                      ? "bg-red-50 ring-1 ring-red-200"
                      : "bg-green-50 ring-1 ring-green-200"
                  }`}
                >
                  <p className="text-sm font-semibold text-slate-800">
                    Teacher Remark
                  </p>

                  <p className="mt-2 text-sm text-slate-600">
                    {submission.remark}
                  </p>
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <p className="text-sm text-slate-600">No submissions yet.</p>
          </div>
        )}
      </section>
    </main>
  );
}