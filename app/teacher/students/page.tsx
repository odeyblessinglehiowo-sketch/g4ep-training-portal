import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { getStudentAttendanceMetrics } from "@/lib/student-progress";

export const dynamic = "force-dynamic";

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

  const totalStudents = enrichedStudents.length;
  const totalSubmissions = enrichedStudents.reduce(
    (sum, student) => sum + student.submissions.length,
    0
  );
  const issuedCertificates = enrichedStudents.filter(
    (student) => student.certificates[0]?.status === "ISSUED"
  ).length;
  const averageAttendance =
    enrichedStudents.length > 0
      ? Math.round(
          enrichedStudents.reduce(
            (sum, student) => sum + student.metrics.attendancePercentage,
            0
          ) / enrichedStudents.length
        )
      : 0;

  return (
    <main className="space-y-6">
      <section className="overflow-hidden rounded-[2rem] bg-gradient-to-r from-emerald-800 via-green-700 to-lime-500 p-6 text-white shadow-lg shadow-emerald-200/50 sm:p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-50/90">
          Students
        </p>

        <h1 className="mt-3 text-3xl font-bold sm:text-4xl">
          My Track Students
        </h1>

        <p className="mt-4 max-w-3xl text-sm leading-7 text-emerald-50/90 sm:text-base">
          Monitor students assigned to your track, review their submission activity,
          track attendance performance, and confirm certificate progress in one place.
        </p>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Students" value={totalStudents} />
        <StatCard
          label="Submissions"
          value={totalSubmissions}
          tone="bg-lime-50"
          valueClass="text-lime-700"
        />
        <StatCard
          label="Certificates Issued"
          value={issuedCertificates}
          tone="bg-emerald-50"
          valueClass="text-emerald-700"
        />
        <StatCard
          label="Avg. Attendance"
          value={`${averageAttendance}%`}
          tone="bg-green-50"
          valueClass="text-green-700"
        />
      </section>

      <section className="grid gap-6">
        {enrichedStudents.length > 0 ? (
          enrichedStudents.map((student) => {
            const latestCertificate = student.certificates[0];

            return (
              <article
                key={student.id}
                className="rounded-[1.75rem] border border-emerald-100 bg-white p-6 shadow-sm transition hover:shadow-md"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <h3 className="text-xl font-bold text-slate-900">
                        {student.user.name}
                      </h3>

                      <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                        {student.user.role}
                      </span>
                    </div>

                    <div className="mt-3 grid gap-2 text-sm text-slate-600 sm:grid-cols-2">
                      <p>Email: {student.user.email}</p>
                      <p>Track: {student.track}</p>
                      <p>
                        Joined: {new Date(student.createdAt).toLocaleDateString()}
                      </p>
                      <p>
                        Certificate ID: {latestCertificate?.certificateId ?? "Not Assigned"}
                      </p>
                    </div>
                  </div>

                  <div className="rounded-2xl bg-emerald-50 px-4 py-3 text-center ring-1 ring-emerald-100">
                    <p className="text-xs font-semibold uppercase tracking-[0.15em] text-emerald-700">
                      Attendance
                    </p>
                    <p className="mt-1 text-lg font-bold text-slate-900">
                      {student.metrics.attendancePercentage}%
                    </p>
                  </div>
                </div>

                <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
                  <MiniCard label="Submissions" value={student.submissions.length} />
                  <MiniCard label="Present" value={student.metrics.presentCount} />
                  <MiniCard label="Absent" value={student.metrics.absentCount} />
                  <MiniCard
                    label="Attendance %"
                    value={`${student.metrics.attendancePercentage}%`}
                    soft="bg-green-50 ring-green-100"
                    valueClass="text-green-700"
                  />
                  <MiniCard
                    label="Certificate Status"
                    value={latestCertificate?.status ?? "No Record"}
                  />
                </div>
              </article>
            );
          })
        ) : (
          <div className="rounded-[1.75rem] border border-emerald-100 bg-white p-6 shadow-sm">
            <p className="text-sm text-slate-600">
              No students found for this track yet.
            </p>
          </div>
        )}
      </section>
    </main>
  );
}

function StatCard({
  label,
  value,
  tone = "bg-white",
  valueClass = "text-slate-900",
}: {
  label: string;
  value: string | number;
  tone?: string;
  valueClass?: string;
}) {
  return (
    <div className={`rounded-[1.5rem] p-5 shadow-sm ring-1 ring-slate-200 ${tone}`}>
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className={`mt-2 text-3xl font-bold ${valueClass}`}>{value}</p>
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
  value: string | number;
  soft?: string;
  valueClass?: string;
}) {
  return (
    <div className={`rounded-2xl p-4 ring-1 ${soft}`}>
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className={`mt-2 text-2xl font-bold ${valueClass}`}>{value}</p>
    </div>
  );
}