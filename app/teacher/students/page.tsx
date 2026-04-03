import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { getStudentAttendanceMetrics } from "@/lib/student-progress";

export const dynamic = "force-dynamic";

const PER_PAGE_OPTIONS = [3, 10, 25, 50, 100];

function buildTeacherStudentsUrl(params: {
  page?: number;
  perPage?: number;
}) {
  const search = new URLSearchParams();

  if (params.page && params.page > 1) {
    search.set("page", String(params.page));
  }

  if (params.perPage) {
    search.set("perPage", String(params.perPage));
  }

  const query = search.toString();
  return query ? `/teacher/students?${query}` : "/teacher/students";
}

export default async function TeacherStudentsPage({
  searchParams,
}: {
  searchParams?: Promise<{
    page?: string;
    perPage?: string;
  }>;
}) {
  const currentUser = await requireRole("TEACHER");

  const params = (await searchParams) ?? {};
  const rawPage = Number(params.page ?? "1");
  const rawPerPage = Number(params.perPage ?? "3");

  const perPage = PER_PAGE_OPTIONS.includes(rawPerPage) ? rawPerPage : 3;
  const page = Number.isFinite(rawPage) && rawPage > 0 ? rawPage : 1;

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

  const totalStudentsCount = await db.student.count({
    where: {
      track: teacher.track,
    },
  });

  const totalPages = Math.max(1, Math.ceil(totalStudentsCount / perPage));
  const currentPage = Math.min(page, totalPages);
  const skip = (currentPage - 1) * perPage;

  const students = await db.student.findMany({
    where: {
      track: teacher.track,
    },
    orderBy: {
      createdAt: "desc",
    },
    skip,
    take: perPage,
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

  const allStudents = await db.student.findMany({
    where: {
      track: teacher.track,
    },
    include: {
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

  const allStudentMetrics = await Promise.all(
    allStudents.map(async (student) => {
      const metrics = await getStudentAttendanceMetrics(student.id);

      return {
        ...student,
        metrics,
      };
    })
  );

  const totalStudents = allStudentMetrics.length;
  const totalSubmissions = allStudentMetrics.reduce(
    (sum, student) => sum + student.submissions.length,
    0
  );
  const issuedCertificates = allStudentMetrics.filter(
    (student) => student.certificates[0]?.status === "ISSUED"
  ).length;
  const averageAttendance =
    allStudentMetrics.length > 0
      ? Math.round(
          allStudentMetrics.reduce(
            (sum, student) => sum + student.metrics.attendancePercentage,
            0
          ) / allStudentMetrics.length
        )
      : 0;

  const hasPreviousPage = currentPage > 1;
  const hasNextPage = currentPage < totalPages;

  return (
    <main className="space-y-4">
      <section className="overflow-hidden border border-emerald-200 bg-gradient-to-r from-emerald-950 via-emerald-700 to-lime-500 px-4 py-4 text-white shadow-[0_18px_45px_-22px_rgba(16,185,129,0.55)] sm:px-5">
        <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-emerald-100/90">
          Students
        </p>

        <h1 className="mt-1.5 text-xl font-bold sm:text-2xl">
          My Track Students
        </h1>

        <p className="mt-2 text-xs text-emerald-50/90 sm:text-sm">
          Monitor students in your track and review their activity from one central workspace.
        </p>
      </section>

      <section className="grid grid-cols-2 gap-2.5 xl:grid-cols-4">
        <StatCard
          label="Total Students"
          value={totalStudents}
          note="Students in your track"
          soft="from-emerald-50 to-white"
          border="border-emerald-100"
          line="from-emerald-600 to-green-500"
          valueColor="text-emerald-800"
        />
        <StatCard
          label="Submissions"
          value={totalSubmissions}
          note="Student project records"
          soft="from-lime-50 to-white"
          border="border-lime-100"
          line="from-lime-500 to-emerald-500"
          valueColor="text-lime-700"
        />
        <StatCard
          label="Certificates Issued"
          value={issuedCertificates}
          note="Students already issued"
          soft="from-green-50 to-white"
          border="border-green-100"
          line="from-green-600 to-emerald-600"
          valueColor="text-green-700"
        />
        <StatCard
          label="Avg. Attendance"
          value={`${averageAttendance}%`}
          note="Overall track attendance"
          soft="from-emerald-50 to-lime-50"
          border="border-emerald-100"
          line="from-emerald-700 to-lime-500"
          valueColor="text-emerald-800"
        />
      </section>

      <section className="space-y-3">
        {enrichedStudents.length > 0 ? (
          enrichedStudents.map((student) => {
            const latestCertificate = student.certificates[0];

            return (
              <article
                key={student.id}
                className="border border-emerald-100 bg-white p-4 shadow-sm transition hover:shadow-md"
              >
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base font-bold text-slate-900 sm:text-lg">
                        {student.user.name}
                      </h3>

                      <span className="rounded-full bg-green-100 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-green-700">
                        {student.user.role}
                      </span>
                    </div>

                    <div className="mt-3 grid gap-1.5 text-[11px] text-slate-600 sm:grid-cols-2 sm:text-xs">
                      <p className="break-all">
                        <span className="font-semibold text-slate-700">Email:</span>{" "}
                        {student.user.email}
                      </p>
                      <p>
                        <span className="font-semibold text-slate-700">Track:</span>{" "}
                        {student.track}
                      </p>
                      <p>
                        <span className="font-semibold text-slate-700">Joined:</span>{" "}
                        {new Date(student.createdAt).toLocaleDateString()}
                      </p>
                      <p>
                        <span className="font-semibold text-slate-700">
                          Certificate ID:
                        </span>{" "}
                        {latestCertificate?.certificateId ?? "Not Assigned"}
                      </p>
                    </div>
                  </div>

                  <div className="border border-emerald-100 bg-emerald-50 px-3 py-2.5 text-center">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-emerald-700">
                      Attendance
                    </p>
                    <p className="mt-1 text-sm font-bold text-slate-900">
                      {student.metrics.attendancePercentage}%
                    </p>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2.5 xl:grid-cols-5">
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
          <div className="border border-emerald-100 bg-white p-4 shadow-sm">
            <p className="text-sm text-slate-600">
              No students found for this track yet.
            </p>
          </div>
        )}
      </section>

      <section className="border border-emerald-100 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {hasPreviousPage ? (
              <a
                href={buildTeacherStudentsUrl({
                  page: currentPage - 1,
                  perPage,
                })}
                className="border border-emerald-200 bg-white px-4 py-2.5 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-50"
              >
                ← Prev
              </a>
            ) : (
              <span className="border border-slate-200 bg-slate-100 px-4 py-2.5 text-sm font-semibold text-slate-400">
                ← Prev
              </span>
            )}

            {hasNextPage ? (
              <a
                href={buildTeacherStudentsUrl({
                  page: currentPage + 1,
                  perPage,
                })}
                className="border border-emerald-200 bg-white px-4 py-2.5 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-50"
              >
                Next →
              </a>
            ) : (
              <span className="border border-slate-200 bg-slate-100 px-4 py-2.5 text-sm font-semibold text-slate-400">
                Next →
              </span>
            )}

            <p className="text-sm font-semibold text-slate-900">
              Page: <span className="ml-1">{currentPage}</span>
            </p>
          </div>

          <form className="flex flex-wrap items-center gap-2 sm:gap-3">
            <input type="hidden" name="page" value="1" />

            <label
              htmlFor="perPage"
              className="text-sm font-semibold text-slate-900"
            >
              Per page:
            </label>

            <select
              id="perPage"
              name="perPage"
              defaultValue={String(perPage)}
              className="border border-emerald-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-900 outline-none transition focus:border-emerald-500"
            >
              {PER_PAGE_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>

            <button
              type="submit"
              className="bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-800"
            >
              Apply
            </button>
          </form>
        </div>

        <p className="mt-3 text-sm font-semibold text-slate-800">
          Total results: {totalStudentsCount} • Page {currentPage} of {totalPages}
        </p>
      </section>
    </main>
  );
}

function StatCard({
  label,
  value,
  note,
  soft,
  border,
  line,
  valueColor,
}: {
  label: string;
  value: string | number;
  note: string;
  soft: string;
  border: string;
  line: string;
  valueColor: string;
}) {
  return (
    <div
      className={`border bg-gradient-to-br ${soft} ${border} p-3 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md`}
    >
      <div className={`h-1.5 w-16 bg-gradient-to-r ${line}`} />

      <p className="mt-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500 sm:text-[11px]">
        {label}
      </p>

      <h2 className={`mt-1 text-base font-bold sm:text-lg ${valueColor}`}>
        {value}
      </h2>

      <p className="mt-1 text-[10px] leading-4 text-slate-600 sm:text-[11px]">
        {note}
      </p>
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