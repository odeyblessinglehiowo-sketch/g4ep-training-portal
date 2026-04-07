import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 8;

function isPdfFile(url?: string | null) {
  if (!url) return false;
  return url.toLowerCase().includes(".pdf");
}

function isImageFile(url?: string | null) {
  if (!url) return false;

  const lower = url.toLowerCase();

  if (lower.includes(".pdf")) return false;

  return (
    lower.endsWith(".jpg") ||
    lower.endsWith(".jpeg") ||
    lower.endsWith(".png") ||
    lower.endsWith(".webp") ||
    lower.endsWith(".gif")
  );
}

export default async function StudentAssignmentsPage({
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

  if (!studentUser?.student) {
    throw new Error("Student profile not found.");
  }

  const student = studentUser.student;

  const totalAssignments = await db.assignment.count({
    where: {
      track: student.track,
      isPublished: true,
    },
  });

  const totalPages = Math.max(1, Math.ceil(totalAssignments / PAGE_SIZE));
  const currentPage = Math.min(Math.max(page, 1), totalPages);

  const assignments = await db.assignment.findMany({
    where: {
      track: student.track,
      isPublished: true,
    },
    include: {
      teacher: { include: { user: true } },
      views: {
        where: { studentId: student.id },
      },
    },
    orderBy: { createdAt: "desc" },
    skip: (currentPage - 1) * PAGE_SIZE,
    take: PAGE_SIZE,
  });

  const unseenAssignments = assignments.filter(
    (assignment) => !assignment.views[0]?.seenAt
  );

  if (unseenAssignments.length > 0) {
    await db.$transaction(
      unseenAssignments.map((assignment) =>
        db.assignmentView.upsert({
          where: {
            assignmentId_studentId: {
              assignmentId: assignment.id,
              studentId: student.id,
            },
          },
          update: { seenAt: new Date() },
          create: {
            assignmentId: assignment.id,
            studentId: student.id,
            seenAt: new Date(),
          },
        })
      )
    );
  }

  return (
    <main className="space-y-4">
      <section className="overflow-hidden border border-emerald-200 bg-gradient-to-r from-emerald-950 via-emerald-700 to-lime-500 px-4 py-3 text-white shadow-sm">
        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-emerald-100/90">
          Assignments
        </p>

        <h1 className="mt-1 text-xl font-bold sm:text-2xl">
          My Assignments
        </h1>

        <p className="mt-1 text-sm text-emerald-50/90">
          View tasks, files, and instructions from your teacher.
        </p>
      </section>

      <section className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {assignments.length > 0 ? (
          assignments.map((assignment) => {
            const isNew = !assignment.views[0]?.seenAt;

            return (
              <article
                key={assignment.id}
                className="border border-emerald-100 bg-white p-4 shadow-sm"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-sm font-bold text-slate-900 sm:text-base">
                    {assignment.title}
                  </h2>

                  {isNew && (
                    <span className="bg-red-100 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-red-700">
                      New
                    </span>
                  )}

                  {assignment.attachmentUrl && (
                    <span className="bg-sky-100 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-sky-700">
                      {isPdfFile(assignment.attachmentUrl)
                        ? "PDF"
                        : isImageFile(assignment.attachmentUrl)
                        ? "Image"
                        : "File"}
                    </span>
                  )}

                  {assignment.linkUrl && (
                    <span className="bg-indigo-100 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-indigo-700">
                      Link
                    </span>
                  )}
                </div>

                <p className="mt-2 text-sm text-slate-600">
                  Teacher: {assignment.teacher.user.name}
                </p>

                {assignment.question && (
                  <div className="mt-3 border border-emerald-100 bg-emerald-50/30 p-3">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                      Instructions
                    </p>
                    <p className="mt-2 line-clamp-4 text-sm leading-6 text-slate-700">
                      {assignment.question}
                    </p>
                  </div>
                )}

                <div className="mt-3 space-y-2">
                  {assignment.attachmentUrl && (
                    <div className="border border-emerald-100 bg-emerald-50/30 p-3">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                        Attachment
                      </p>
                      <div className="mt-2">
                        <a
                          href={assignment.attachmentUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex bg-emerald-700 px-3 py-2 text-sm font-semibold text-white transition hover:bg-emerald-800"
                        >
                          {isPdfFile(assignment.attachmentUrl)
                            ? "Open PDF"
                            : isImageFile(assignment.attachmentUrl)
                            ? "View Image"
                            : "Open File"}
                        </a>
                      </div>
                    </div>
                  )}

                  {assignment.linkUrl && (
                    <div className="border border-emerald-100 bg-emerald-50/30 p-3">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                        Link
                      </p>
                      <div className="mt-2">
                        <a
                          href={assignment.linkUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex bg-indigo-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700"
                        >
                          Open Link
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              </article>
            );
          })
        ) : (
          <div className="col-span-2 border border-emerald-100 bg-white p-4 shadow-sm xl:col-span-4">
            <p className="text-sm text-slate-600">
              No assignments available at the moment.
            </p>
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