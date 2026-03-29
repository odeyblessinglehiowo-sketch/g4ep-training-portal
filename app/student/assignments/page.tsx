import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

function isPdfFile(url?: string | null) {
  if (!url) return false;
  return url.toLowerCase().includes(".pdf");
}

function isImageFile(url?: string | null) {
  if (!url) return false;

  const lower = url.toLowerCase();

  // 🚨 block PDF from being treated as image
  if (lower.includes(".pdf")) return false;

  return (
    lower.endsWith(".jpg") ||
    lower.endsWith(".jpeg") ||
    lower.endsWith(".png") ||
    lower.endsWith(".webp") ||
    lower.endsWith(".gif")
  );
}

export default async function StudentAssignmentsPage() {
  const currentUser = await requireRole("STUDENT");

  const studentUser = await db.user.findUnique({
    where: { id: currentUser.userId },
    include: { student: true },
  });

  if (!studentUser?.student) {
    throw new Error("Student profile not found.");
  }

  const student = studentUser.student;

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
  });

  const unseenAssignments = assignments.filter(
    (a) => !a.views[0]?.seenAt
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
    <main className="space-y-6">
      {/* HEADER */}
      <section className="rounded-[2rem] bg-gradient-to-r from-emerald-800 via-green-700 to-lime-500 p-6 text-white">
        <h1 className="text-3xl font-bold">My Assignments</h1>
        <p className="mt-3 text-sm">
          View assignments, PDFs, images, and links from your teacher.
        </p>
      </section>

      {/* LIST */}
      <section className="space-y-5">
        {assignments.map((assignment) => {
          const isNew = !assignment.views[0]?.seenAt;

          return (
            <article
              key={assignment.id}
              className="rounded-2xl border bg-white p-6 shadow-sm"
            >
              {/* TITLE */}
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl font-bold">{assignment.title}</h2>

                {isNew && (
                  <span className="bg-red-100 text-red-700 px-2 py-1 text-xs rounded-full">
                    New
                  </span>
                )}

                {assignment.attachmentUrl && (
                  <span className="bg-sky-100 text-sky-700 px-2 py-1 text-xs rounded-full">
                    {isPdfFile(assignment.attachmentUrl)
                      ? "PDF"
                      : isImageFile(assignment.attachmentUrl)
                      ? "Image"
                      : "Attachment"}
                  </span>
                )}
              </div>

              {/* META */}
              <div className="mt-3 text-sm text-slate-600">
                Teacher: {assignment.teacher.user.name}
              </div>

              {/* CONTENT */}
              <div className="mt-5 space-y-4">
                {assignment.question && (
                  <ContentBlock title="Instructions">
                    {assignment.question}
                  </ContentBlock>
                )}

                {/* IMAGE */}
                {assignment.attachmentUrl &&
                  isImageFile(assignment.attachmentUrl) && (
                    <ContentBlock title="Image">
                      <a
                        href={assignment.attachmentUrl}
                        target="_blank"
                        className="btn"
                      >
                        View Image
                      </a>
                    </ContentBlock>
                  )}

                {/* PDF */}
                {assignment.attachmentUrl &&
                  isPdfFile(assignment.attachmentUrl) && (
                    <ContentBlock title="PDF">
                      <a
                        href={assignment.attachmentUrl}
                        target="_blank"
                        className="btn"
                      >
                        Open PDF
                      </a>
                    </ContentBlock>
                  )}

                {/* OTHER FILE */}
                {assignment.attachmentUrl &&
                  !isImageFile(assignment.attachmentUrl) &&
                  !isPdfFile(assignment.attachmentUrl) && (
                    <ContentBlock title="Attachment">
                      <a
                        href={assignment.attachmentUrl}
                        target="_blank"
                        className="btn"
                      >
                        Open File
                      </a>
                    </ContentBlock>
                  )}

                {/* LINK */}
                {assignment.linkUrl && (
                  <ContentBlock title="Link">
                    <a
                      href={assignment.linkUrl}
                      target="_blank"
                      className="btn"
                    >
                      Open Link
                    </a>
                  </ContentBlock>
                )}
              </div>
            </article>
          );
        })}
      </section>
    </main>
  );
}

function ContentBlock({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-slate-50 p-4 rounded-xl">
      <p className="text-xs font-bold text-slate-500 uppercase">{title}</p>
      <div className="mt-2 text-sm">{children}</div>
    </div>
  );
}