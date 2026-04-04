import QRCode from "qrcode";
import AttendanceQrModal from "@/components/attendance-qr-modal";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { syncExpiredAttendanceSessions } from "@/lib/attendance";
import { createAttendanceSession } from "./actions";
import { headers } from "next/headers";


export const dynamic = "force-dynamic";

const SESSION_PER_PAGE_OPTIONS = [2, 10, 25, 50];
const RECORD_PER_PAGE_OPTIONS = [3, 10, 25, 50];

function buildAttendanceUrl(params: {
  page?: number;
  perPage?: number;
  recordStatus?: string;
  recordPerPage?: number;
}) {
  const search = new URLSearchParams();

  if (params.page && params.page > 1) {
    search.set("page", String(params.page));
  }

  if (params.perPage) {
    search.set("perPage", String(params.perPage));
  }

  if (params.recordStatus && params.recordStatus !== "ALL") {
    search.set("recordStatus", params.recordStatus);
  }

  if (params.recordPerPage) {
    search.set("recordPerPage", String(params.recordPerPage));
  }

  const query = search.toString();
  return query ? `/teacher/attendance?${query}` : "/teacher/attendance";
}

function buildSessionLink(params: {
  sessionId: string;
  page: number;
  perPage: number;
  recordStatus: string;
  recordPerPage: number;
  recordPage?: number;
}) {
  const search = new URLSearchParams();

  if (params.page > 1) search.set("page", String(params.page));
  if (params.perPage) search.set("perPage", String(params.perPage));
  if (params.recordStatus !== "ALL") search.set("recordStatus", params.recordStatus);
  if (params.recordPerPage) search.set("recordPerPage", String(params.recordPerPage));
  if (params.recordPage && params.recordPage > 1) {
    search.set(`recordPage_${params.sessionId}`, String(params.recordPage));
  }

  const query = search.toString();
  return query ? `/teacher/attendance?${query}#session-${params.sessionId}` : `/teacher/attendance#session-${params.sessionId}`;
}

export default async function TeacherAttendancePage({
  searchParams,
}: {
  searchParams: Promise<{
    success?: string;
    error?: string;
    title?: string;
    page?: string;
    perPage?: string;
    recordStatus?: string;
    recordPerPage?: string;
    [key: string]: string | undefined;
  }>;
}) {
  const currentUser = await requireRole("TEACHER");
  const params = await searchParams;

  await syncExpiredAttendanceSessions();

  const rawPage = Number(params.page ?? "1");
  const rawPerPage = Number(params.perPage ?? "2");
  const recordStatus = params.recordStatus ?? "ALL";
  const rawRecordPerPage = Number(params.recordPerPage ?? "3");

  const perPage = SESSION_PER_PAGE_OPTIONS.includes(rawPerPage) ? rawPerPage : 2;
  const page = Number.isFinite(rawPage) && rawPage > 0 ? rawPage : 1;
  const recordPerPage = RECORD_PER_PAGE_OPTIONS.includes(rawRecordPerPage)
    ? rawRecordPerPage
    : 3;

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

  const totalStudentsInTrack = await db.student.count({
    where: {
      track: teacher.track,
    },
  });

  const totalSessionsCount = await db.attendanceSession.count({
    where: {
      teacherId: teacher.id,
    },
  });

  const totalPages = Math.max(1, Math.ceil(totalSessionsCount / perPage));
  const currentPage = Math.min(page, totalPages);
  const skip = (currentPage - 1) * perPage;

  const sessions = await db.attendanceSession.findMany({
    where: {
      teacherId: teacher.id,
    },
    orderBy: {
      createdAt: "desc",
    },
    skip,
    take: perPage,
    include: {
      attendanceRecords: {
        include: {
          student: {
            include: {
              user: true,
            },
          },
        },
        orderBy: {
          checkedInAt: "asc",
        },
      },
    },
  });

  const allSessions = await db.attendanceSession.findMany({
    where: {
      teacherId: teacher.id,
    },
    include: {
      attendanceRecords: true,
    },
  });

  
const appUrl = "https://portal.geeeep.com.ng";

  const success = params.success;
  const error = params.error;
  const sessionTitle = params.title;

  const totalSessions = allSessions.length;
  const activeSessions = allSessions.filter((session) => session.isActive).length;
  const totalPresent = allSessions.reduce(
    (sum, session) =>
      sum +
      session.attendanceRecords.filter((record) => record.status === "PRESENT").length,
    0
  );
  const totalAbsent = allSessions.reduce(
    (sum, session) =>
      sum +
      session.attendanceRecords.filter((record) => record.status === "ABSENT").length,
    0
  );

  const hasPreviousPage = currentPage > 1;
  const hasNextPage = currentPage < totalPages;

  const renderedSessions = await Promise.all(
    sessions.map(async (session) => {
      const qrTarget = `${appUrl}/student/attendance/scan?code=${encodeURIComponent(
        session.code
      )}`;

      const qrCodeDataUrl = await QRCode.toDataURL(qrTarget);

      const presentCount = session.attendanceRecords.filter(
        (record) => record.status === "PRESENT"
      ).length;

      const absentCount = session.attendanceRecords.filter(
        (record) => record.status === "ABSENT"
      ).length;

      const filteredRecords = session.attendanceRecords.filter((record) => {
        if (recordStatus === "ALL") return true;
        return record.status === recordStatus;
      });

      const rawRecordPage = Number(params[`recordPage_${session.id}`] ?? "1");
      const recordPage =
        Number.isFinite(rawRecordPage) && rawRecordPage > 0 ? rawRecordPage : 1;

      const totalRecordPages = Math.max(
        1,
        Math.ceil(filteredRecords.length / recordPerPage)
      );
      const currentRecordPage = Math.min(recordPage, totalRecordPages);
      const recordSkip = (currentRecordPage - 1) * recordPerPage;
      const paginatedRecords = filteredRecords.slice(
        recordSkip,
        recordSkip + recordPerPage
      );

      return {
        session,
        qrTarget,
        qrCodeDataUrl,
        presentCount,
        absentCount,
        filteredRecords,
        paginatedRecords,
        currentRecordPage,
        totalRecordPages,
      };
    })
  );

  return (
    <main className="space-y-4">
      <section className="overflow-hidden border border-emerald-200 bg-gradient-to-r from-emerald-950 via-emerald-700 to-lime-500 px-4 py-3 text-white shadow-[0_18px_45px_-22px_rgba(16,185,129,0.55)] sm:px-5">
        <div className="max-w-3xl">
          <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-emerald-100/90">
            Attendance
          </p>

          <h1 className="mt-0.5 text-lg font-bold leading-tight sm:text-xl">
            Attendance Sessions
          </h1>

          <p className="mt-1 text-[11px] leading-4 text-emerald-50/90 sm:text-xs">
            Create attendance sessions, display QR codes for instant check-in, and monitor present and absent students.
          </p>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-2.5 xl:grid-cols-4">
        <StatCard
          label="Track Students"
          value={totalStudentsInTrack}
          note="Expected learners"
          soft="from-emerald-50 to-white"
          border="border-emerald-100"
          line="from-emerald-600 to-green-500"
          valueColor="text-emerald-800"
        />
        <StatCard
          label="Sessions"
          value={totalSessions}
          note="All attendance sessions"
          soft="from-slate-50 to-white"
          border="border-slate-200"
          line="from-slate-500 to-slate-400"
          valueColor="text-slate-900"
        />
        <StatCard
          label="Active Sessions"
          value={activeSessions}
          note="Currently open"
          soft="from-green-50 to-white"
          border="border-green-100"
          line="from-green-600 to-emerald-600"
          valueColor="text-emerald-700"
        />
        <StatCard
          label="Total Check-ins"
          value={totalPresent}
          note="Present records"
          soft="from-lime-50 to-white"
          border="border-lime-100"
          line="from-lime-500 to-emerald-500"
          valueColor="text-lime-700"
        />
      </section>

      {error && (
        <section className="border border-red-200 bg-red-50 p-4 shadow-sm">
          <p className="text-sm font-bold text-red-800">
            Attendance session could not be created
          </p>
          <p className="mt-1 text-sm text-slate-700">{error}</p>
        </section>
      )}

      {success === "created" && sessionTitle && (
        <section className="border border-green-200 bg-green-50 p-4 shadow-sm">
          <p className="text-sm font-bold text-green-800">
            Attendance session created
          </p>
          <p className="mt-1 text-sm text-slate-700">
            {sessionTitle} is now live and ready for students to scan.
          </p>
        </section>
      )}

      <section className="grid gap-4 xl:grid-cols-[1fr_0.95fr]">
        <section className="border border-emerald-100 bg-white p-4 shadow-sm">
          <div className="mb-4 border border-emerald-100 bg-emerald-50 p-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-600">
              Assigned Track
            </p>
            <p className="mt-1 text-sm font-bold text-emerald-800 sm:text-base">
              {teacher.track}
            </p>
            <p className="mt-1 text-xs text-slate-600 sm:text-sm">
              Total students expected per session: {totalStudentsInTrack}
            </p>
          </div>

          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-emerald-700">
              Start Session
            </p>
            <h2 className="mt-1 text-lg font-bold text-slate-900">
              New Attendance Session
            </h2>
          </div>

          <p className="mt-1.5 text-xs text-slate-600 sm:text-sm">
            Create a live session and let students scan the QR code to mark attendance instantly.
          </p>

          <form
            action={createAttendanceSession}
            className="mt-4 grid gap-3 md:grid-cols-2"
          >
            <input
              name="title"
              type="text"
              placeholder="Session title e.g. HTML Class - Morning"
              className="border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-green-700"
            />

            <input
              name="duration"
              type="number"
              min="1"
              placeholder="Duration in minutes e.g. 30"
              className="border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-green-700"
            />

            <button
              type="submit"
              className="md:col-span-2 bg-green-700 py-2.5 text-sm font-semibold text-white transition hover:bg-green-800 active:scale-[0.98]"
            >
              Start Attendance Session
            </button>
          </form>
        </section>

        <section className="border border-emerald-100 bg-white p-4 shadow-sm">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-emerald-700">
              Attendance Summary
            </p>
            <h2 className="mt-1 text-lg font-bold text-slate-900">
              Workflow Overview
            </h2>
          </div>

          <div className="mt-4 grid gap-2.5">
            <SummaryRow label="Track" value={teacher.track} />
            <SummaryRow label="Students" value={`${totalStudentsInTrack}`} />
            <SummaryRow label="Active Sessions" value={`${activeSessions}`} />
            <SummaryRow label="Present Records" value={`${totalPresent}`} />
            <SummaryRow label="Absent Records" value={`${totalAbsent}`} />
          </div>
        </section>
      </section>

      <section className="space-y-4">
        {renderedSessions.length > 0 ? (
          renderedSessions.map(
            ({
              session,
              qrTarget,
              qrCodeDataUrl,
              presentCount,
              absentCount,
              filteredRecords,
              paginatedRecords,
              currentRecordPage,
              totalRecordPages,
            }) => (
              <article
                id={`session-${session.id}`}
                key={session.id}
                className="border border-emerald-100 bg-white p-4 shadow-sm transition hover:shadow-md"
              >
                <div className="flex flex-col gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base font-bold text-slate-900 sm:text-lg">
                        {session.title}
                      </h3>

                      <span
                        className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] ${
                          session.isActive
                            ? "bg-green-100 text-green-700"
                            : "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {session.isActive ? "Active" : "Closed"}
                      </span>
                    </div>

                    <div className="mt-3 grid gap-1.5 text-[11px] text-slate-600 sm:grid-cols-2 sm:text-xs">
                      <p>Track: {session.track}</p>
                      <p>Starts: {new Date(session.startsAt).toLocaleString()}</p>
                      <p>Ends: {new Date(session.endsAt).toLocaleString()}</p>
                      <p>Expected: {totalStudentsInTrack}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5 md:grid-cols-3">
                    <MiniCard
                      label="Present"
                      value={presentCount}
                      soft="bg-green-50 ring-green-100"
                      valueClass="text-green-700"
                    />
                    <MiniCard
                      label="Absent"
                      value={absentCount}
                      soft="bg-red-50 ring-red-100"
                      valueClass="text-red-600"
                    />
                    <MiniCard
                      label="Expected"
                      value={totalStudentsInTrack}
                      soft="bg-slate-50 ring-slate-200"
                      valueClass="text-slate-900"
                    />
                  </div>

                  <div className="grid gap-4 lg:grid-cols-2">
                    <div className="border border-slate-200 bg-slate-50 p-4">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500 sm:text-xs">
                        Attendance QR Code
                      </p>

                      <div className="mt-3">
                        <AttendanceQrModal
                          qrCodeDataUrl={qrCodeDataUrl}
                          title={session.title}
                        />
                      </div>

                      <p className="mt-3 text-xs text-center text-slate-600 sm:text-sm">
                        Students can scan this QR code and attendance will be marked immediately.
                      </p>

                      <div className="mt-3 border border-slate-200 bg-white p-3">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500 sm:text-xs">
                          Linked URL
                        </p>
                        <p className="mt-2 break-all text-[11px] text-slate-800 sm:text-sm">
                          {qrTarget}
                        </p>
                      </div>
                    </div>

                    <div>
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-emerald-700 sm:text-xs">
                            Attendance Records
                          </p>
                          <h4 className="mt-1 text-base font-bold text-slate-900">
                            Session Check-ins
                          </h4>
                        </div>

                        <form className="flex flex-wrap items-center gap-2">
                          <input type="hidden" name="page" value={currentPage} />
                          <input type="hidden" name="perPage" value={perPage} />
                          <input type="hidden" name="recordPerPage" value={recordPerPage} />

                          <label
                            htmlFor={`recordStatus-${session.id}`}
                            className="text-xs font-semibold text-slate-700"
                          >
                            Status:
                          </label>

                          <select
                            id={`recordStatus-${session.id}`}
                            name="recordStatus"
                            defaultValue={recordStatus}
                            className="border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-900 outline-none focus:border-emerald-500 sm:text-sm"
                          >
                            <option value="ALL">All</option>
                            <option value="PRESENT">Present</option>
                            <option value="ABSENT">Absent</option>
                          </select>

                          <button
                            type="submit"
                            className="bg-emerald-700 px-3 py-2 text-xs font-semibold text-white transition hover:bg-emerald-800 sm:text-sm"
                          >
                            Apply
                          </button>
                        </form>
                      </div>

                      <div className="mt-4 grid gap-3">
                        {paginatedRecords.length > 0 ? (
                          paginatedRecords.map((record) => (
                            <div
                              key={record.id}
                              className="border border-slate-200 bg-slate-50 p-3"
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <p className="text-sm font-semibold text-slate-900">
                                    {record.student.user.name}
                                  </p>

                                  <p className="mt-1 text-xs text-slate-600 sm:text-sm">
                                    Recorded at:{" "}
                                    {new Date(record.checkedInAt).toLocaleString()}
                                  </p>
                                </div>

                                <span
                                  className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] ${
                                    record.status === "PRESENT"
                                      ? "bg-green-100 text-green-700"
                                      : "bg-red-100 text-red-700"
                                  }`}
                                >
                                  {record.status}
                                </span>
                              </div>
                            </div>
                          ))
                        ) : (
                          <p className="text-sm text-slate-600">
                            No attendance records matched your current filter.
                          </p>
                        )}
                      </div>

                      <div className="mt-4 border border-slate-200 bg-slate-50 p-3">
                        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                          <div className="flex flex-wrap items-center gap-2">
                            {currentRecordPage > 1 ? (
                              <a
                                href={buildSessionLink({
                                  sessionId: session.id,
                                  page: currentPage,
                                  perPage,
                                  recordStatus,
                                  recordPerPage,
                                  recordPage: currentRecordPage - 1,
                                })}
                                className="border border-emerald-200 bg-white px-3 py-2 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-50 sm:text-sm"
                              >
                                ← Prev
                              </a>
                            ) : (
                              <span className="border border-slate-200 bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-400 sm:text-sm">
                                ← Prev
                              </span>
                            )}

                            {currentRecordPage < totalRecordPages ? (
                              <a
                                href={buildSessionLink({
                                  sessionId: session.id,
                                  page: currentPage,
                                  perPage,
                                  recordStatus,
                                  recordPerPage,
                                  recordPage: currentRecordPage + 1,
                                })}
                                className="border border-emerald-200 bg-white px-3 py-2 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-50 sm:text-sm"
                              >
                                Next →
                              </a>
                            ) : (
                              <span className="border border-slate-200 bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-400 sm:text-sm">
                                Next →
                              </span>
                            )}

                            <p className="text-xs font-semibold text-slate-900 sm:text-sm">
                              Page {currentRecordPage} of {totalRecordPages}
                            </p>
                          </div>

                          <form className="flex flex-wrap items-center gap-2">
                            <input type="hidden" name="page" value={currentPage} />
                            <input type="hidden" name="perPage" value={perPage} />
                            <input type="hidden" name="recordStatus" value={recordStatus} />
                            <input type="hidden" name={`recordPage_${session.id}`} value="1" />

                            <label
                              htmlFor={`recordPerPage-${session.id}`}
                              className="text-xs font-semibold text-slate-900 sm:text-sm"
                            >
                              Per page:
                            </label>

                            <select
                              id={`recordPerPage-${session.id}`}
                              name="recordPerPage"
                              defaultValue={String(recordPerPage)}
                              className="border border-emerald-200 bg-white px-3 py-2 text-xs font-semibold text-slate-900 outline-none focus:border-emerald-500 sm:text-sm"
                            >
                              {RECORD_PER_PAGE_OPTIONS.map((option) => (
                                <option key={option} value={option}>
                                  {option}
                                </option>
                              ))}
                            </select>

                            <button
                              type="submit"
                              className="bg-emerald-700 px-3 py-2 text-xs font-semibold text-white transition hover:bg-emerald-800 sm:text-sm"
                            >
                              Apply
                            </button>
                          </form>
                        </div>

                        <p className="mt-3 text-xs font-semibold text-slate-800 sm:text-sm">
                          Total records: {filteredRecords.length} • Page {currentRecordPage} of {totalRecordPages}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </article>
            )
          )
        ) : (
          <div className="border border-emerald-100 bg-white p-4 shadow-sm">
            <p className="text-sm text-slate-600">
              No attendance sessions found yet.
            </p>
          </div>
        )}
      </section>

      <section className="border border-emerald-100 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {hasPreviousPage ? (
              <a
                href={buildAttendanceUrl({
                  page: currentPage - 1,
                  perPage,
                  recordStatus,
                  recordPerPage,
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
                href={buildAttendanceUrl({
                  page: currentPage + 1,
                  perPage,
                  recordStatus,
                  recordPerPage,
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
            <input type="hidden" name="recordStatus" value={recordStatus} />
            <input type="hidden" name="recordPerPage" value={recordPerPage} />
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
              {SESSION_PER_PAGE_OPTIONS.map((option) => (
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
          Total results: {totalSessionsCount} • Page {currentPage} of {totalPages}
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

function SummaryRow({
  label,
  value,
}: {
  label: string;
  value?: string | null;
}) {
  return (
    <div className="flex items-center justify-between border border-slate-200 bg-slate-50 px-3 py-3">
      <span className="text-sm font-medium text-slate-500">{label}</span>
      <span className="text-sm font-semibold text-slate-900">
        {value ?? "Not Available"}
      </span>
    </div>
  );
}