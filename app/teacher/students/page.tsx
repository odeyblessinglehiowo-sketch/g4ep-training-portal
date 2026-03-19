import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { getStudentAttendanceMetrics } from "@/lib/student-progress";

export default async function TeacherStudentsPage() {
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

  const students = await db.student.findMany({
    where: {
      track: teacher.track,
    },
    orderBy: {
      createdAt: "desc",
    },
    include: {
      user: true,
      submissions: true,
      certificates: {
        orderBy: {
          createdAt: "desc",
        },
      },
    },
  });

  const enrichedStudents = await Promise.all(
    students.map(async (student) => {
      const metrics = await getStudentAttendanceMetrics(student.id);

      return {
        ...student,
        metrics,
      };
    })
  );

  return (
    <main className="space-y-6">
      <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-green-700">
          Students
        </p>

        <h1 className="mt-2 text-3xl font-bold text-slate-900">
          My Track Students
        </h1>

        <p className="mt-2 text-sm text-slate-600">
          Monitor students assigned to your teaching track.
        </p>
      </section>

      <section className="grid gap-6">
        {enrichedStudents.length > 0 ? (
          enrichedStudents.map((student) => {
            const latestCertificate = student.certificates[0];

            return (
              <div
                key={student.id}
                className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">
                      {student.user.name}
                    </h3>

                    <p className="mt-2 text-sm text-slate-600">
                      Email: {student.user.email}
                    </p>

                    <p className="mt-1 text-sm text-slate-600">
                      Track: {student.track}
                    </p>

                    <p className="mt-1 text-sm text-slate-600">
                      Joined: {new Date(student.createdAt).toLocaleDateString()}
                    </p>
                  </div>

                  <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                    {student.user.role}
                  </span>
                </div>

                <div className="mt-6 grid gap-4 md:grid-cols-5">
                  <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
                    <p className="text-sm font-medium text-slate-500">
                      Submissions
                    </p>
                    <p className="mt-2 text-2xl font-bold text-slate-900">
                      {student.submissions.length}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
                    <p className="text-sm font-medium text-slate-500">
                      Present
                    </p>
                    <p className="mt-2 text-2xl font-bold text-slate-900">
                      {student.metrics.presentCount}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
                    <p className="text-sm font-medium text-slate-500">
                      Absent
                    </p>
                    <p className="mt-2 text-2xl font-bold text-slate-900">
                      {student.metrics.absentCount}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-green-50 p-4 ring-1 ring-green-100">
                    <p className="text-sm font-medium text-slate-500">
                      Attendance %
                    </p>
                    <p className="mt-2 text-2xl font-bold text-green-700">
                      {student.metrics.attendancePercentage}%
                    </p>
                  </div>

                  <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
                    <p className="text-sm font-medium text-slate-500">
                      Certificate Status
                    </p>
                    <p className="mt-2 text-lg font-bold text-slate-900">
                      {latestCertificate?.status ?? "No Record"}
                    </p>
                  </div>
                </div>

                <div className="mt-4 rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
                  <p className="text-sm font-medium text-slate-500">
                    Certificate ID
                  </p>
                  <p className="mt-2 text-lg font-bold text-slate-900">
                    {latestCertificate?.certificateId ?? "Not Assigned"}
                  </p>
                </div>
              </div>
            );
          })
        ) : (
          <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <p className="text-sm text-slate-600">
              No students found for this track yet.
            </p>
          </div>
        )}
      </section>
    </main>
  );
}