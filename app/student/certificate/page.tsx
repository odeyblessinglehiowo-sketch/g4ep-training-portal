import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { getStudentAttendanceMetrics } from "@/lib/student-progress";

export const dynamic = "force-dynamic";

export default async function StudentCertificatePage() {
  const currentUser = await requireRole("STUDENT");

  const studentUser = await db.user.findUnique({
    where: { id: currentUser.userId },
    include: { student: true },
  });

  if (!studentUser || !studentUser.student) {
    throw new Error("Student profile not found.");
  }

  const student = studentUser.student;

  const certificate = await db.certificate.findFirst({
    where: { studentId: student.id },
    orderBy: { issuedAt: "desc" },
  });

  const metrics = await getStudentAttendanceMetrics(student.id);

  const certificateStatus = certificate?.status ?? "NO RECORD";

  return (
    <main className="space-y-4">
      <section className="overflow-hidden border border-emerald-200 bg-gradient-to-r from-emerald-950 via-emerald-700 to-lime-500 px-4 py-3 text-white shadow-sm">
        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-emerald-100/90">
          Certificate
        </p>

        <h1 className="mt-1 text-xl font-bold sm:text-2xl">
          Certificate Status
        </h1>

        <p className="mt-1 text-sm text-emerald-50/90">
          Review your performance and access your certificate when issued.
        </p>
      </section>

      <section className="grid grid-cols-2 gap-2.5 xl:grid-cols-4">
        <StatCard
          label="Present"
          value={metrics.presentCount}
          note="Recorded check-ins"
          soft="from-green-50 to-white"
          border="border-green-100"
          line="from-green-600 to-emerald-600"
          valueColor="text-green-700"
        />
        <StatCard
          label="Absent"
          value={metrics.absentCount}
          note="Missed sessions"
          soft="from-red-50 to-white"
          border="border-red-100"
          line="from-red-500 to-rose-500"
          valueColor="text-red-600"
        />
        <StatCard
          label="Sessions"
          value={metrics.totalSessions}
          note="Total attendance records"
          soft="from-slate-50 to-white"
          border="border-slate-200"
          line="from-slate-500 to-slate-400"
          valueColor="text-slate-900"
        />
        <StatCard
          label="Attendance %"
          value={`${metrics.attendancePercentage}%`}
          note="Current performance"
          soft="from-lime-50 to-white"
          border="border-lime-100"
          line="from-lime-500 to-emerald-500"
          valueColor="text-lime-700"
        />
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="border border-emerald-100 bg-white p-4 shadow-sm">
          {certificate ? (
            <>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-emerald-700">
                    Certificate Record
                  </p>
                  <h2 className="mt-1 text-lg font-bold text-slate-900 sm:text-xl">
                    Certificate of Completion
                  </h2>
                </div>

                <span
                  className={`px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] ${
                    certificate.status === "ISSUED"
                      ? "bg-green-100 text-green-700"
                      : "bg-yellow-100 text-yellow-700"
                  }`}
                >
                  {certificate.status}
                </span>
              </div>

              <div className="mt-4 grid gap-2.5 sm:grid-cols-2">
                <InfoCard label="Student" value={studentUser.name} />
                <InfoCard label="Track" value={student.track} />
                <InfoCard
                  label="Issued Date"
                  value={
                    certificate.issuedAt
                      ? new Date(certificate.issuedAt).toLocaleDateString()
                      : "Not issued yet"
                  }
                />
                <InfoCard
                  label="Certificate ID"
                  value={certificate.certificateId ?? "Not assigned"}
                />
              </div>

              <div
                className={`mt-4 border p-3 text-sm ${
                  certificate.status === "ISSUED"
                    ? "border-green-200 bg-green-50 text-slate-700"
                    : "border-yellow-200 bg-yellow-50 text-slate-700"
                }`}
              >
                {certificate.status === "ISSUED"
                  ? "Your certificate has been issued and is now ready for preview and download."
                  : "Your certificate record exists, but it has not been issued yet. Please check back later."}
              </div>

              {certificate.status === "ISSUED" && (
                <div className="mt-4 flex flex-wrap gap-2">
                  <a
                    href="/student/certificate/view"
                    className="bg-emerald-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-800"
                  >
                    Preview
                  </a>

                  <a
                    href="/student/certificate/download"
                    className="bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
                  >
                    Download
                  </a>
                </div>
              )}
            </>
          ) : (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-emerald-700">
                Certificate Record
              </p>

              <h2 className="mt-1 text-lg font-bold text-slate-900 sm:text-xl">
                No Certificate Yet
              </h2>

              <div className="mt-4 border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm leading-6 text-slate-600">
                  No certificate record has been created for your account yet.
                  Once the review process is completed, your certificate status will appear here.
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="border border-emerald-100 bg-white p-4 shadow-sm">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-emerald-700">
              Attendance Summary
            </p>

            <div className="mt-4 space-y-2.5">
              <SummaryRow label="Present" value={`${metrics.presentCount}`} />
              <SummaryRow label="Absent" value={`${metrics.absentCount}`} />
              <SummaryRow label="Sessions" value={`${metrics.totalSessions}`} />
              <SummaryRow
                label="Rate"
                value={`${metrics.attendancePercentage}%`}
              />
            </div>
          </div>

          <div className="border border-emerald-200 bg-gradient-to-br from-emerald-700 via-green-600 to-lime-500 p-4 text-white shadow-sm">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-emerald-50/90">
              Standing
            </p>

            <div className="mt-3 space-y-2">
              <StatusNote title="Status" value={certificateStatus} />
              <StatusNote title="Track" value={student.track} />
              <StatusNote
                title="Attendance"
                value={`${metrics.attendancePercentage}%`}
              />
            </div>
          </div>
        </div>
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

function InfoCard({
  label,
  value,
}: {
  label: string;
  value?: string | null;
}) {
  return (
    <div className="border border-emerald-100 bg-emerald-50/40 p-3">
      <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">
        {label}
      </p>
      <p className="mt-1 text-sm font-semibold text-slate-900 sm:text-base">
        {value ?? "Not Available"}
      </p>
    </div>
  );
}

function SummaryRow({
  label,
  value,
}: {
  label: string;
  value?: string | null;
}) {
  return (
    <div className="flex items-center justify-between border border-emerald-100 bg-emerald-50/40 px-3 py-3">
      <span className="text-sm font-medium text-slate-500">{label}</span>
      <span className="text-sm font-semibold text-slate-900">
        {value ?? "Not Available"}
      </span>
    </div>
  );
}

function StatusNote({
  title,
  value,
}: {
  title: string;
  value?: string | null;
}) {
  return (
    <div className="border border-white/10 bg-white/10 px-3 py-2.5">
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-emerald-50/80">
        {title}
      </p>
      <p className="mt-1 text-sm font-semibold text-white">
        {value ?? "Not Available"}
      </p>
    </div>
  );
}