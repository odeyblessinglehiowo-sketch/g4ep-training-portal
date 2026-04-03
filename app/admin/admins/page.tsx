import { db } from "@/lib/db";
import { createAdmin } from "./actions";

export const dynamic = "force-dynamic";

export default async function AdminAdminsPage({
  searchParams,
}: {
  searchParams: Promise<{
    created?: string;
    email?: string;
    password?: string;
  }>;
}) {
  const params = await searchParams;

  const admins = await db.user.findMany({
    where: {
      role: "ADMIN",
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const created = params.created === "1";
  const createdEmail = params.email;
  const createdPassword = params.password;

  return (
    <main className="space-y-4">
      <section className="overflow-hidden border border-emerald-200 bg-gradient-to-r from-emerald-950 via-emerald-700 to-lime-500 px-4 py-4 text-white shadow-[0_18px_45px_-22px_rgba(16,185,129,0.55)] sm:px-5">
        <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-emerald-100/90">
          Admins
        </p>

        <h1 className="mt-1.5 text-xl font-bold sm:text-2xl">
          Manage Admin Accounts
        </h1>

        <p className="mt-2 text-xs text-emerald-50/90 sm:text-sm">
          Create and manage administrator accounts from one central workspace.
        </p>
      </section>

      {created && createdEmail && createdPassword && (
        <section className="border border-green-200 bg-green-50 p-4 shadow-sm">
          <p className="text-sm font-bold text-green-800">
            Admin created successfully
          </p>

          <p className="mt-1 text-sm text-slate-700">
            Share these login details with the admin.
          </p>

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

      <section className="border border-emerald-100 bg-white p-4 shadow-sm">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-emerald-700">
            Add Admin
          </p>
          <h2 className="mt-1 text-lg font-bold text-slate-900">
            New Admin Account
          </h2>
        </div>

        <p className="mt-1.5 text-xs text-slate-600 sm:text-sm">
          Create another administrator account.
        </p>

        <form action={createAdmin} className="mt-4 grid gap-3 md:grid-cols-2">
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

          <div className="md:col-span-2">
            <button
              type="submit"
              className="bg-green-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-green-800 active:scale-[0.98]"
            >
              Create Admin
            </button>
          </div>
        </form>
      </section>

      <section className="space-y-3">
        {admins.length > 0 ? (
          admins.map((admin) => (
            <article
              key={admin.id}
              className="border border-emerald-100 bg-white p-4 shadow-sm transition hover:shadow-md"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-base font-bold text-slate-900 sm:text-lg">
                      {admin.name}
                    </h3>

                    <span className="rounded-full bg-green-100 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-green-700">
                      {admin.role}
                    </span>
                  </div>

                  <div className="mt-2 grid gap-1.5 text-[11px] text-slate-600 sm:text-xs">
                    <p className="break-all">
                      <span className="font-semibold text-slate-700">Email:</span>{" "}
                      {admin.email}
                    </p>

                    <p>
                      <span className="font-semibold text-slate-700">Joined:</span>{" "}
                      {new Date(admin.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            </article>
          ))
        ) : (
          <div className="border border-emerald-100 bg-white p-4 shadow-sm">
            <p className="text-sm text-slate-600">
              No admin accounts found yet.
            </p>
          </div>
        )}
      </section>
    </main>
  );
}