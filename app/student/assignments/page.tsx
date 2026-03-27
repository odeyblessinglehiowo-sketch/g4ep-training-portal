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
              View all assignments posted for your track. New assignment alerts
              clear automatically once you open this page.
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

      <section className="rounded-[2rem] border border-emerald-100 bg-white/90 p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-700">
              Assignment List
            </p>
            <h2 className="mt-2 text-2xl font-bold text-slate-900">
              Posted Tasks
            </h2>
          </div>

          <span className="rounded-full bg-emerald-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.15em] text-emerald-700">
            {assignments.length} Available
          </span>
        </div>

        <div className="mt-6 space-y-4">
          {assignments.length > 0 ? (
            assignments.map((assignment) => {
              const wasUnread = !assignment.views[0]?.seenAt;

              return (
                <article
                  key={assignment.id}
                  className="rounded-[1.75rem] border border-slate-200 bg-slate-50/70 p-5"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-lg font-bold text-slate-900">
                          {assignment.title}
                        </h3>

                        {wasUnread && (
                          <span className="rounded-full bg-red-100 px-2.5 py-1 text-xs font-semibold text-red-700">
                            New
                          </span>
                        )}

                        <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                          Active
                        </span>
                      </div>

                      <p className="mt-3 whitespace-pre-line text-sm leading-7 text-slate-600">
                        {assignment.question}
                      </p>
                    </div>

                    <div className="grid shrink-0 gap-2 text-sm lg:min-w-[230px]">
                      <InfoPill
                        label="Track"
                        value={assignment.track}
                        tone="bg-emerald-50 text-emerald-700"
                      />
                      <InfoPill
                        label="Teacher"
                        value={assignment.teacher.user.name}
                        tone="bg-lime-50 text-lime-700"
                      />
                      <InfoPill
                        label="Created"
                        value={formatDateTime(assignment.createdAt)}
                        tone="bg-green-50 text-green-700"
                      />
                      <InfoPill
                        label="Due"
                        value={
                          assignment.dueDate
                            ? formatDateTime(assignment.dueDate)
                            : "No deadline"
                        }
                        tone="bg-slate-100 text-slate-700"
                      />
                    </div>
                  </div>
                </article>
              );
            })
          ) : (
            <div className="rounded-[1.75rem] border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
              <h3 className="text-lg font-bold text-slate-900">
                No assignments yet
              </h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Your teacher has not posted any assignment for your track yet.
                Once one is published, it will appear here.
              </p>
            </div>
          )}
        </div>
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

function InfoPill({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: string;
}) {
  return (
    <div className={`rounded-2xl px-3 py-2 ${tone}`}>
      <p className="text-[11px] font-semibold uppercase tracking-[0.15em] opacity-80">
        {label}
      </p>
      <p className="mt-1 text-sm font-semibold">{value}</p>
    </div>
  );
}

function formatDateTime(date: Date) {
  return new Intl.DateTimeFormat("en-NG", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(date));
}