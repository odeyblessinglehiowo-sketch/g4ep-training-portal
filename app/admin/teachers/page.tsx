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
    <main className="space-y-6">
      <section className="overflow-hidden rounded-[2rem] bg-gradient-to-r from-emerald-900 via-green-700 to-lime-500 p-6 text-white shadow-lg shadow-emerald-200/50 sm:p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-50/90">
          Teachers
        </p>

        <h1 className="mt-3 text-3xl font-bold sm:text-4xl">
          Manage Teachers
        </h1>

        <p className="mt-4 max-w-3xl text-sm leading-7 text-emerald-50/90 sm:text-base">
          Create teacher accounts, assign track ownership, and manage instructor access
          across the training portal.
        </p>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard label="Total Teachers" value={totalTeachers} />
        <StatCard
          label="Filtered Result"
          value={teachers.length}
          tone="bg-emerald-50"
          valueClass="text-emerald-700"
        />
        <StatCard
          label="Available Tracks"
          value={trackOptions.length}
          tone="bg-lime-50"
          valueClass="text-lime-700"
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
            Teacher created successfully
          </h2>

          <p className="mt-2 text-sm text-slate-700">
            Share these login details with the teacher.
          </p>

          {!emailSent && (
            <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
              <p className="text-sm font-medium text-amber-800">
                Email was not sent. Copy these details manually and share them with the teacher.
              </p>
            </div>
          )}

          {emailSent && (
            <div className="mt-4 rounded-2xl border border-green-200 bg-white px-4 py-3 ring-1 ring-green-100">
              <p className="text-sm font-medium text-green-700">
                Login details were sent successfully to the teacher&apos;s email.
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

      <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <section className="rounded-[1.75rem] border border-emerald-100 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900">Add New Teacher</h2>
          <p className="mt-1 text-sm text-slate-600">
            Create a teacher account and assign a track.
          </p>

          <form action={createTeacher} className="mt-6 grid gap-4 md:grid-cols-3">
            <input
              name="name"
              type="text"
              placeholder="Full name"
              className="rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-green-600"
            />

            <input
              name="email"
              type="email"
              placeholder="Email address"
              className="rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-green-600"
            />

            <input
              name="track"
              type="text"
              placeholder="Track e.g. Web Design"
              className="rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-green-600"
            />

            <div className="md:col-span-3">
              <button
                type="submit"
                className="rounded-xl bg-green-700 px-5 py-3 font-semibold text-white transition hover:bg-green-800 active:scale-[0.98]"
              >
                Create Teacher
              </button>
            </div>
          </form>
        </section>

        <section className="rounded-[1.75rem] border border-emerald-100 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900">Search & Filters</h2>
          <p className="mt-1 text-sm text-slate-600">
            Search teachers by name or email and filter by track.
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
                href="/admin/teachers"
                className="flex-1 rounded-xl bg-slate-200 px-5 py-3 text-center font-semibold text-slate-800 hover:bg-slate-300"
              >
                Reset
              </a>
            </div>
          </form>
        </section>
      </section>

      <section className="grid gap-6">
        {teachers.length > 0 ? (
          teachers.map((teacher) => (
            <article
              key={teacher.id}
              className="rounded-[1.75rem] border border-emerald-100 bg-white p-6 shadow-sm transition hover:shadow-md"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <h3 className="text-xl font-bold text-slate-900">
                      {teacher.user.name}
                    </h3>

                    <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                      {teacher.user.role}
                    </span>
                  </div>

                  <div className="mt-3 grid gap-2 text-sm text-slate-600 sm:grid-cols-2">
                    <p>Email: {teacher.user.email}</p>
                    <p>Track: {teacher.track}</p>
                    <p>
                      Joined: {new Date(teacher.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="rounded-2xl bg-emerald-50 px-4 py-3 text-center ring-1 ring-emerald-100">
                  <p className="text-xs font-semibold uppercase tracking-[0.15em] text-emerald-700">
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
          <div className="rounded-[1.75rem] border border-emerald-100 bg-white p-6 shadow-sm">
            <p className="text-sm text-slate-600">
              No teachers matched your current filters.
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