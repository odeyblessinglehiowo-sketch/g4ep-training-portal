import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  deleteAssignment,
  toggleAssignmentPublish,
} from "@/app/teacher/assignments/actions";

export const dynamic = "force-dynamic";

function isPdfFile(url?: string | null) {
  if (!url) return false;
  return url.toLowerCase().includes(".pdf");
}

function isImageFile(url?: string | null) {
  if (!url) return false;
  const lower = url.toLowerCase();
  return (
    lower.includes(".jpg") ||
    lower.includes(".jpeg") ||
    lower.includes(".png") ||
    lower.includes(".webp") ||
    lower.includes(".gif") ||
    lower.includes("/image/upload/")
  );
}

export default async function AdminAssignmentDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await requireRole("ADMIN");

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
  });

  const seenMap = new Map(
    assignment.views
      .filter((view) => view.seenAt !== null)
      .map((view) => [view.studentId, view])
  );

  const seenStudents = allStudents
    .filter((student) => seenMap.has(student.id))
    .map((student) => ({
      ...student,
      seenAt: seenMap.get(student.id)!.seenAt,
    }));

  const unreadStudents = allStudents.filter(
    (student) => !seenMap.has(student.id)
  );

  return (
    <main className="space-y-6">
      <section className="rounded-[2rem] bg-gradient-to-r from-emerald-900 via-green-700 to-lime-500 p-6 text-white">
        <h1 className="text-3xl font-bold">{assignment.title}</h1>
      </section>

      {/* CONTENT */}
      <section className="rounded-2xl bg-white p-6 shadow">
        {assignment.question && (
          <ContentBlock title="Instructions">
            <p className="whitespace-pre-line">{assignment.question}</p>
          </ContentBlock>
        )}

        {/* IMAGE */}
        {assignment.attachmentUrl &&
          isImageFile(assignment.attachmentUrl) && (
            <ContentBlock title="Image">
              <img
                src={assignment.attachmentUrl}
                className="max-h-[400px] w-full object-contain"
              />
            </ContentBlock>
          )}

        {/* PDF / FILE */}
        {assignment.attachmentUrl &&
          !isImageFile(assignment.attachmentUrl) && (
            <ContentBlock
              title={isPdfFile(assignment.attachmentUrl)
                ? "PDF File"
                : "Attachment"}
            >
              <a
                href={assignment.attachmentUrl}
                target="_blank"
                className="bg-green-700 text-white px-4 py-2 rounded"
              >
                {isPdfFile(assignment.attachmentUrl)
                  ? "Open PDF"
                  : "Open File"}
              </a>
            </ContentBlock>
          )}

        {/* LINK */}
        {assignment.linkUrl && (
          <ContentBlock title="Link">
            <a
              href={assignment.linkUrl}
              target="_blank"
              className="bg-green-700 text-white px-4 py-2 rounded"
            >
              {assignment.linkLabel || "Open Link"}
            </a>
          </ContentBlock>
        )}
      </section>

      {/* SEEN / UNREAD */}
      <section className="grid grid-cols-2 gap-6">
        <StudentList title="Seen Students" students={seenStudents} />
        <StudentList title="Unread Students" students={unreadStudents} />
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
    <div className="mt-4">
      <p className="font-semibold mb-2">{title}</p>
      {children}
    </div>
  );
}

function StudentList({
  title,
  students,
}: {
  title: string;
  students: any[];
}) {
  return (
    <div className="bg-white p-4 rounded shadow">
      <h2 className="font-bold">{title}</h2>

      {students.length > 0 ? (
        students.map((student) => (
          <div key={student.id} className="mt-3">
            <p>{student.user.name}</p>
            <p className="text-sm text-gray-500">
              {student.user.email}
            </p>
          </div>
        ))
      ) : (
        <p className="text-sm text-gray-500 mt-3">
          No students here
        </p>
      )}
    </div>
  );
}