import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { getStudentAttendanceMetrics } from "@/lib/student-progress";
import { issueCertificate } from "./actions";

export const dynamic = "force-dynamic";

const PER_PAGE_OPTIONS = [3, 10, 25, 50, 100];

function buildCertificatesUrl(params: {
  q?: string;
  track?: string;
  status?: string;
  page?: number;
  perPage?: number;
}) {
  const search = new URLSearchParams();

  if (params.q && params.q.trim()) search.set("q", params.q.trim());
  if (params.track && params.track !== "ALL") search.set("track", params.track);
  if (params.status && params.status !== "ALL") search.set("status", params.status);
  if (params.page && params.page > 1) search.set("page", String(params.page));
  if (params.perPage) search.set("perPage", String(params.perPage));

  const query = search.toString();
  return query ? `/admin/certificates?${query}` : "/admin/certificates";
}

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
    page?: string;
    perPage?: string;
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

  const rawPage = Number(params.page ?? "1");
  const rawPerPage = Number(params.perPage ?? "3");

  const perPage = PER_PAGE_OPTIONS.includes(rawPerPage) ? rawPerPage : 3;
  const page = Number.isFinite(rawPage) && rawPage > 0 ? rawPage : 1;

  const trackRows = await db.student.findMany({
    select: {
      track: true,
    },
    distinct: ["track"],
  });

  const trackOptions = trackRows.map((row) => row.track).sort();

  const whereClause = {
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
                      mode: "insensitive" as const,
                    },
                  },
                },
              },
              {
                student: {
                  user: {
                    email: {
                      contains: q,
                      mode: "insensitive" as const,
                    },
                  },
                },
              },
              {
                certificateId: {
                  contains: q,
                  mode: "insensitive" as const,
                },
              },
            ],
          }
        : {},
    ],
  };

  const totalFilteredCertificates = await db.certificate.count({
    where: whereClause,
  });

  const totalPages = Math.max(1, Math.ceil(totalFilteredCertificates / perPage));
  const currentPage = Math.min(page, totalPages);
  const skip = (currentPage - 1) * perPage;

  const certificates = await db.certificate.findMany({
    where: whereClause,
    orderBy: {
      createdAt: "desc",
    },
    skip,
    take: perPage,
    include: {
      student: {
        include: {
          user: true,
        },
      },
    },
  });

  const allFilteredCertificates = await db.certificate.findMany({
    where: whereClause,
    include: {
      student: true,
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

  const totalCertificates = allFilteredCertificates.length;
  const pendingCertificates = allFilteredCertificates.filter(
    (certificate) => certificate.status === "PENDING"
  ).length;
  const issuedCertificates = allFilteredCertificates.filter(
    (certificate) => certificate.status === "ISSUED"
  ).length;

  const hasPreviousPage = currentPage > 1;
  const hasNextPage = currentPage < totalPages;

  return (
    <main className="space-y-4">
      <section className="overflow-hidden border border-emerald-200 bg-gradient-to-r from-emerald-950 via-emerald-700 to-lime-500 px-4 py-4 text-white shadow-[0_18px_45px_-22px_rgba(16,185,129,0.55)] sm:px-5">
        <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-emerald-100/90">
          Certificates
        </p>

        <h1 className="mt-1.5 text-xl font-bold sm:text-2xl">
          Issue Certificates
        </h1>

        <p className="mt-2 text-xs text-emerald-50/90 sm:text-sm">
          Review certificate records and issue certificates from one central workspace.
        </p>
      </section>

      <section className="grid grid-cols-2 gap-2.5 xl:grid-cols-4">
        <StatCard
          label="Records Found"
          value={totalCertificates}
          note="Filtered certificate records"
          soft="from-emerald-50 to-white"
          border="border-emerald-100"
          line="from-emerald-600 to-green-500"
          valueColor="text-emerald-800"
        />
        <StatCard
          label="Pending"
          value={pendingCertificates}
          note="Awaiting issuance"
          soft="from-yellow-50 to-white"
          border="border-yellow-100"
          line="from-yellow-500 to-amber-500"
          valueColor="text-yellow-700"
        />
        <StatCard
          label="Issued"
          value={issuedCertificates}
          note="Already active"
          soft="from-green-50 to-white"
          border="border-green-100"
          line="from-green-600 to-emerald-600"
          valueColor="text-green-700"
        />
        <StatCard
          label="Tracks"
          value={trackOptions.length}
          note="Available training tracks"
          soft="from-lime-50 to-white"
          border="border-lime-100"
          line="from-lime-500 to-emerald-500"
          valueColor="text-lime-700"
        />
      </section>

      {error && (
        <section className="border border-red-200 bg-red-50 p-4 shadow-sm">
          <p className="text-sm font-bold text-red-800">
            Action could not be completed
          </p>
          <p className="mt-1 text-sm text-slate-700">{error}</p>
        </section>
      )}

      {success === "issued" && successName && (
        <section className="border border-green-200 bg-green-50 p-4 shadow-sm">
          <p className="text-sm font-bold text-green-800">
            Certificate issued successfully
          </p>
          <p className="mt-1 text-sm text-slate-700">
            {successName}&apos;s certificate is now active and available.
          </p>
        </section>
      )}

      <section className="border border-emerald-100 bg-white p-4 shadow-sm">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-emerald-700">
            Search & Filters
          </p>
          <h2 className="mt-1 text-lg font-bold text-slate-900">
            Filter Certificates
          </h2>
        </div>

        <p className="mt-1.5 text-xs text-slate-600 sm:text-sm">
          Search by name, email, or certificate ID and filter by track and status.
        </p>

        <form className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <input
            name="q"
            type="text"
            defaultValue={q}
            placeholder="Search name, email, or certificate ID"
            className="border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-green-600"
          />

          <select
            name="track"
            defaultValue={track}
            className="border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-green-600"
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
            className="border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-green-600"
          >
            <option value="ALL">All Statuses</option>
            <option value="PENDING">Pending</option>
            <option value="ISSUED">Issued</option>
          </select>

          <input type="hidden" name="perPage" value={perPage} />

          <div className="grid grid-cols-2 gap-2">
            <button
              type="submit"
              className="bg-green-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-green-800"
            >
              Apply
            </button>

            <a
              href="/admin/certificates"
              className="bg-slate-200 px-4 py-2.5 text-center text-sm font-semibold text-slate-800 transition hover:bg-slate-300"
            >
              Reset
            </a>
          </div>
        </form>
      </section>

      <section className="space-y-3">
        {enrichedCertificates.length > 0 ? (
          enrichedCertificates.map((certificate) => (
            <article
              key={certificate.id}
              className="border border-emerald-100 bg-white p-4 shadow-sm transition hover:shadow-md"
            >
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-base font-bold text-slate-900 sm:text-lg">
                      {certificate.student.user.name}
                    </h3>

                    <span
                      className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] ${
                        certificate.status === "ISSUED"
                          ? "bg-green-100 text-green-700"
                          : "bg-yellow-100 text-yellow-700"
                      }`}
                    >
                      {certificate.status}
                    </span>
                  </div>

                  <div className="mt-3 grid gap-1.5 text-[11px] text-slate-600 sm:grid-cols-2 sm:text-xs">
                    <p className="break-all">
                      <span className="font-semibold text-slate-700">Email:</span>{" "}
                      {certificate.student.user.email}
                    </p>
                    <p>
                      <span className="font-semibold text-slate-700">Track:</span>{" "}
                      {certificate.student.track}
                    </p>
                    <p>
                      <span className="font-semibold text-slate-700">
                        Certificate ID:
                      </span>{" "}
                      {certificate.certificateId ?? "Not assigned"}
                    </p>
                    <p>
                      <span className="font-semibold text-slate-700">Issued:</span>{" "}
                      {certificate.issuedAt
                        ? new Date(certificate.issuedAt).toLocaleDateString()
                        : "Not issued yet"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2.5 xl:grid-cols-4">
                <MiniCard label="Present" value={certificate.metrics.presentCount} />
                <MiniCard label="Absent" value={certificate.metrics.absentCount} />
                <MiniCard label="Sessions" value={certificate.metrics.totalSessions} />
                <MiniCard
                  label="Attendance %"
                  value={`${certificate.metrics.attendancePercentage}%`}
                  soft="bg-green-50 ring-green-100"
                  valueClass="text-green-700"
                />
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
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
                    <input type="hidden" name="page" value={currentPage} />
                    <input type="hidden" name="perPage" value={perPage} />

                    <button
                      type="submit"
                      className="bg-green-700 px-3 py-2 text-xs font-semibold text-white transition hover:bg-green-800 sm:px-4 sm:text-sm"
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
                    className="inline-block bg-slate-900 px-3 py-2 text-xs font-semibold text-white transition hover:bg-slate-800 sm:px-4 sm:text-sm"
                  >
                    Open Verification Page
                  </a>
                )}
              </div>
            </article>
          ))
        ) : (
          <div className="border border-emerald-100 bg-white p-4 shadow-sm">
            <p className="text-sm text-slate-600">
              No certificate records matched your filters.
            </p>
          </div>
        )}
      </section>

      <section className="border border-emerald-100 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {hasPreviousPage ? (
              <a
                href={buildCertificatesUrl({
                  q,
                  track,
                  status,
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
                href={buildCertificatesUrl({
                  q,
                  track,
                  status,
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
            <input type="hidden" name="q" value={q} />
            <input type="hidden" name="track" value={track} />
            <input type="hidden" name="status" value={status} />
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
          Total results: {totalFilteredCertificates} • Page {currentPage} of {totalPages}
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