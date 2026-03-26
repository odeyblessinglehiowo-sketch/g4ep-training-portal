import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { getStudentAttendanceMetrics } from "@/lib/student-progress";

export const dynamic = "force-dynamic";

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

  const certificateStatus = certificate?.status ?? "NO RECORD";

  return (
    <main className="space-y-6">
      <section className="overflow-hidden rounded-[2rem] bg-gradient-to-r from-emerald-800 via-green-700 to-lime-500 p-6 text-white shadow-lg shadow-emerald-200/50 sm:p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-50/90">
          Certificate
        </p>

        <h1 className="mt-3 text-3xl font-bold sm:text-4xl">
          Certificate Status
        </h1>

        <p className="mt-4 max-w-3xl text-sm leading-7 text-emerald-50/90 sm:text-base">
          Review your attendance performance, track your certificate status,
          and access your certificate preview and download once it has been issued.
        </p>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Present"
          value={metrics.presentCount}
          tone="bg-emerald-50"
          valueClass="text-emerald-700"
        />

        <StatCard
          label="Absent"
          value={metrics.absentCount}
          tone="bg-red-50"
          valueClass="text-red-600"
        />

        <StatCard
          label="Sessions"
          value={metrics.totalSessions}
          tone="bg-white"
          valueClass="text-slate-900"
        />

        <StatCard
          label="Attendance %"
          value={`${metrics.attendancePercentage}%`}
          tone="bg-lime-50"
          valueClass="text-lime-700"
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <section className="rounded-[1.75rem] border border-emerald-100 bg-white p-6 shadow-sm">
          {certificate ? (
            <>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.16em] text-emerald-700">
                    Certificate Record
                  </p>
                  <h2 className="mt-2 text-2xl font-bold text-slate-900">
                    Certificate of Completion
                  </h2>
                </div>

                <span
                  className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] ${
                    certificate.status === "ISSUED"
                      ? "bg-green-100 text-green-700"
                      : "bg-yellow-100 text-yellow-700"
                  }`}
                >
                  {certificate.status}
                </span>
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
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
                className={`mt-6 rounded-[1.5rem] p-5 ring-1 ${
                  certificate.status === "ISSUED"
                    ? "bg-green-50 ring-green-100"
                    : "bg-yellow-50 ring-yellow-100"
                }`}
              >
                <p className="text-sm font-semibold text-slate-800">
                  Certificate Update
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {certificate.status === "ISSUED"
                    ? "Your certificate has been issued and is now ready for preview and download."
                    : "Your certificate record already exists, but it has not been issued yet. Keep checking back after your review is complete."}
                </p>
              </div>

              {certificate.status === "ISSUED" && (
                <div className="mt-6 flex flex-wrap gap-3">
                  <a
                    href="/student/certificate/view"
                    className="inline-block rounded-xl bg-green-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-green-800"
                  >
                    View Certificate Preview
                  </a>

                  <a
                    href="/student/certificate/download"
                    className="inline-block rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                  >
                    Download PDF
                  </a>
                </div>
              )}
            </>
          ) : (
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-emerald-700">
                Certificate Record
              </p>

              <h2 className="mt-2 text-2xl font-bold text-slate-900">
                No Certificate Yet
              </h2>

              <div className="mt-6 rounded-[1.5rem] bg-slate-50 p-5 ring-1 ring-slate-200">
                <p className="text-sm leading-6 text-slate-600">
                  No certificate record has been created for your account yet.
                  Once the training review process is completed, your certificate status will appear here.
                </p>
              </div>
            </div>
          )}
        </section>

        <section className="space-y-6">
          <div className="rounded-[1.75rem] border border-emerald-100 bg-white p-6 shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-emerald-700">
              Attendance Summary
            </p>

            <div className="mt-5 space-y-4">
              <SummaryRow label="Present Sessions" value={`${metrics.presentCount}`} />
              <SummaryRow label="Absent Sessions" value={`${metrics.absentCount}`} />
              <SummaryRow label="Total Sessions" value={`${metrics.totalSessions}`} />
              <SummaryRow
                label="Attendance Rate"
                value={`${metrics.attendancePercentage}%`}
              />
            </div>
          </div>

          <div className="rounded-[1.75rem] border border-emerald-100 bg-gradient-to-br from-emerald-600 via-green-600 to-lime-500 p-6 text-white shadow-md">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-emerald-50/90">
              Current Standing
            </p>

            <div className="mt-5 space-y-3">
              <StatusNote
                title="Certificate Status"
                value={certificateStatus}
              />
              <StatusNote
                title="Track"
                value={student.track}
              />
              <StatusNote
                title="Attendance"
                value={`${metrics.attendancePercentage}%`}
              />
            </div>
          </div>
        </section>
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

function InfoCard({
  label,
  value,
}: {
  label: string;
  value?: string | null;
}) {
  return (
    <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className="mt-2 text-base font-semibold text-slate-900">
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
    <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
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
    <div className="rounded-2xl bg-white/15 px-4 py-3 backdrop-blur">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-50/80">
        {title}
      </p>
      <p className="mt-2 text-sm font-semibold text-white">
        {value ?? "Not Available"}
      </p>
    </div>
  );
}