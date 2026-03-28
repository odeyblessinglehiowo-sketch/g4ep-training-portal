import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  deleteAssignment,
  toggleAssignmentPublish,
} from "@/app/teacher/assignments/actions";

export const dynamic = "force-dynamic";

export default async function AdminAssignmentDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await requireRole("ADMIN");

  const assignment = await db.assignment.findUnique({
    where: {
      id,
    },
    include: {
      teacher: {
        include: {
          user: true,
        },
      },
      views: {
        include: {
          student: {
            include: {
              user: true,
            },
          },
        },
        orderBy: {
          seenAt: "desc",
        },
      },
    },
  });

  if (!assignment) {
    throw new Error("Assignment not found.");
  }

  const allStudents = await db.student.findMany({
    where: {
      track: assignment.track,
    },
    include: {
      user: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const seenMap = new Map(
    assignment.views
      .filter((view) => view.seenAt !== null)
      .map((view) => [view.studentId, view])
  );

  const seenStudents = allStudents
    .filter((student) => seenMap.has(student.id))
    .map((student) => {
      const view = seenMap.get(student.id)!;
      return {
        ...student,
        seenAt: view.seenAt,
      };
    });

  const unreadStudents = allStudents.filter((student) => !seenMap.has(student.id));

  return (
    <main className="space-y-6">
      <section className="rounded-[2rem] bg-gradient-to-r from-emerald-900 via-green-700 to-lime-500 p-6 text-white shadow-lg shadow-emerald-200/50 sm:p-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-50/90">
              Admin Assignment Details
            </p>
            <h1 className="mt-3 text-3xl font-bold sm:text-4xl">
              {assignment.title}
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-emerald-50/90 sm:text-base">
              Review assignment content, publish state, teacher ownership, and
              student engagement from the admin side.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/admin/assignments"
              className="rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-50"
            >
              Back to Assignments
            </Link>

            <form action={toggleAssignmentPublish}>
              <input type="hidden" name="assignmentId" value={assignment.id} />
              <button
                type="submit"
                className="rounded-2xl bg-white/15 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/20"
              >
                {assignment.isPublished ? "Unpublish" : "Publish"}
              </button>
            </form>

            <form action={deleteAssignment}>
              <input type="hidden" name="assignmentId" value={assignment.id} />
              <button
                type="submit"
                className="rounded-2xl bg-red-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-red-700"
              >
                Delete
              </button>
            </form>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MiniCard label="Track" value={assignment.track} />
        <MiniCard label="Teacher" value={assignment.teacher.user.name} />
        <MiniCard
          label="Seen"
          value={`${seenStudents.length}`}
          soft="bg-emerald-50 ring-emerald-100"
          valueClass="text-emerald-700"
        />
        <MiniCard
          label="Unread"
          value={`${unreadStudents.length}`}
          soft="bg-red-50 ring-red-100"
          valueClass="text-red-700"
        />
      </section>

      <section className="rounded-[1.75rem] border border-emerald-100 bg-white p-6 shadow-sm">
        <h2 className="text-2xl font-bold text-slate-900">Assignment Content</h2>

        <div className="mt-6 grid gap-4">
          {assignment.question && (
            <ContentBlock title="Question / Instructions">
              <p className="whitespace-pre-line text-sm leading-7 text-slate-700">
                {assignment.question}
              </p>
            </ContentBlock>
          )}

          {assignment.imageUrl && (
            <ContentBlock title="Assignment Image">
              <img
                src={assignment.imageUrl}
                alt={assignment.title}
                className="max-h-[420px] w-full rounded-2xl object-contain ring-1 ring-slate-200"
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
                {assignment.linkLabel || "Open Link"}
              </a>
            </ContentBlock>
          )}

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <MiniCard
              label="Status"
              value={assignment.isPublished ? "Published" : "Unpublished"}
            />
            <MiniCard
              label="Created"
              value={formatDateTime(assignment.createdAt)}
            />
            <MiniCard
              label="Updated"
              value={formatDateTime(assignment.updatedAt)}
            />
            <MiniCard
              label="Due Date"
              value={assignment.dueDate ? formatDateTime(assignment.dueDate) : "No deadline"}
            />
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <section
          id="seen-students"
          className="rounded-[1.75rem] border border-emerald-100 bg-white p-6 shadow-sm"
        >
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-2xl font-bold text-slate-900">Seen Students</h2>
            <span className="rounded-full bg-emerald-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.15em] text-emerald-700">
              {seenStudents.length}
            </span>
          </div>

          <div className="mt-6 space-y-3">
            {seenStudents.length > 0 ? (
              seenStudents.map((student) => (
                <div
                  key={student.id}
                  className="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4"
                >
                  <p className="font-semibold text-slate-900">{student.user.name}</p>
                  <p className="mt-1 text-sm text-slate-600">{student.user.email}</p>
                  <p className="mt-2 text-xs font-semibold uppercase tracking-[0.15em] text-emerald-700">
                    Seen at: {student.seenAt ? formatDateTime(student.seenAt) : "Viewed"}
                  </p>
                </div>
              ))
            ) : (
              <EmptyList text="No student has opened this assignment yet." />
            )}
          </div>
        </section>

        <section
          id="unread-students"
          className="rounded-[1.75rem] border border-red-100 bg-white p-6 shadow-sm"
        >
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-2xl font-bold text-slate-900">Unread Students</h2>
            <span className="rounded-full bg-red-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.15em] text-red-700">
              {unreadStudents.length}
            </span>
          </div>

          <div className="mt-6 space-y-3">
            {unreadStudents.length > 0 ? (
              unreadStudents.map((student) => (
                <div
                  key={student.id}
                  className="rounded-2xl border border-red-100 bg-red-50/60 p-4"
                >
                  <p className="font-semibold text-slate-900">{student.user.name}</p>
                  <p className="mt-1 text-sm text-slate-600">{student.user.email}</p>
                  <p className="mt-2 text-xs font-semibold uppercase tracking-[0.15em] text-red-700">
                    Not yet viewed
                  </p>
                </div>
              ))
            ) : (
              <EmptyList text="All students in this track have opened this assignment." />
            )}
          </div>
        </section>
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
    <div className="rounded-2xl bg-slate-50 p-5 ring-1 ring-slate-200">
      <p className="text-sm font-semibold uppercase tracking-[0.15em] text-slate-500">
        {title}
      </p>
      <div className="mt-3">{children}</div>
    </div>
  );
}

function MiniCard({
  label,
  value,
  soft = "bg-slate-50 ring-slate-200",
  valueClass = "text-slate-900",
}: {
  label: string;
  value: string;
  soft?: string;
  valueClass?: string;
}) {
  return (
    <div className={`rounded-2xl p-4 ring-1 ${soft}`}>
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className={`mt-2 text-lg font-bold ${valueClass}`}>{value}</p>
    </div>
  );
}

function EmptyList({ text }: { text: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5 text-sm text-slate-600">
      {text}
    </div>
  );
}

function formatDateTime(date: Date) {
  return new Intl.DateTimeFormat("en-NG", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(date));
}