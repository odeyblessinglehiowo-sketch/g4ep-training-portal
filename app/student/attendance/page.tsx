import { requireRole } from "@/lib/auth";
export const dynamic = "force-dynamic";
import { db } from "@/lib/db";
import { syncExpiredAttendanceSessions } from "@/lib/attendance";

const PAGE_SIZE = 8;

export default async function StudentAttendancePage({
  searchParams,
}: {
  searchParams: Promise<{
  page?: string;
  status?: string;
  message?: string;
}>;
}) {
  const params = await searchParams;
  const page = Number(params.page ?? "1");
const status = params.status;
const message = params.message;
  const currentUser = await requireRole("STUDENT");

  await syncExpiredAttendanceSessions();

  const studentUser = await db.user.findUnique({
    where: {
      id: currentUser.userId,
    },
    include: {
      student: {
        include: {
          attendanceRecords: {
            include: {
              session: true,
            },
            orderBy: {
              createdAt: "desc",
            },
          },
        },
      },
    },
  });

  if (!studentUser || !studentUser.student) {
    throw new Error("Student record not found.");
  }

  const student = studentUser.student;
  const attendanceRecords = student.attendanceRecords ?? [];

  const presentCount = attendanceRecords.filter(
    (record) => record.status === "PRESENT"
  ).length;

  const absentCount = attendanceRecords.filter(
    (record) => record.status === "ABSENT"
  ).length;

  const totalCount = attendanceRecords.length;

  const attendanceRate =
    totalCount > 0 ? Math.round((presentCount / totalCount) * 100) : 0;

  const totalPages = Math.max(1, Math.ceil(attendanceRecords.length / PAGE_SIZE));
  const currentPage = Math.min(Math.max(page, 1), totalPages);

  const paginatedRecords = attendanceRecords.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  return (
    <main className="space-y-4">
      <section className="overflow-hidden border border-emerald-200 bg-gradient-to-r from-emerald-950 via-emerald-700 to-lime-500 px-4 py-3 text-white shadow-sm">
        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-emerald-100/90">
          Attendance
        </p>

        <h1 className="mt-1 text-xl font-bold sm:text-2xl">
          Class Attendance
        </h1>

        <p className="mt-1 text-sm text-emerald-50/90">
          Monitor your attendance history and scan class QR codes when instructed.
        </p>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1fr_0.95fr]">
        <section className="border border-emerald-100 bg-white p-4 shadow-sm">
          <div className="border border-emerald-100 bg-emerald-50 p-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-600">
              Assigned Track
            </p>
            <p className="mt-1 text-sm font-bold text-emerald-800 sm:text-base">
              {student.track ?? "Not Assigned"}
            </p>
          </div>

          <div className="mt-4 border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm font-semibold text-slate-900">
              How attendance works
            </p>

            <div className="mt-3 space-y-2 text-sm leading-6 text-slate-600">
              <p>1. Open your phone camera and scan the class QR code.</p>
              <p>2. The portal opens and marks your attendance instantly.</p>
              <p>3. If the session closes before you scan, it may be recorded as absent.</p>
            </div>
          </div>
        </section>
{message && (
  <section
    className={`border p-3 shadow-sm ${
      status === "success"
        ? "border-emerald-200 bg-emerald-50"
        : "border-red-200 bg-red-50"
    }`}
  >
    <p
      className={`text-[11px] font-semibold uppercase tracking-[0.18em] ${
        status === "success" ? "text-emerald-700" : "text-red-700"
      }`}
    >
      {status === "success" ? "Attendance Successful" : "Attendance Error"}
    </p>

    <p className="mt-1 text-sm text-slate-700">{message}</p>
  </section>
)}
        <section className="border border-emerald-100 bg-white p-4 shadow-sm">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-emerald-700">
            Attendance Overview
          </p>

          <div className="mt-4 grid grid-cols-2 gap-2.5">
            <StatCard
              label="Present"
              value={presentCount}
              note="Recorded check-ins"
              soft="from-green-50 to-white"
              border="border-green-100"
              line="from-green-600 to-emerald-600"
              valueColor="text-green-700"
            />
            <StatCard
              label="Absent"
              value={absentCount}
              note="Missed sessions"
              soft="from-red-50 to-white"
              border="border-red-100"
              line="from-red-500 to-rose-500"
              valueColor="text-red-600"
            />
            <StatCard
              label="Total Records"
              value={totalCount}
              note="Attendance entries"
              soft="from-slate-50 to-white"
              border="border-slate-200"
              line="from-slate-500 to-slate-400"
              valueColor="text-slate-900"
            />
            <StatCard
              label="Attendance Rate"
              value={`${attendanceRate}%`}
              note="Current performance"
              soft="from-emerald-50 to-lime-50"
              border="border-emerald-100"
              line="from-emerald-700 to-lime-500"
              valueColor="text-emerald-800"
            />
          </div>
        </section>
      </section>

      <section className="border border-emerald-100 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-emerald-700">
              Attendance History
            </p>
            <h2 className="mt-1 text-lg font-bold text-slate-900">
              Your Records
            </h2>
          </div>

          <span className="rounded-full bg-emerald-50 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-emerald-700">
            {totalCount} Total
          </span>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 xl:grid-cols-4">
          {paginatedRecords.length > 0 ? (
            paginatedRecords.map((record) => (
              <article
                key={record.id}
                className="border border-emerald-100 bg-white p-4 shadow-sm"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-sm font-bold text-slate-900 sm:text-base">
                    {record.session.title}
                  </h3>

                  <span
                    className={`px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] ${
                      record.status === "PRESENT"
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {record.status}
                  </span>
                </div>

                <div className="mt-3 space-y-2 text-sm text-slate-600">
                  <p>Track: {record.session.track}</p>
                  <p>Recorded: {new Date(record.checkedInAt).toLocaleString()}</p>
                  <p>Ends: {new Date(record.session.endsAt).toLocaleString()}</p>
                </div>
              </article>
            ))
          ) : (
            <div className="col-span-2 border border-slate-200 bg-slate-50 p-4 xl:col-span-4">
              <p className="text-sm text-slate-600">
                No attendance records found yet.
              </p>
            </div>
          )}
        </div>

        <div className="mt-4 flex items-center justify-between text-sm">
          <a
            href={`?page=${currentPage - 1}`}
            className={`font-medium text-slate-700 ${
              currentPage <= 1 ? "pointer-events-none opacity-40" : ""
            }`}
          >
            ← Prev
          </a>

          <span className="font-medium text-slate-700">
            Page {currentPage} of {totalPages}
          </span>

          <a
            href={`?page=${currentPage + 1}`}
            className={`font-medium text-slate-700 ${
              currentPage >= totalPages ? "pointer-events-none opacity-40" : ""
            }`}
          >
            Next →
          </a>
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