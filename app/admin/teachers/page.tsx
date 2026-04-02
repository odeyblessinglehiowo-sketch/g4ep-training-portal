import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { createTeacher } from "./actions";

export const dynamic = "force-dynamic";

export default async function AdminTeachersPage({
  searchParams,
}: {
  searchParams: Promise<{
    created?: string;
    email?: string;
    password?: string;
    emailSent?: string;
    error?: string;
    q?: string;
    track?: string;
  }>;
}) {
  await requireRole("ADMIN");

  const params = await searchParams;
  const q = params.q?.trim() ?? "";
  const track = params.track ?? "ALL";

  const teachers = await db.teacher.findMany({
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
    },
  });

  const trackRows = await db.teacher.findMany({
    select: {
      track: true,
    },
    distinct: ["track"],
  });

  const trackOptions = trackRows.map((row) => row.track).sort();

  const totalTeachers = await db.teacher.count();

  const created = params.created === "1";
  const createdEmail = params.email;
  const createdPassword = params.password;
  const emailSent = params.emailSent === "1";
  const error = params.error;

  return (
    <main className="space-y-4">
      <section className="overflow-hidden border border-emerald-200 bg-gradient-to-r from-emerald-950 via-emerald-700 to-lime-500 px-4 py-4 text-white shadow-[0_18px_45px_-22px_rgba(16,185,129,0.55)] sm:px-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-emerald-100/90">
              Teachers
            </p>

            <h1 className="mt-1.5 text-xl font-bold leading-tight sm:text-2xl">
              Manage Teachers
            </h1>

            <p className="mt-2 text-xs leading-5 text-emerald-50/90 sm:text-sm">
              Create teacher accounts and manage track ownership from one central workspace.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:w-[280px]">
            <QuickLink href="/admin/teachers" label="Teachers" />
            <QuickLink href="/admin/students" label="Students" />
            <QuickLink href="/admin/assignments" label="Assignments" />
            <QuickLink href="/admin/users" label="Users" />
          </div>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-2.5 xl:grid-cols-3">
        <StatCard
          label="Total Teachers"
          value={totalTeachers}
          note="All teacher accounts"
          soft="from-emerald-50 to-white"
          border="border-emerald-100"
          line="from-emerald-600 to-green-500"
          valueColor="text-emerald-800"
        />
        <StatCard
          label="Filtered Result"
          value={teachers.length}
          note="Teachers in current view"
          soft="from-lime-50 to-white"
          border="border-lime-100"
          line="from-lime-500 to-emerald-500"
          valueColor="text-lime-800"
        />
        <StatCard
          label="Available Tracks"
          value={trackOptions.length}
          note="Tracks assigned to teachers"
          soft="from-green-50 to-white"
          border="border-green-100"
          line="from-green-600 to-emerald-600"
          valueColor="text-green-800"
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
            Teacher created successfully
          </h2>

          <p className="mt-1.5 text-sm text-slate-700">
            Share these login details with the teacher.
          </p>

          {!emailSent && (
            <div className="mt-3 border border-amber-200 bg-amber-50 px-3 py-2.5">
              <p className="text-xs font-medium text-amber-800 sm:text-sm">
                Email was not sent. Copy these details manually and share them with the teacher.
              </p>
            </div>
          )}

          {emailSent && (
            <div className="mt-3 border border-green-200 bg-white px-3 py-2.5 ring-1 ring-green-100">
              <p className="text-xs font-medium text-green-700 sm:text-sm">
                Login details were sent successfully to the teacher&apos;s email.
              </p>
            </div>
          )}

          <div className="mt-3 grid gap-2.5 md:grid-cols-2">
            <div className="border border-green-100 bg-white p-3">
              <p className="text-xs font-medium text-slate-500">Email</p>
              <p className="mt-1 text-sm font-semibold text-slate-900 break-all">
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

      <section className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
        <section className="border border-emerald-100 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-emerald-700">
                Add Teacher
              </p>
              <h2 className="mt-1 text-lg font-bold text-slate-900">
                New Teacher Account
              </h2>
            </div>

            <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-emerald-700">
              Admin
            </span>
          </div>

          <p className="mt-1.5 text-xs text-slate-600 sm:text-sm">
            Create a teacher account and assign a teaching track.
          </p>

          <form action={createTeacher} className="mt-4 grid gap-3 md:grid-cols-3">
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
                className="bg-green-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-green-800 active:scale-[0.98]"
              >
                Create Teacher
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
              Filter Teachers
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

            <div className="grid grid-cols-2 gap-2">
              <button
                type="submit"
                className="bg-green-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-green-800"
              >
                Apply
              </button>

              <a
                href="/admin/teachers"
                className="bg-slate-200 px-4 py-2.5 text-center text-sm font-semibold text-slate-800 transition hover:bg-slate-300"
              >
                Reset
              </a>
            </div>
          </form>
        </section>
      </section>

      <section className="space-y-3">
        {teachers.length > 0 ? (
          teachers.map((teacher) => (
            <article
              key={teacher.id}
              className="border border-emerald-100 bg-white p-4 shadow-sm transition hover:shadow-md"
            >
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-base font-bold text-slate-900 sm:text-lg">
                      {teacher.user.name}
                    </h3>

                    <span className="rounded-full bg-green-100 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-green-700">
                      {teacher.user.role}
                    </span>
                  </div>

                  <div className="mt-3 grid gap-2 text-xs text-slate-600 sm:grid-cols-2 sm:text-sm">
                    <p className="break-all">
                      <span className="font-semibold text-slate-700">Email:</span>{" "}
                      {teacher.user.email}
                    </p>
                    <p>
                      <span className="font-semibold text-slate-700">Track:</span>{" "}
                      {teacher.track}
                    </p>
                    <p>
                      <span className="font-semibold text-slate-700">Joined:</span>{" "}
                      {new Date(teacher.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="border border-emerald-100 bg-emerald-50 px-3 py-2.5 text-center">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-emerald-700">
                    Teaching Track
                  </p>
                  <p className="mt-1 text-sm font-bold text-slate-900">
                    {teacher.track}
                  </p>
                </div>
              </div>
            </article>
          ))
        ) : (
          <div className="border border-emerald-100 bg-white p-4 shadow-sm">
            <p className="text-sm text-slate-600">
              No teachers matched your current filters.
            </p>
          </div>
        )}
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