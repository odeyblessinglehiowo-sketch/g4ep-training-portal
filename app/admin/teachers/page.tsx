import { db } from "@/lib/db";
import { createTeacher } from "./actions";

export default async function AdminTeachersPage({
  searchParams,
}: {
  searchParams: Promise<{
    created?: string;
    email?: string;
    password?: string;
  }>;
}) {
  const params = await searchParams;

  const teachers = await db.teacher.findMany({
    orderBy: {
      createdAt: "desc",
    },
    include: {
      user: true,
    },
  });

  const created = params.created === "1";
  const createdEmail = params.email;
  const createdPassword = params.password;

  return (
    <main className="space-y-6">
      <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-green-700">
          Teachers
        </p>

        <h1 className="mt-2 text-3xl font-bold text-slate-900">
          Manage Teachers
        </h1>

        <p className="mt-2 text-sm text-slate-600">
          Create teacher accounts and assign them to training tracks.
        </p>
      </section>

      {created && createdEmail && createdPassword && (
        <section className="rounded-3xl border border-green-200 bg-green-50 p-6 shadow-sm">
          <h2 className="text-lg font-bold text-green-800">
            Teacher created successfully
          </h2>

          <p className="mt-2 text-sm text-slate-700">
            Share these login details with the teacher.
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

      <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <h2 className="text-xl font-bold text-slate-900">
          Add New Teacher
        </h2>

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

      <section className="grid gap-6">
        {teachers.length > 0 ? (
          teachers.map((teacher) => (
            <div
              key={teacher.id}
              className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    {teacher.user.name}
                  </h3>

                  <p className="mt-2 text-sm text-slate-600">
                    Email: {teacher.user.email}
                  </p>

                  <p className="mt-1 text-sm text-slate-600">
                    Track: {teacher.track}
                  </p>

                  <p className="mt-1 text-sm text-slate-600">
                    Joined: {new Date(teacher.createdAt).toLocaleDateString()}
                  </p>
                </div>

                <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                  {teacher.user.role}
                </span>
              </div>
            </div>
          ))
        ) : (
          <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <p className="text-sm text-slate-600">
              No teachers found in the database yet.
            </p>
          </div>
        )}
      </section>
    </main>
  );
}