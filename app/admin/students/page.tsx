import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  createStudent,
  issueCertificatesByTrack,
  issueStudentCertificate,
} from "./actions";
import { toggleUserStatus } from "../users/actions";
import { getStudentAttendanceMetrics } from "@/lib/student-progress";

export const dynamic = "force-dynamic";

const PER_PAGE_OPTIONS = [3, 10, 25, 50, 100];

function buildStudentsUrl(params: {
  q?: string;
  track?: string;
  page?: number;
  perPage?: number;
}) {
  const search = new URLSearchParams();

  if (params.q && params.q.trim()) search.set("q", params.q.trim());
  if (params.track && params.track !== "ALL") search.set("track", params.track);
  if (params.page && params.page > 1) search.set("page", String(params.page));
  if (params.perPage) search.set("perPage", String(params.perPage));

  const query = search.toString();
  return query ? `/admin/students?${query}` : "/admin/students";
}

export default async function AdminStudentsPage({
  searchParams,
}: {
  searchParams: Promise<{
    created?: string;
    email?: string;
    password?: string;
    emailSent?: string;
    success?: string;
    error?: string;
    name?: string;
    trackName?: string;
    q?: string;
    track?: string;
    page?: string;
    perPage?: string;
  }>;
}) {
  await requireRole("ADMIN");
  const params = await searchParams;

  const q = params.q?.trim() ?? "";
  const track = params.track ?? "ALL";

  const rawPage = Number(params.page ?? "1");
  const rawPerPage = Number(params.perPage ?? "3");

  const perPage = PER_PAGE_OPTIONS.includes(rawPerPage) ? rawPerPage : 3;
  const page = Number.isFinite(rawPage) && rawPage > 0 ? rawPage : 1;

  const whereClause = {
    AND: [
      track !== "ALL" ? { track } : {},
      q
        ? {
            OR: [
              {
                user: {
                  name: {
                    contains: q,
                  },
                },
              },
              {
                user: {
                  email: {
                    contains: q,
                  },
                },
              },
            ],
          }
        : {},
    ],
  };

  const totalFilteredStudents = await db.student.count({
    where: whereClause,
  });

  const totalPages = Math.max(1, Math.ceil(totalFilteredStudents / perPage));
  const currentPage = Math.min(page, totalPages);
  const skip = (currentPage - 1) * perPage;

  const students = await db.student.findMany({
    where: whereClause,
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

  const trackRows = await db.student.findMany({
    select: {
      track: true,
    },
    distinct: ["track"],
  });

  const trackOptions = trackRows.map((row) => row.track).sort();

  const enrichedStudents = await Promise.all(
    students.map(async (student) => {
      const metrics = await getStudentAttendanceMetrics(student.id);

      return {
        ...student,
        metrics,
      };
    })
  );

  const totalStudents = await db.student.count();
  const activeStudents = await db.student.count({
    where: {
      user: {
        isActive: true,
      },
    },
  });
  const issuedCertificates = await db.certificate.count({
    where: {
      status: "ISSUED",
    },
  });

  const created = params.created === "1";
  const createdEmail = params.email;
  const createdPassword = params.password;
  const emailSent = params.emailSent === "1";
  const success = params.success;
  const successName = params.name;
  const successTrackName = params.trackName;
  const error = params.error;

  const hasPreviousPage = currentPage > 1;
  const hasNextPage = currentPage < totalPages;

  return (
    <main className="space-y-4">
      <section className="overflow-hidden border border-emerald-200 bg-gradient-to-r from-emerald-950 via-emerald-700 to-lime-500 px-4 py-4 text-white shadow-[0_18px_45px_-22px_rgba(16,185,129,0.55)] sm:px-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-emerald-100/90">
              Students
            </p>

            <h1 className="mt-1.5 text-xl font-bold leading-tight sm:text-2xl">
              Manage Students
            </h1>

            <p className="mt-2 text-xs leading-5 text-emerald-50/90 sm:text-sm">
              View registered students and manage progress from one central workspace.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:w-[280px]">
            <QuickLink href="/admin/students" label="Students" />
            <QuickLink href="/admin/teachers" label="Teachers" />
            <QuickLink href="/admin/certificates" label="Certificates" />
            <QuickLink href="/admin/users" label="Users" />
          </div>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-2.5 xl:grid-cols-4">
        <StatCard
          label="Total Students"
          value={totalStudents}
          note="All registered students"
          soft="from-emerald-50 to-white"
          border="border-emerald-100"
          line="from-emerald-600 to-green-500"
          valueColor="text-emerald-800"
        />
        <StatCard
          label="Active Students"
          value={activeStudents}
          note="Currently active accounts"
          soft="from-lime-50 to-white"
          border="border-lime-100"
          line="from-lime-500 to-emerald-500"
          valueColor="text-lime-800"
        />
        <StatCard
          label="Certificates Issued"
          value={issuedCertificates}
          note="Approved certificates"
          soft="from-green-50 to-white"
          border="border-green-100"
          line="from-green-600 to-emerald-600"
          valueColor="text-green-800"
        />
        <StatCard
          label="Filtered Result"
          value={totalFilteredStudents}
          note="Students in current filter"
          soft="from-emerald-50 to-lime-50"
          border="border-emerald-100"
          line="from-emerald-700 to-lime-500"
          valueColor="text-emerald-800"
        />
      </section>

      {error && (
        <section className="border border-red-200 bg-red-50 p-4 shadow-sm">
          <h2 className="text-sm font-bold text-red-800">
            Action could not be completed
          </h2>
          <p className="mt-1.5 text-sm text-slate-700">{error}</p>
        </section>
      )}

      {created && createdEmail && createdPassword && (
        <section className="border border-green-200 bg-green-50 p-4 shadow-sm">
          <h2 className="text-sm font-bold text-green-800">
            Student created successfully
          </h2>

          <p className="mt-1.5 text-sm text-slate-700">
            Share these login details with the student.
          </p>

          {!emailSent && (
            <div className="mt-3 border border-amber-200 bg-amber-50 px-3 py-2.5">
              <p className="text-xs font-medium text-amber-800 sm:text-sm">
                Email was not sent. Copy these details manually and share them with the student.
              </p>
            </div>
          )}

          {emailSent && (
            <div className="mt-3 border border-green-200 bg-white px-3 py-2.5 ring-1 ring-green-100">
              <p className="text-xs font-medium text-green-700 sm:text-sm">
                Login details were sent successfully to the student&apos;s email.
              </p>
            </div>
          )}

          <div className="mt-3 grid gap-2.5 md:grid-cols-2">
            <div className="border border-green-100 bg-white p-3">
              <p className="text-xs font-medium text-slate-500">Email</p>
              <p className="mt-1 break-all text-sm font-semibold text-slate-900">
                {createdEmail}
              </p>
            </div>

            <div className="border border-green-100 bg-white p-3">
              <p className="text-xs font-medium text-slate-500">
                Temporary Password
              </p>
              <p className="mt-1 text-sm font-semibold text-slate-900">
                {createdPassword}
              </p>
            </div>
          </div>
        </section>
      )}

      {success === "issued" && successName && (
        <section className="border border-green-200 bg-green-50 p-4 shadow-sm">
          <h2 className="text-sm font-bold text-green-800">
            Certificate issued successfully
          </h2>
          <p className="mt-1.5 text-sm text-slate-700">
            {successName}&apos;s certificate has been issued.
          </p>
        </section>
      )}

      {success === "track-issued" && successTrackName && (
        <section className="border border-green-200 bg-green-50 p-4 shadow-sm">
          <h2 className="text-sm font-bold text-green-800">
            Track certificates issued successfully
          </h2>
          <p className="mt-1.5 text-sm text-slate-700">
            All eligible students under {successTrackName} have been processed.
          </p>
        </section>
      )}

      <section className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <section className="border border-emerald-100 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-emerald-700">
                Add Student
              </p>
              <h2 className="mt-1 text-lg font-bold text-slate-900">
                New Student Account
              </h2>
            </div>

            <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-emerald-700">
              Admin
            </span>
          </div>

          <p className="mt-1.5 text-xs text-slate-600 sm:text-sm">
            Create a student account and assign a training track.
          </p>

          <form action={createStudent} className="mt-4 grid gap-3 md:grid-cols-3">
            <input
              name="name"
              type="text"
              placeholder="Full name"
              className="border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-green-600"
            />

            <input
              name="email"
              type="email"
              placeholder="Email address"
              className="border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-green-600"
            />

            <input
              name="track"
              type="text"
              placeholder="Track e.g. Web Design"
              className="border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-green-600"
            />

            <div className="md:col-span-3">
              <button
                type="submit"
                className="bg-green-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-green-800"
              >
                Create Student
              </button>
            </div>
          </form>
        </section>

        <section className="border border-emerald-100 bg-white p-4 shadow-sm">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-emerald-700">
              Search & Filters
            </p>
            <h2 className="mt-1 text-lg font-bold text-slate-900">
              Filter Students
            </h2>
          </div>

          <p className="mt-1.5 text-xs text-slate-600 sm:text-sm">
            Search by name or email and filter by track.
          </p>

          <form className="mt-4 grid gap-3">
            <input
              name="q"
              type="text"
              defaultValue={q}
              placeholder="Search name or email"
              className="border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-green-600"
            />

            <select
              name="track"
              defaultValue={track}
              className="border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-green-600"
            >
              <option value="ALL">All Tracks</option>
              {trackOptions.map((trackOption) => (
                <option key={trackOption} value={trackOption}>
                  {trackOption}
                </option>
              ))}
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
                href="/admin/students"
                className="bg-slate-200 px-4 py-2.5 text-center text-sm font-semibold text-slate-800 transition hover:bg-slate-300"
              >
                Reset
              </a>
            </div>
          </form>

          <form action={issueCertificatesByTrack} className="mt-3">
            <input type="hidden" name="selectedTrack" value={track} />
            <input type="hidden" name="q" value={q} />
            <input type="hidden" name="track" value={track} />
            <button
              type="submit"
              disabled={track === "ALL"}
              className={`w-full px-4 py-2.5 text-sm font-semibold text-white transition ${
                track === "ALL"
                  ? "cursor-not-allowed bg-slate-400"
                  : "bg-slate-900 hover:bg-slate-800"
              }`}
            >
              Issue All in Selected Track
            </button>
          </form>
        </section>
      </section>

      <section className="space-y-2.5">
        {enrichedStudents.length > 0 ? (
          enrichedStudents.map((student) => {
            const latestCertificate = student.certificates[0];
            const isIssued = latestCertificate?.status === "ISSUED";

            return (
              <article
                key={student.id}
                className="border border-emerald-100 bg-white p-3 shadow-sm transition hover:shadow-md"
              >
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-sm font-bold text-slate-900 sm:text-base">
                        {student.user.name}
                      </h3>

                      <span className="rounded-full bg-green-100 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-green-700">
                        {student.user.role}
                      </span>

                      <span
                        className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] ${
                          student.user.isActive
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {student.user.isActive ? "Active" : "Disabled"}
                      </span>
                    </div>

                    <div className="mt-2 grid gap-1.5 text-[11px] text-slate-600 sm:grid-cols-2 sm:text-xs">
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

                  <form action={toggleUserStatus}>
                    <input type="hidden" name="userId" value={student.user.id} />
                    <button
                      type="submit"
                      className={`px-3 py-2 text-xs font-semibold ${
                        student.user.isActive
                          ? "border border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
                          : "border border-green-200 bg-green-50 text-green-700 hover:bg-green-100"
                      }`}
                    >
                      {student.user.isActive ? "Disable Account" : "Enable Account"}
                    </button>
                  </form>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2 xl:grid-cols-5">
                  <MiniCard label="Submissions" value={student.submissions.length} />
                  <MiniCard label="Present" value={student.metrics.presentCount} />
                  <MiniCard label="Absent" value={student.metrics.absentCount} />
                  <MiniCard
                    label="Attendance %"
                    value={`${student.metrics.attendancePercentage}%`}
                    soft="from-green-50 to-white border-green-100"
                    valueClass="text-green-700"
                  />
                  <MiniCard
                    label="Certificate Status"
                    value={latestCertificate?.status ?? "No Record"}
                  />
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  {!isIssued && (
                    <form action={issueStudentCertificate}>
                      <input type="hidden" name="studentId" value={student.id} />
                      <input type="hidden" name="q" value={q} />
                      <input type="hidden" name="track" value={track} />
                      <input type="hidden" name="page" value={currentPage} />
                      <input type="hidden" name="perPage" value={perPage} />
                      <button
                        type="submit"
                        className="bg-green-700 px-3 py-2 text-xs font-semibold text-white transition hover:bg-green-800"
                      >
                        Issue Certificate
                      </button>
                    </form>
                  )}

                  {isIssued && latestCertificate?.certificateId && (
                    <a
                      href={`/verify/${latestCertificate.certificateId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-slate-900 px-3 py-2 text-xs font-semibold text-white transition hover:bg-slate-800"
                    >
                      Open Verification Page
                    </a>
                  )}
                </div>
              </article>
            );
          })
        ) : (
          <div className="border border-emerald-100 bg-white p-4 shadow-sm">
            <p className="text-sm text-slate-600">
              No students matched your current filters.
            </p>
          </div>
        )}
      </section>

      <section className="border border-emerald-100 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {hasPreviousPage ? (
              <a
                href={buildStudentsUrl({
                  q,
                  track,
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
                href={buildStudentsUrl({
                  q,
                  track,
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
          Total results: {totalFilteredStudents} • Page {currentPage} of {totalPages}
        </p>
      </section>
    </main>
  );
}

function QuickLink({
  href,
  label,
}: {
  href: string;
  label: string;
}) {
  return (
    <a
      href={href}
      className="border border-white/20 bg-white/15 px-3 py-2 text-center text-xs font-semibold text-white shadow-sm backdrop-blur transition hover:bg-white/25 hover:shadow-md"
    >
      {label}
    </a>
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

      <p className="mt-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500 sm:text-[11px]">
        {label}
      </p>

      <h2 className={`mt-1.5 text-lg font-bold sm:text-xl ${valueColor}`}>
        {value}
      </h2>

      <p className="mt-1.5 text-[11px] leading-5 text-slate-600 sm:text-xs">
        {note}
      </p>
    </div>
  );
}

function MiniCard({
  label,
  value,
  soft = "from-slate-50 to-white border-slate-200",
  valueClass = "text-slate-900",
}: {
  label: string;
  value: string | number;
  soft?: string;
  valueClass?: string;
}) {
  return (
    <div className={`border bg-gradient-to-br ${soft} p-2.5`}>
      <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-slate-500">
        {label}
      </p>
      <p className={`mt-1 text-sm font-bold sm:text-base ${valueClass}`}>
        {value}
      </p>
    </div>
  );
}