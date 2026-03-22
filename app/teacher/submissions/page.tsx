import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
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

                  <p className="mt-2 text-sm text-slate-600">
                    Student: {submission.student.user.name}
                  </p>

                  <p className="mt-1 text-sm text-slate-600">
                    Status: {submission.status}
                  </p>

                  {submission.remark && (
                    <p className="mt-1 text-sm text-slate-600">
                      Remark: {submission.remark}
                    </p>
                  )}
                </div>

                <a
                  href={submission.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-lg bg-green-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-green-800 active:scale-[0.98]"
                >
                  View Submission
                </a>
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