import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { getStudentAttendanceMetrics } from "@/lib/student-progress";

export default async function StudentCertificatePage() {
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

  const certificate = await db.certificate.findFirst({
    where: {
      studentId: student.id,
    },
    orderBy: {
      issuedAt: "desc",
    },
  });

  const metrics = await getStudentAttendanceMetrics(student.id);

  return (
    <main className="space-y-6">
      <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-green-700">
          Certificate
        </p>

        <h1 className="mt-2 text-3xl font-bold text-slate-900">
          Certificate Status
        </h1>

        <p className="mt-2 text-sm text-slate-600">
          Check your certificate status and review your attendance performance.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-4">
        <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <p className="text-sm font-medium text-slate-500">Present</p>
          <p className="mt-2 text-3xl font-bold text-green-700">
            {metrics.presentCount}
          </p>
        </div>

        <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <p className="text-sm font-medium text-slate-500">Absent</p>
          <p className="mt-2 text-3xl font-bold text-red-600">
            {metrics.absentCount}
          </p>
        </div>

        <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <p className="text-sm font-medium text-slate-500">Sessions</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">
            {metrics.totalSessions}
          </p>
        </div>

        <div className="rounded-3xl bg-green-50 p-5 shadow-sm ring-1 ring-green-100">
          <p className="text-sm font-medium text-slate-500">Attendance %</p>
          <p className="mt-2 text-3xl font-bold text-green-700">
            {metrics.attendancePercentage}%
          </p>
        </div>
      </section>

      <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        {certificate ? (
          <>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="text-xl font-bold text-slate-900">
                Certificate of Completion
              </h3>

              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  certificate.status === "ISSUED"
                    ? "bg-green-100 text-green-700"
                    : "bg-yellow-100 text-yellow-700"
                }`}
              >
                {certificate.status}
              </span>
            </div>

            <p className="mt-4 text-sm text-slate-600">
              Student: {studentUser.name}
            </p>

            <p className="mt-2 text-sm text-slate-600">
              Track: {student.track}
            </p>

            <p className="mt-2 text-sm text-slate-600">
              Issued Date:{" "}
              {certificate.issuedAt
                ? new Date(certificate.issuedAt).toLocaleDateString()
                : "Not issued yet"}
            </p>

            <p className="mt-2 text-sm text-slate-600">
              Certificate ID: {certificate.certificateId ?? "Not assigned"}
            </p>

            <div className="mt-6 rounded-2xl bg-green-50 p-4">
              <p className="text-sm text-slate-700">
                {certificate.status === "ISSUED"
                  ? "Your certificate has been issued and is ready for preview and download."
                  : "Your certificate record exists, but it has not been issued yet."}
              </p>
            </div>

            {certificate.status === "ISSUED" && (
              <div className="mt-6 flex flex-wrap gap-3">
                <a
                  href="/student/certificate/view"
                  className="inline-block rounded-lg bg-green-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-green-800"
                >
                  View Certificate Preview
                </a>

                <a
                  href="/student/certificate/download"
                  className="inline-block rounded-lg bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                >
                  Download PDF
                </a>
              </div>
            )}
          </>
        ) : (
          <p className="text-sm text-slate-600">
            No certificate record found yet.
          </p>
        )}
      </section>
    </main>
  );
}