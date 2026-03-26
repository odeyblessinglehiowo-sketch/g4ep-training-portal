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
  }>;
}) {
  await requireRole("ADMIN");
  const params = await searchParams;

  const q = params.q?.trim() ?? "";
  const track = params.track ?? "ALL";

  const students = await db.student.findMany({
    where: {
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

  return (
    <main className="space-y-6">
      <section className="overflow-hidden rounded-[2rem] bg-gradient-to-r from-emerald-900 via-green-700 to-lime-500 p-6 text-white shadow-lg shadow-emerald-200/50 sm:p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-50/90">
          Students
        </p>

        <h1 className="mt-3 text-3xl font-bold sm:text-4xl">
          Manage Students
        </h1>

        <p className="mt-4 max-w-3xl text-sm leading-7 text-emerald-50/90 sm:text-base">
          View registered students, monitor attendance performance, manage account access,
          and issue certificates from one central workspace.
        </p>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total Students"
          value={totalStudents}
          tone="bg-white"
          valueClass="text-slate-900"
        />
        <StatCard
          label="Active Students"
          value={activeStudents}
          tone="bg-emerald-50"
          valueClass="text-emerald-700"
        />
        <StatCard
          label="Certificates Issued"
          value={issuedCertificates}
          tone="bg-lime-50"
          valueClass="text-lime-700"
        />
        <StatCard
          label="Filtered Result"
          value={enrichedStudents.length}
          tone="bg-green-50"
          valueClass="text-green-700"
        />
      </section>

      {error && (
        <section className="rounded-[1.75rem] border border-red-200 bg-red-50 p-6 shadow-sm">
          <h2 className="text-lg font-bold text-red-800">
            Action could not be completed
          </h2>
          <p className="mt-2 text-sm text-slate-700">{error}</p>
        </section>
      )}

      {created && createdEmail && createdPassword && (
        <section className="rounded-[1.75rem] border border-green-200 bg-green-50 p-6 shadow-sm">
          <h2 className="text-lg font-bold text-green-800">
            Student created successfully
          </h2>

          <p className="mt-2 text-sm text-slate-700">
            Share these login details with the student.
          </p>

          {!emailSent && (
            <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
              <p className="text-sm font-medium text-amber-800">
                Email was not sent. Copy these details manually and share them with the student.
              </p>
            </div>
          )}

          {emailSent && (
            <div className="mt-4 rounded-2xl border border-green-200 bg-white px-4 py-3 ring-1 ring-green-100">
              <p className="text-sm font-medium text-green-700">
                Login details were sent successfully to the student&apos;s email.
              </p>
            </div>
          )}

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl bg-white p-4 ring-1 ring-green-100">
              <p className="text-sm font-medium text-slate-500">Email</p>
              <p className="mt-1 font-semibold text-slate-900">{createdEmail}</p>
            </div>

            <div className="rounded-2xl bg-white p-4 ring-1 ring-green-100">
              <p className="text-sm font-medium text-slate-500">
                Temporary Password
              </p>
              <p className="mt-1 font-semibold text-slate-900">{createdPassword}</p>
            </div>
          </div>
        </section>
      )}

      {success === "issued" && successName && (
        <section className="rounded-[1.75rem] border border-green-200 bg-green-50 p-6 shadow-sm">
          <h2 className="text-lg font-bold text-green-800">
            Certificate issued successfully
          </h2>
          <p className="mt-2 text-sm text-slate-700">
            {successName}&apos;s certificate has been issued.
          </p>
        </section>
      )}

      {success === "track-issued" && successTrackName && (
        <section className="rounded-[1.75rem] border border-green-200 bg-green-50 p-6 shadow-sm">
          <h2 className="text-lg font-bold text-green-800">
            Track certificates issued successfully
          </h2>
          <p className="mt-2 text-sm text-slate-700">
            All eligible students under {successTrackName} have been processed.
          </p>
        </section>
      )}

      <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <section className="rounded-[1.75rem] border border-emerald-100 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900">Add New Student</h2>
          <p className="mt-1 text-sm text-slate-600">
            Create a student account and assign a training track.
          </p>

          <form action={createStudent} className="mt-6 grid gap-4 md:grid-cols-3">
            <input
              name="name"
              type="text"
              placeholder="Full name"
              className="rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-green-600"
            />

            <input
              name="email"
              type="email"
              placeholder="Email address"
              className="rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-green-600"
            />

            <input
              name="track"
              type="text"
              placeholder="Track e.g. Web Design"
              className="rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-green-600"
            />

            <div className="md:col-span-3">
              <button
                type="submit"
                className="rounded-xl bg-green-700 px-5 py-3 font-semibold text-white hover:bg-green-800"
              >
                Create Student
              </button>
            </div>
          </form>
        </section>

        <section className="rounded-[1.75rem] border border-emerald-100 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900">Search & Filters</h2>
          <p className="mt-1 text-sm text-slate-600">
            Search students by name or email and filter by track.
          </p>

          <form className="mt-6 grid gap-4">
            <input
              name="q"
              type="text"
              defaultValue={q}
              placeholder="Search name or email"
              className="rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-green-600"
            />

            <select
              name="track"
              defaultValue={track}
              className="rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-green-600"
            >
              <option value="ALL">All Tracks</option>
              {trackOptions.map((trackOption) => (
                <option key={trackOption} value={trackOption}>
                  {trackOption}
                </option>
              ))}
            </select>

            <div className="flex gap-3">
              <button
                type="submit"
                className="flex-1 rounded-xl bg-green-700 px-5 py-3 font-semibold text-white hover:bg-green-800"
              >
                Apply
              </button>

              <a
                href="/admin/students"
                className="flex-1 rounded-xl bg-slate-200 px-5 py-3 text-center font-semibold text-slate-800 hover:bg-slate-300"
              >
                Reset
              </a>
            </div>
          </form>

          <form action={issueCertificatesByTrack} className="mt-4">
            <input type="hidden" name="selectedTrack" value={track} />
            <input type="hidden" name="q" value={q} />
            <input type="hidden" name="track" value={track} />
            <button
              type="submit"
              disabled={track === "ALL"}
              className={`w-full rounded-xl px-5 py-3 font-semibold text-white ${
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

      <section className="grid gap-6">
        {enrichedStudents.length > 0 ? (
          enrichedStudents.map((student) => {
            const latestCertificate = student.certificates[0];
            const isIssued = latestCertificate?.status === "ISSUED";

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

                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          student.user.isActive
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {student.user.isActive ? "ACTIVE" : "DISABLED"}
                      </span>
                    </div>

                    <div className="mt-3 grid gap-2 text-sm text-slate-600 sm:grid-cols-2">
                      <p>Email: {student.user.email}</p>
                      <p>Track: {student.track}</p>
                      <p>
                        Joined: {new Date(student.createdAt).toLocaleDateString()}
                      </p>
                      <p>
                        Certificate ID:{" "}
                        {latestCertificate?.certificateId ?? "Not Assigned"}
                      </p>
                    </div>
                  </div>

                  <form action={toggleUserStatus}>
                    <input type="hidden" name="userId" value={student.user.id} />
                    <button
                      type="submit"
                      className={`rounded-xl px-4 py-2 text-sm font-semibold ${
                        student.user.isActive
                          ? "bg-red-50 text-red-700 ring-1 ring-red-200 hover:bg-red-100"
                          : "bg-green-50 text-green-700 ring-1 ring-green-200 hover:bg-green-100"
                      }`}
                    >
                      {student.user.isActive ? "Disable Account" : "Enable Account"}
                    </button>
                  </form>
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

                <div className="mt-5 flex flex-wrap gap-3">
                  {!isIssued && (
                    <form action={issueStudentCertificate}>
                      <input type="hidden" name="studentId" value={student.id} />
                      <input type="hidden" name="q" value={q} />
                      <input type="hidden" name="track" value={track} />
                      <button
                        type="submit"
                        className="rounded-xl bg-green-700 px-4 py-2 text-sm font-semibold text-white hover:bg-green-800"
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
                      className="inline-block rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
                    >
                      Open Verification Page
                    </a>
                  )}
                </div>
              </article>
            );
          })
        ) : (
          <div className="rounded-[1.75rem] border border-emerald-100 bg-white p-6 shadow-sm">
            <p className="text-sm text-slate-600">
              No students matched your current filters.
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
      <p className={`mt-2 text-xl font-bold ${valueClass}`}>{value}</p>
    </div>
  );
}