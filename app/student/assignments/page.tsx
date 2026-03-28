import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function StudentAssignmentsPage() {
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

  const assignments = await db.assignment.findMany({
    where: {
      track: student.track,
      isPublished: true,
    },
    include: {
      teacher: {
        include: {
          user: true,
        },
      },
      views: {
        where: {
          studentId: student.id,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
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
          update: {
            seenAt: new Date(),
          },
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
      <section className="overflow-hidden rounded-[2rem] bg-gradient-to-r from-emerald-800 via-green-700 to-lime-500 p-6 text-white shadow-lg shadow-emerald-200/50 sm:p-8">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-50/90">
              Assignment Board
            </p>

            <h1 className="mt-3 text-3xl font-bold leading-tight sm:text-4xl">
              My Assignments
            </h1>

            <p className="mt-4 max-w-2xl text-sm leading-7 text-emerald-50/90 sm:text-base">
              View all assignments posted for your track, including written
              instructions, image references, and useful links from your teacher.
            </p>
          </div>

          <div className="grid w-full grid-cols-2 gap-3 sm:max-w-md xl:w-auto">
            <StatMini label="Track" value={student.track} />
            <StatMini label="Total" value={`${assignments.length}`} />
            <StatMini label="New" value={`${unseenAssignments.length}`} />
            <StatMini
              label="Viewed"
              value={`${assignments.length - unseenAssignments.length}`}
            />
          </div>
        </div>
      </section>

      <section className="space-y-5">
        {assignments.length > 0 ? (
          assignments.map((assignment) => {
            const wasUnread = !assignment.views[0]?.seenAt;

            return (
              <article
                key={assignment.id}
                className="rounded-[1.75rem] border border-emerald-100 bg-white p-6 shadow-sm"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-2xl font-bold text-slate-900">
                        {assignment.title}
                      </h2>

                      {wasUnread && (
                        <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700">
                          New
                        </span>
                      )}

                      <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                        Active
                      </span>
                    </div>

                    <div className="mt-4 grid gap-3 text-sm text-slate-600 sm:grid-cols-2">
                      <p>
                        <span className="font-semibold text-slate-800">Teacher:</span>{" "}
                        {assignment.teacher.user.name}
                      </p>
                      <p>
                        <span className="font-semibold text-slate-800">Track:</span>{" "}
                        {assignment.track}
                      </p>
                      <p>
                        <span className="font-semibold text-slate-800">Created:</span>{" "}
                        {formatDateTime(assignment.createdAt)}
                      </p>
                      <p>
                        <span className="font-semibold text-slate-800">Due Date:</span>{" "}
                        {assignment.dueDate
                          ? formatDateTime(assignment.dueDate)
                          : "No deadline"}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-6 grid gap-4">
                  {assignment.question && (
                    <ContentBlock title="Question / Instructions">
                      <p className="whitespace-pre-line text-sm leading-7 text-slate-700">
                        {assignment.question}
                      </p>
                    </ContentBlock>
                  )}

                  {assignment.imageUrl && (
                    <ContentBlock title="Reference Image">
                      <img
                        src={assignment.imageUrl}
                        alt={assignment.title}
                        className="max-h-[460px] w-full rounded-2xl object-contain ring-1 ring-slate-200"
                      />
                    </ContentBlock>
                  )}

                  {assignment.linkUrl && (
                    <ContentBlock title="Assignment Link">
                      <a
                        href={assignment.linkUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex rounded-xl bg-emerald-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-800"
                      >
                        {assignment.linkLabel || "Open Assignment Link"}
                      </a>
                    </ContentBlock>
                  )}
                </div>
              </article>
            );
          })
        ) : (
          <div className="rounded-[1.75rem] border border-emerald-100 bg-white p-8 text-center shadow-sm">
            <h3 className="text-xl font-bold text-slate-900">No assignments yet</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Your teacher has not posted any assignment for your track yet.
              Once one is published, it will appear here.
            </p>
          </div>
        )}
      </section>
    </main>
  );
}

function StatMini({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-white/20 bg-white/15 p-4 backdrop-blur">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-50/85">
        {label}
      </p>
      <p className="mt-2 text-xl font-bold text-white">{value}</p>
    </div>
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
    <div className="rounded-2xl bg-slate-50 p-5 ring-1 ring-slate-200">
      <p className="text-sm font-semibold uppercase tracking-[0.15em] text-slate-500">
        {title}
      </p>
      <div className="mt-3">{children}</div>
    </div>
  );
}

function formatDateTime(date: Date) {
  return new Intl.DateTimeFormat("en-NG", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(date));
}