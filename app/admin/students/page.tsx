import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  createStudent,
  issueCertificatesByTrack,
  issueStudentCertificate,
} from "./actions";
import { toggleUserStatus } from "../users/actions";
import { getStudentAttendanceMetrics } from "@/lib/student-progress";

export default async function AdminStudentsPage({
  searchParams,
}: {
  searchParams: Promise<{
    created?: string;
    email?: string;
    password?: string;
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
        track !== "ALL"
          ? {
              track,
            }
          : {},
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

  const created = params.created === "1";
  const createdEmail = params.email;
  const createdPassword = params.password;
  const success = params.success;
  const successName = params.name;
  const successTrackName = params.trackName;
  const error = params.error;

  return (
    <main className="space-y-6">
      <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-green-700">
          Students
        </p>

        <h1 className="mt-2 text-3xl font-bold text-slate-900">
          Manage Students
        </h1>

        <p className="mt-2 text-sm text-slate-600">
          View registered students, their tracks, attendance percentage, project progress, and certificate status.
        </p>
      </section>

      {error && (
        <section className="rounded-3xl border border-red-200 bg-red-50 p-6 shadow-sm">
          <h2 className="text-lg font-bold text-red-800">
            Action could not be completed
          </h2>
          <p className="mt-2 text-sm text-slate-700">{error}</p>
        </section>
      )}

      {created && createdEmail && createdPassword && (
        <section className="rounded-3xl border border-green-200 bg-green-50 p-6 shadow-sm">
          <h2 className="text-lg font-bold text-green-800">
            Student created successfully
          </h2>

          <p className="mt-2 text-sm text-slate-700">
            Share these login details with the student.
          </p>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl bg-white p-4 ring-1 ring-green-100">
              <p className="text-sm font-medium text-slate-500">Email</p>
              <p className="mt-1 font-semibold text-slate-900">
                {createdEmail}
              </p>
            </div>

            <div className="rounded-2xl bg-white p-4 ring-1 ring-green-100">
              <p className="text-sm font-medium text-slate-500">
                Temporary Password
              </p>
              <p className="mt-1 font-semibold text-slate-900">
                {createdPassword}
              </p>
            </div>
          </div>
        </section>
      )}

      {success === "issued" && successName && (
        <section className="rounded-3xl border border-green-200 bg-green-50 p-6 shadow-sm">
          <h2 className="text-lg font-bold text-green-800">
            Certificate issued successfully
          </h2>
          <p className="mt-2 text-sm text-slate-700">
            {successName}&apos;s certificate has been issued.
          </p>
        </section>
      )}

      {success === "track-issued" && successTrackName && (
        <section className="rounded-3xl border border-green-200 bg-green-50 p-6 shadow-sm">
          <h2 className="text-lg font-bold text-green-800">
            Track certificates issued successfully
          </h2>
          <p className="mt-2 text-sm text-slate-700">
            All eligible students under {successTrackName} have been processed.
          </p>
        </section>
      )}

      <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
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

      <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <h2 className="text-xl font-bold text-slate-900">Search & Filters</h2>
        <p className="mt-1 text-sm text-slate-600">
          Search students by name or email and filter by track.
        </p>

        <form className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
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

          <form action={issueCertificatesByTrack} className="contents">
            <input type="hidden" name="selectedTrack" value={track} />
            <input type="hidden" name="q" value={q} />
            <input type="hidden" name="track" value={track} />
            <button
              type="submit"
              disabled={track === "ALL"}
              className={`rounded-xl px-5 py-3 font-semibold text-white ${
                track === "ALL"
                  ? "cursor-not-allowed bg-slate-400"
                  : "bg-slate-900 hover:bg-slate-800"
              }`}
            >
              Issue All in Selected Track
            </button>
          </form>
        </form>
      </section>

      <section className="grid gap-6">
        {enrichedStudents.length > 0 ? (
          enrichedStudents.map((student) => {
            const latestCertificate = student.certificates[0];
            const isIssued = latestCertificate?.status === "ISSUED";

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

                  <div className="flex flex-col items-end gap-2">
                    <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                      {student.user.role}
                    </span>

                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        student.user.isActive
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {student.user.isActive ? "ACTIVE" : "DISABLED"}
                    </span>

                    <form action={toggleUserStatus}>
                      <input type="hidden" name="userId" value={student.user.id} />
                      <button
                        className={`rounded-lg px-3 py-1 text-xs font-semibold ${
                          student.user.isActive
                            ? "bg-red-100 text-red-700"
                            : "bg-green-100 text-green-700"
                        }`}
                      >
                        {student.user.isActive
                          ? "Disable Account"
                          : "Enable Account"}
                      </button>
                    </form>
                  </div>
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

                <div className="mt-4 flex flex-wrap gap-3">
                  {!isIssued && (
                    <form action={issueStudentCertificate}>
                      <input type="hidden" name="studentId" value={student.id} />
                      <input type="hidden" name="q" value={q} />
                      <input type="hidden" name="track" value={track} />
                      <button
                        type="submit"
                        className="rounded-lg bg-green-700 px-4 py-2 text-sm font-semibold text-white hover:bg-green-800"
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
                      className="inline-block rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
                    >
                      Open Verification Page
                    </a>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <p className="text-sm text-slate-600">
              No students matched your current filters.
            </p>
          </div>
        )}
      </section>
    </main>
  );
}