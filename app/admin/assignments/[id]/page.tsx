import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  deleteAssignment,
  toggleAssignmentPublish,
} from "@/app/teacher/assignments/actions";

export const dynamic = "force-dynamic";

const PER_PAGE_OPTIONS = [3, 10, 25, 50];

function isPdfFile(url?: string | null) {
  if (!url) return false;
  return url.toLowerCase().includes(".pdf");
}

function isImageFile(url?: string | null) {
  if (!url) return false;

  const lower = url.toLowerCase();

  if (lower.includes(".pdf")) {
    return false;
  }

  return (
    lower.endsWith(".jpg") ||
    lower.endsWith(".jpeg") ||
    lower.endsWith(".png") ||
    lower.endsWith(".webp") ||
    lower.endsWith(".gif")
  );
}

function buildDetailsUrl(params: {
  id: string;
  seenPage?: number;
  unreadPage?: number;
  perPage?: number;
}) {
  const search = new URLSearchParams();

  if (params.seenPage && params.seenPage > 1) {
    search.set("seenPage", String(params.seenPage));
  }

  if (params.unreadPage && params.unreadPage > 1) {
    search.set("unreadPage", String(params.unreadPage));
  }

  if (params.perPage) {
    search.set("perPage", String(params.perPage));
  }

  const query = search.toString();
  return query
    ? `/admin/assignments/${params.id}?${query}`
    : `/admin/assignments/${params.id}`;
}

export default async function AdminAssignmentDetailsPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{
    seenPage?: string;
    unreadPage?: string;
    perPage?: string;
  }>;
}) {
  const { id } = await params;
  const sp = await searchParams;

  await requireRole("ADMIN");

  const rawSeenPage = Number(sp.seenPage ?? "1");
  const rawUnreadPage = Number(sp.unreadPage ?? "1");
  const rawPerPage = Number(sp.perPage ?? "3");

  const seenPage = Number.isFinite(rawSeenPage) && rawSeenPage > 0 ? rawSeenPage : 1;
  const unreadPage =
    Number.isFinite(rawUnreadPage) && rawUnreadPage > 0 ? rawUnreadPage : 1;
  const perPage = PER_PAGE_OPTIONS.includes(rawPerPage) ? rawPerPage : 3;

  const assignment = await db.assignment.findUnique({
    where: { id },
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

  const seenStudentsAll = allStudents
    .filter((student) => seenMap.has(student.id))
    .map((student) => ({
      ...student,
      seenAt: seenMap.get(student.id)!.seenAt,
    }));

  const unreadStudentsAll = allStudents.filter(
    (student) => !seenMap.has(student.id)
  );

  const totalSeenPages = Math.max(1, Math.ceil(seenStudentsAll.length / perPage));
  const totalUnreadPages = Math.max(
    1,
    Math.ceil(unreadStudentsAll.length / perPage)
  );

  const currentSeenPage = Math.min(seenPage, totalSeenPages);
  const currentUnreadPage = Math.min(unreadPage, totalUnreadPages);

  const seenStart = (currentSeenPage - 1) * perPage;
  const unreadStart = (currentUnreadPage - 1) * perPage;

  const seenStudents = seenStudentsAll.slice(seenStart, seenStart + perPage);
  const unreadStudents = unreadStudentsAll.slice(unreadStart, unreadStart + perPage);

  return (
    <main className="space-y-4">
      <section className="overflow-hidden border border-emerald-200 bg-gradient-to-r from-emerald-900 via-green-700 to-lime-500 px-4 py-4 text-white shadow-[0_18px_45px_-22px_rgba(16,185,129,0.55)] sm:px-5">
        <div className="flex flex-col gap-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-emerald-100/90">
              Admin Assignment Details
            </p>

            <h1 className="mt-1.5 text-xl font-bold leading-tight sm:text-2xl">
              {assignment.title}
            </h1>

            <p className="mt-2 max-w-2xl text-xs leading-5 text-emerald-50/90 sm:text-sm">
              Review assignment content, file access, and student engagement from one central workspace.
            </p>
          </div>

          <div className="overflow-x-auto">
            <div className="flex min-w-max flex-nowrap gap-2">
              <Link
                href="/admin/assignments"
                className="bg-white px-3 py-2 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-50"
              >
                Back to Assignments
              </Link>

              <form action={toggleAssignmentPublish}>
                <input type="hidden" name="assignmentId" value={assignment.id} />
                <button
                  type="submit"
                  className="bg-white/15 px-3 py-2 text-xs font-semibold text-white transition hover:bg-white/20"
                >
                  {assignment.isPublished ? "Unpublish" : "Publish"}
                </button>
              </form>

              <form action={deleteAssignment}>
                <input type="hidden" name="assignmentId" value={assignment.id} />
                <button
                  type="submit"
                  className="bg-red-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-red-700"
                >
                  Delete
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-2.5 md:grid-cols-2 xl:grid-cols-4">
        <MiniCard label="Track" value={assignment.track} />
        <MiniCard label="Teacher" value={assignment.teacher.user.name} />
        <MiniCard
          label="Seen"
          value={`${seenStudentsAll.length}`}
          soft="bg-emerald-50 ring-emerald-100"
          valueClass="text-emerald-700"
        />
        <MiniCard
          label="Unread"
          value={`${unreadStudentsAll.length}`}
          soft="bg-red-50 ring-red-100"
          valueClass="text-red-700"
        />
      </section>

      <section className="border border-emerald-100 bg-white p-4 shadow-sm">
        <h2 className="text-lg font-bold text-slate-900 sm:text-xl">
          Assignment Content
        </h2>

        <div className="mt-4 grid gap-3">
          {assignment.question && (
            <ContentBlock title="Instructions">
              <p className="whitespace-pre-line text-xs leading-6 text-slate-700 sm:text-sm sm:leading-7">
                {assignment.question}
              </p>
            </ContentBlock>
          )}

          {assignment.attachmentUrl && isImageFile(assignment.attachmentUrl) && (
            <ContentBlock title="Image Attachment">
              <a
                href={assignment.attachmentUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex bg-emerald-700 px-3 py-2 text-xs font-semibold text-white transition hover:bg-emerald-800 sm:px-4 sm:text-sm"
              >
                View Image
              </a>
            </ContentBlock>
          )}

          {assignment.attachmentUrl && isPdfFile(assignment.attachmentUrl) && (
            <ContentBlock title="PDF Attachment">
              <a
                href={assignment.attachmentUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex bg-emerald-700 px-3 py-2 text-xs font-semibold text-white transition hover:bg-emerald-800 sm:px-4 sm:text-sm"
              >
                Open PDF
              </a>
            </ContentBlock>
          )}

          {assignment.attachmentUrl &&
            !isImageFile(assignment.attachmentUrl) &&
            !isPdfFile(assignment.attachmentUrl) && (
              <ContentBlock title="Attachment">
                <a
                  href={assignment.attachmentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex bg-emerald-700 px-3 py-2 text-xs font-semibold text-white transition hover:bg-emerald-800 sm:px-4 sm:text-sm"
                >
                  Open File
                </a>
              </ContentBlock>
            )}

          {assignment.linkUrl && (
            <ContentBlock title="Assignment Link">
              <a
                href={assignment.linkUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex bg-emerald-700 px-3 py-2 text-xs font-semibold text-white transition hover:bg-emerald-800 sm:px-4 sm:text-sm"
              >
                {assignment.linkLabel || "Open Link"}
              </a>
            </ContentBlock>
          )}

          <div className="grid grid-cols-2 gap-2.5 xl:grid-cols-4">
            <MiniCard
              label="Status"
              value={assignment.isPublished ? "Published" : "Unpublished"}
              soft={
                assignment.isPublished
                  ? "bg-emerald-50 ring-emerald-100"
                  : "bg-slate-50 ring-slate-200"
              }
              valueClass={
                assignment.isPublished ? "text-emerald-700" : "text-slate-900"
              }
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
              value={
                assignment.dueDate
                  ? formatDateTime(assignment.dueDate)
                  : "No deadline"
              }
            />
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <section
          id="seen-students"
          className="border border-emerald-100 bg-white p-4 shadow-sm"
        >
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-bold text-slate-900 sm:text-xl">
              Seen Students
            </h2>
            <span className="rounded-full bg-emerald-50 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-emerald-700">
              {seenStudentsAll.length}
            </span>
          </div>

          <div className="mt-4 space-y-2.5">
            {seenStudents.length > 0 ? (
              seenStudents.map((student) => (
                <div
                  key={student.id}
                  className="border border-emerald-100 bg-emerald-50/70 p-3"
                >
                  <p className="text-sm font-semibold text-slate-900">
                    {student.user.name}
                  </p>
                  <p className="mt-1 text-xs text-slate-600 sm:text-sm">
                    {student.user.email}
                  </p>
                  <p className="mt-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-emerald-700">
                    Seen at:{" "}
                    {student.seenAt ? formatDateTime(student.seenAt) : "Viewed"}
                  </p>
                </div>
              ))
            ) : (
              <EmptyList text="No student has opened this assignment yet." />
            )}
          </div>

          <PaginationBlock
            page={currentSeenPage}
            totalPages={totalSeenPages}
            prevHref={
              currentSeenPage > 1
                ? buildDetailsUrl({
                    id: assignment.id,
                    seenPage: currentSeenPage - 1,
                    unreadPage: currentUnreadPage,
                    perPage,
                  }) + "#seen-students"
                : undefined
            }
            nextHref={
              currentSeenPage < totalSeenPages
                ? buildDetailsUrl({
                    id: assignment.id,
                    seenPage: currentSeenPage + 1,
                    unreadPage: currentUnreadPage,
                    perPage,
                  }) + "#seen-students"
                : undefined
            }
            perPage={perPage}
            id={assignment.id}
            seenPage={1}
            unreadPage={currentUnreadPage}
            anchor="seen-students"
          />
        </section>

        <section
          id="unread-students"
          className="border border-red-100 bg-white p-4 shadow-sm"
        >
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-bold text-slate-900 sm:text-xl">
              Unread Students
            </h2>
            <span className="rounded-full bg-red-50 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-red-700">
              {unreadStudentsAll.length}
            </span>
          </div>

          <div className="mt-4 space-y-2.5">
            {unreadStudents.length > 0 ? (
              unreadStudents.map((student) => (
                <div
                  key={student.id}
                  className="border border-red-100 bg-red-50/70 p-3"
                >
                  <p className="text-sm font-semibold text-slate-900">
                    {student.user.name}
                  </p>
                  <p className="mt-1 text-xs text-slate-600 sm:text-sm">
                    {student.user.email}
                  </p>
                  <p className="mt-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-red-700">
                    Not yet viewed
                  </p>
                </div>
              ))
            ) : (
              <EmptyList text="All students in this track have opened this assignment." />
            )}
          </div>

          <PaginationBlock
            page={currentUnreadPage}
            totalPages={totalUnreadPages}
            prevHref={
              currentUnreadPage > 1
                ? buildDetailsUrl({
                    id: assignment.id,
                    seenPage: currentSeenPage,
                    unreadPage: currentUnreadPage - 1,
                    perPage,
                  }) + "#unread-students"
                : undefined
            }
            nextHref={
              currentUnreadPage < totalUnreadPages
                ? buildDetailsUrl({
                    id: assignment.id,
                    seenPage: currentSeenPage,
                    unreadPage: currentUnreadPage + 1,
                    perPage,
                  }) + "#unread-students"
                : undefined
            }
            perPage={perPage}
            id={assignment.id}
            seenPage={currentSeenPage}
            unreadPage={1}
            anchor="unread-students"
          />
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
    <div className="border border-slate-200 bg-slate-50 p-4">
      <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500 sm:text-xs">
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
    <div className={`p-3 ring-1 ${soft}`}>
      <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-slate-500 sm:text-xs">
        {label}
      </p>
      <p className={`mt-1.5 text-sm font-bold sm:text-base ${valueClass}`}>
        {value}
      </p>
    </div>
  );
}

function EmptyList({ text }: { text: string }) {
  return (
    <div className="border border-dashed border-slate-300 bg-slate-50 p-4 text-xs text-slate-600 sm:text-sm">
      {text}
    </div>
  );
}

function PaginationBlock({
  page,
  totalPages,
  prevHref,
  nextHref,
  perPage,
  id,
  seenPage,
  unreadPage,
  anchor,
}: {
  page: number;
  totalPages: number;
  prevHref?: string;
  nextHref?: string;
  perPage: number;
  id: string;
  seenPage: number;
  unreadPage: number;
  anchor: string;
}) {
  return (
    <div className="mt-4 border border-slate-200 bg-slate-50 p-3">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          {prevHref ? (
            <a
              href={prevHref}
              className="border border-emerald-200 bg-white px-3 py-2 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-50 sm:text-sm"
            >
              ← Prev
            </a>
          ) : (
            <span className="border border-slate-200 bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-400 sm:text-sm">
              ← Prev
            </span>
          )}

          {nextHref ? (
            <a
              href={nextHref}
              className="border border-emerald-200 bg-white px-3 py-2 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-50 sm:text-sm"
            >
              Next →
            </a>
          ) : (
            <span className="border border-slate-200 bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-400 sm:text-sm">
              Next →
            </span>
          )}

          <p className="text-xs font-semibold text-slate-900 sm:text-sm">
            Page {page} of {totalPages}
          </p>
        </div>

        <form
          action={`/admin/assignments/${id}#${anchor}`}
          className="flex flex-wrap items-center gap-2"
        >
          <input type="hidden" name="seenPage" value={seenPage} />
          <input type="hidden" name="unreadPage" value={unreadPage} />

          <label
            htmlFor={`${anchor}-perPage`}
            className="text-xs font-semibold text-slate-900 sm:text-sm"
          >
            Per page:
          </label>

          <select
            id={`${anchor}-perPage`}
            name="perPage"
            defaultValue={String(perPage)}
            className="border border-emerald-200 bg-white px-3 py-2 text-xs font-semibold text-slate-900 outline-none transition focus:border-emerald-500 sm:text-sm"
          >
            {PER_PAGE_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>

          <button
            type="submit"
            className="bg-emerald-700 px-3 py-2 text-xs font-semibold text-white transition hover:bg-emerald-800 sm:text-sm"
          >
            Apply
          </button>
        </form>
      </div>
    </div>
  );
}

function formatDateTime(date: Date) {
  return new Intl.DateTimeFormat("en-NG", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(date));
}