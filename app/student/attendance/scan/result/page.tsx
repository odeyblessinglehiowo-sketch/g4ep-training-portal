export const dynamic = "force-dynamic";
export default async function StudentAttendanceScanResultPage({
  searchParams,
}: {
  searchParams: Promise<{
    status?: string;
    title?: string;
    time?: string;
    message?: string;
  }>;
}) {
  const params = await searchParams;

  const status = params.status;
  const title = params.title;
  const time = params.time;
  const message = params.message;

  const isSuccess = status === "success";

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-lg rounded-3xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
        {isSuccess ? (
          <>
            <div className="rounded-2xl border border-green-200 bg-green-50 p-5">
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-green-700">
                Attendance Marked
              </p>

              <h1 className="mt-2 text-2xl font-bold text-slate-900">
                Attendance recorded successfully
              </h1>

              <p className="mt-3 text-sm text-slate-700">
                Your attendance has been marked for:
              </p>

              <p className="mt-2 text-lg font-bold text-slate-900">
                {title ?? "Session"}
              </p>

              {time && (
                <p className="mt-2 text-sm text-slate-600">
                  Recorded at: {new Date(time).toLocaleString()}
                </p>
              )}
            </div>

            <a
              href="/student/attendance"
              className="mt-6 inline-flex w-full items-center justify-center rounded-xl bg-green-700 px-5 py-3 font-semibold text-white transition hover:bg-green-800"
            >
              Back to Attendance
            </a>
          </>
        ) : (
          <>
            <div className="rounded-2xl border border-red-200 bg-red-50 p-5">
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-red-700">
                Attendance Error
              </p>

              <h1 className="mt-2 text-2xl font-bold text-slate-900">
                Attendance could not be marked
              </h1>

              <p className="mt-3 text-sm text-slate-700">
                {message ?? "Something went wrong while trying to record attendance."}
              </p>
            </div>

            <a
              href="/student/attendance"
              className="mt-6 inline-flex w-full items-center justify-center rounded-xl bg-slate-900 px-5 py-3 font-semibold text-white transition hover:bg-slate-800"
            >
              Back to Attendance
            </a>
          </>
        )}
      </div>
    </main>
  );
}