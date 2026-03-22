import { requireRole } from "@/lib/auth";
export const dynamic = "force-dynamic";
import { db } from "@/lib/db";
import { getStudentAttendanceMetrics } from "@/lib/student-progress";
import { issueCertificate } from "./actions";

export default async function AdminCertificatesPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    track?: string;
    status?: string;
    success?: string;
    error?: string;
    name?: string;
  }>;
}) {
  await requireRole("ADMIN");
  const params = await searchParams;

  const q = params.q?.trim() ?? "";
  const track = params.track ?? "ALL";
  const status = params.status ?? "ALL";
  const success = params.success;
  const error = params.error;
  const successName = params.name;

  const trackRows = await db.student.findMany({
    select: {
      track: true,
    },
    distinct: ["track"],
  });

  const trackOptions = trackRows.map((row) => row.track).sort();

  const certificates = await db.certificate.findMany({
    where: {
      AND: [
        status !== "ALL"
          ? {
              status: status as "PENDING" | "ISSUED",
            }
          : {},
        track !== "ALL"
          ? {
              student: {
                track,
              },
            }
          : {},
        q
          ? {
              OR: [
                {
                  student: {
                    user: {
                      name: {
                        contains: q,
                      },
                    },
                  },
                },
                {
                  student: {
                    user: {
                      email: {
                        contains: q,
                      },
                    },
                  },
                },
                {
                  certificateId: {
                    contains: q,
                  },
                },
              ],
            }
          : {},
      ],
    },
    orderBy: {
      createdAt: "desc",
    },
    include: {
      student: {
        include: {
          user: true,
        },
      },
    },
  });

  const enrichedCertificates = await Promise.all(
    certificates.map(async (certificate) => {
      const metrics = await getStudentAttendanceMetrics(certificate.student.id);

      return {
        ...certificate,
        metrics,
      };
    })
  );

  return (
    <main className="space-y-6">
      <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-green-700">
          Certificates
        </p>

        <h1 className="mt-2 text-3xl font-bold text-slate-900">
          Issue Certificates
        </h1>

        <p className="mt-2 text-sm text-slate-600">
          Review certificate records, attendance percentage, and issue certificates manually.
        </p>
      </section>

      {error && (
        <section className="rounded-3xl border border-red-200 bg-red-50 p-5 shadow-sm ring-1 ring-red-100">
          <p className="text-base font-bold text-red-800">
            Action could not be completed
          </p>
          <p className="mt-1 text-sm text-slate-700">{error}</p>
        </section>
      )}

      {success === "issued" && successName && (
        <section className="rounded-3xl border border-green-200 bg-green-50 p-5 shadow-sm ring-1 ring-green-100">
          <p className="text-base font-bold text-green-800">
            Certificate issued successfully
          </p>
          <p className="mt-1 text-sm text-slate-700">
            {successName}&apos;s certificate is now active and available.
          </p>
        </section>
      )}

      <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <h2 className="text-xl font-bold text-slate-900">Search & Filters</h2>
        <p className="mt-1 text-sm text-slate-600">
          Search by name, email, or certificate ID. Filter by track and certificate status.
        </p>

        <form className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <input
            name="q"
            type="text"
            defaultValue={q}
            placeholder="Search name, email, or certificate ID"
            className="rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-green-600"
          />

          <select
            name="track"
            defaultValue={track}
            className="rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-green-600"
          >
            <option value="ALL">All Tracks</option>
            {trackOptions.map((trackOption) => (
              <option key={trackOption} value={trackOption}>
                {trackOption}
              </option>
            ))}
          </select>

          <select
            name="status"
            defaultValue={status}
            className="rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-green-600"
          >
            <option value="ALL">All Statuses</option>
            <option value="PENDING">Pending</option>
            <option value="ISSUED">Issued</option>
          </select>

          <div className="flex gap-3">
            <button
              type="submit"
              className="flex-1 rounded-xl bg-green-700 px-5 py-3 font-semibold text-white transition hover:bg-green-800"
            >
              Apply
            </button>

            <a
              href="/admin/certificates"
              className="flex-1 rounded-xl bg-slate-200 px-5 py-3 text-center font-semibold text-slate-800 transition hover:bg-slate-300"
            >
              Reset
            </a>
          </div>
        </form>
      </section>

      <section className="grid gap-6">
        {enrichedCertificates.length > 0 ? (
          enrichedCertificates.map((certificate) => (
            <div
              key={certificate.id}
              className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    {certificate.student.user.name}
                  </h3>

                  <p className="mt-2 text-sm text-slate-600">
                    Email: {certificate.student.user.email}
                  </p>

                  <p className="mt-1 text-sm text-slate-600">
                    Track: {certificate.student.track}
                  </p>

                  <p className="mt-1 text-sm text-slate-600">
                    Certificate ID: {certificate.certificateId ?? "Not assigned"}
                  </p>

                  <p className="mt-1 text-sm text-slate-600">
                    Issued Date:{" "}
                    {certificate.issuedAt
                      ? new Date(certificate.issuedAt).toLocaleDateString()
                      : "Not issued yet"}
                  </p>
                </div>

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

              <div className="mt-6 grid gap-4 md:grid-cols-4">
                <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
                  <p className="text-sm font-medium text-slate-500">Present</p>
                  <p className="mt-2 text-2xl font-bold text-slate-900">
                    {certificate.metrics.presentCount}
                  </p>
                </div>

                <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
                  <p className="text-sm font-medium text-slate-500">Absent</p>
                  <p className="mt-2 text-2xl font-bold text-slate-900">
                    {certificate.metrics.absentCount}
                  </p>
                </div>

                <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
                  <p className="text-sm font-medium text-slate-500">Sessions</p>
                  <p className="mt-2 text-2xl font-bold text-slate-900">
                    {certificate.metrics.totalSessions}
                  </p>
                </div>

                <div className="rounded-2xl bg-green-50 p-4 ring-1 ring-green-100">
                  <p className="text-sm font-medium text-slate-500">Attendance %</p>
                  <p className="mt-2 text-2xl font-bold text-green-700">
                    {certificate.metrics.attendancePercentage}%
                  </p>
                </div>
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                {certificate.status !== "ISSUED" && (
                  <form action={issueCertificate}>
                    <input
                      type="hidden"
                      name="studentId"
                      value={certificate.student.id}
                    />
                    <input type="hidden" name="q" value={q} />
                    <input type="hidden" name="track" value={track} />
                    <input type="hidden" name="status" value={status} />

                    <button
                      type="submit"
                      className="rounded-lg bg-green-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-green-800"
                    >
                      Issue Certificate
                    </button>
                  </form>
                )}

                {certificate.certificateId && certificate.status === "ISSUED" && (
                  <a
                    href={`/verify/${certificate.certificateId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
                  >
                    Open Verification Page
                  </a>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <p className="text-sm text-slate-600">
              No certificate records matched your filters.
            </p>
          </div>
        )}
      </section>
    </main>
  );
}