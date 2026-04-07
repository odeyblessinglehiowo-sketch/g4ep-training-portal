import { requireRole } from "@/lib/auth";
export const dynamic = "force-dynamic";
import { db } from "@/lib/db";
import { createSubmission } from "./actions";

const PAGE_SIZE = 8;

export default async function StudentSubmissionsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const params = await searchParams;
  const page = Number(params.page ?? "1");

  const currentUser = await requireRole("STUDENT");

  const studentUser = await db.user.findUnique({
    where: { id: currentUser.userId },
    include: { student: true },
  });

  if (!studentUser || !studentUser.student) {
    throw new Error("Student profile not found.");
  }

  const student = studentUser.student;

  const assignments = await db.assignment.findMany({
    where: {
      track: student.track,
      isPublished: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const totalSubmissions = await db.submission.count({
    where: { studentId: student.id },
  });

  const totalPages = Math.max(1, Math.ceil(totalSubmissions / PAGE_SIZE));
  const currentPage = Math.min(Math.max(page, 1), totalPages);

  const submissions = await db.submission.findMany({
    where: { studentId: student.id },
    include: { assignment: true },
    orderBy: { createdAt: "desc" },
    skip: (currentPage - 1) * PAGE_SIZE,
    take: PAGE_SIZE,
  });

  const reviewedSubmissionsCount = await db.submission.count({
    where: {
      studentId: student.id,
      status: {
        in: ["APPROVED", "REJECTED"],
      },
      studentSeenReview: false,
    },
  });

  await db.submission.updateMany({
    where: {
      studentId: student.id,
      status: {
        in: ["APPROVED", "REJECTED"],
      },
      studentSeenReview: false,
    },
    data: {
      studentSeenReview: true,
    },
  });

  return (
    <main className="space-y-4">
      <section className="overflow-hidden border border-emerald-200 bg-gradient-to-r from-emerald-950 via-emerald-700 to-lime-500 px-4 py-3 text-white shadow-sm">
        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-emerald-100/90">
          Submissions
        </p>

        <h1 className="mt-1 text-xl font-bold sm:text-2xl">
          My Submissions
        </h1>

        <p className="mt-1 text-sm text-emerald-50/90">
          Submit projects and track teacher feedback.
        </p>
      </section>

      <section className="border border-emerald-100 bg-white p-4 shadow-sm">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-emerald-700">
            New Submission
          </p>

          <h2 className="mt-1 text-lg font-bold text-slate-900">
            Submit Project
          </h2>
        </div>

        <form
          action={createSubmission}
          encType="multipart/form-data"
          className="mt-4 grid gap-3 md:grid-cols-2"
        >
          <input
            name="title"
            type="text"
            placeholder="Project Title"
            className="border border-emerald-100 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-emerald-500"
          />

          <select
            name="assignmentId"
            defaultValue=""
            className="border border-emerald-100 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-emerald-500"
          >
            <option value="">Assignment (Optional)</option>
            {assignments.map((assignment) => (
              <option key={assignment.id} value={assignment.id}>
                {assignment.title}
              </option>
            ))}
          </select>

          <input
            name="fileUrl"
            type="url"
            placeholder="Project Link (optional if uploading file)"
            className="border border-emerald-100 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-emerald-500 md:col-span-2"
          />

          <div className="md:col-span-2">
            <label className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-600">
              Upload File
            </label>
            <input
              name="uploadFile"
              type="file"
              accept=".pdf,image/*,video/*"
              className="w-full border border-emerald-100 bg-white px-3 py-2.5 text-sm outline-none transition file:mr-4 file:border-0 file:bg-emerald-100 file:px-3 file:py-2 file:font-semibold file:text-emerald-700 hover:file:bg-emerald-200"
            />
            <p className="mt-2 text-[11px] text-slate-500">
              You can upload PDF, image, or video files. You can also still paste a link.
            </p>
          </div>

          <button
            type="submit"
            className="md:col-span-2 bg-emerald-700 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-800"
          >
            Submit
          </button>
        </form>
      </section>

      {reviewedSubmissionsCount > 0 && (
        <section className="border border-emerald-200 bg-emerald-50 p-4 shadow-sm">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-emerald-700">
            Review Update
          </p>

          <h2 className="mt-1 text-lg font-bold text-slate-900">
            You have {reviewedSubmissionsCount} reviewed submission
            {reviewedSubmissionsCount === 1 ? "" : "s"}
          </h2>

          <p className="mt-1 text-sm text-slate-600">
            Your teacher has reviewed one or more of your submitted projects.
          </p>
        </section>
      )}

      <section className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {submissions.length > 0 ? (
          submissions.map((submission) => (
            <article
              key={submission.id}
              className="border border-emerald-100 bg-white p-4 shadow-sm"
            >
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900 sm:text-base">
                  {submission.title}
                </h3>

                <span
                  className={`px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] ${
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
                <p className="mt-2 text-sm font-medium text-emerald-700">
                  Assignment: {submission.assignment.title}
                </p>
              )}

              <p className="mt-2 text-sm text-slate-600">
                Submitted on {new Date(submission.createdAt).toLocaleDateString()}
              </p>

              <div className="mt-3">
                <a
                  href={submission.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex bg-emerald-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-800"
                >
                  View Submission
                </a>
              </div>

              {submission.remark && (
                <div
                  className={`mt-4 border p-3 ${
                    submission.status === "REJECTED"
                      ? "border-red-200 bg-red-50"
                      : "border-green-200 bg-green-50"
                  }`}
                >
                  <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-600">
                    Teacher Remark
                  </p>

                  <p className="mt-2 text-sm text-slate-700 line-clamp-4">
                    {submission.remark}
                  </p>
                </div>
              )}
            </article>
          ))
        ) : (
          <div className="col-span-2 border border-emerald-100 bg-white p-4 shadow-sm xl:col-span-4">
            <p className="text-sm text-slate-600">No submissions yet.</p>
          </div>
        )}
      </section>

      <section className="flex items-center justify-between text-sm">
        <a
          href={`?page=${currentPage - 1}`}
          className={`font-medium text-slate-700 ${
            currentPage <= 1 ? "pointer-events-none opacity-40" : ""
          }`}
        >
          ← Prev
        </a>

        <span className="font-medium text-slate-700">
          Page {currentPage} of {totalPages}
        </span>

        <a
          href={`?page=${currentPage + 1}`}
          className={`font-medium text-slate-700 ${
            currentPage >= totalPages ? "pointer-events-none opacity-40" : ""
          }`}
        >
          Next →
        </a>
      </section>
    </main>
  );
}