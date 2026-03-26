import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { resetUserPassword, toggleUserStatus } from "./actions";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    role?: string;
    track?: string;
    status?: string;
    success?: string;
    error?: string;
    name?: string;
    email?: string;
    state?: string;
  }>;
}) {
  const currentAdmin = await requireRole("ADMIN");
  const params = await searchParams;

  const q = params.q?.trim() ?? "";
  const role = params.role ?? "ALL";
  const track = params.track ?? "ALL";
  const status = params.status ?? "ALL";

  const students = await db.student.findMany({
    select: {
      track: true,
    },
    distinct: ["track"],
  });

  const teachers = await db.teacher.findMany({
    select: {
      track: true,
    },
    distinct: ["track"],
  });

  const trackOptions = Array.from(
    new Set([...students.map((s) => s.track), ...teachers.map((t) => t.track)])
  ).sort();

  const users = await db.user.findMany({
    where: {
      AND: [
        q
          ? {
              OR: [
                {
                  name: {
                    contains: q,
                  },
                },
                {
                  email: {
                    contains: q,
                  },
                },
              ],
            }
          : {},
        role !== "ALL"
          ? {
              role: role as "ADMIN" | "TEACHER" | "STUDENT",
            }
          : {},
        status === "ACTIVE"
          ? { isActive: true }
          : status === "DISABLED"
          ? { isActive: false }
          : {},
        track !== "ALL"
          ? {
              OR: [
                {
                  student: {
                    track,
                  },
                },
                {
                  teacher: {
                    track,
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
      student: true,
      teacher: true,
    },
  });

  const totalUsers = await db.user.count();
  const activeUsers = await db.user.count({
    where: { isActive: true },
  });
  const disabledUsers = await db.user.count({
    where: { isActive: false },
  });
  const activeAdmins = await db.user.count({
    where: {
      role: "ADMIN",
      isActive: true,
    },
  });

  const success = params.success;
  const error = params.error;
  const successName = params.name;
  const successEmail = params.email;
  const successState = params.state;

  return (
    <main className="space-y-6">
      <section className="overflow-hidden rounded-[2rem] bg-gradient-to-r from-emerald-900 via-green-700 to-lime-500 p-6 text-white shadow-lg shadow-emerald-200/50 sm:p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-50/90">
          User Management
        </p>

        <h1 className="mt-3 text-3xl font-bold sm:text-4xl">
          All Portal Users
        </h1>

        <p className="mt-4 max-w-3xl text-sm leading-7 text-emerald-50/90 sm:text-base">
          Manage students, teachers, and administrators from one place with
          quick filtering, secure account actions, and password reset support.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Users" value={totalUsers} />
        <StatCard
          label="Active Users"
          value={activeUsers}
          tone="bg-emerald-50"
          valueClass="text-emerald-700"
        />
        <StatCard
          label="Disabled Users"
          value={disabledUsers}
          tone="bg-red-50"
          valueClass="text-red-600"
        />
        <StatCard
          label="Active Admins"
          value={activeAdmins}
          tone="bg-lime-50"
          valueClass="text-lime-700"
        />
      </section>

      {error && (
        <section className="rounded-[1.75rem] border border-red-200 bg-red-50 p-5 shadow-sm ring-1 ring-red-100">
          <p className="text-base font-bold text-red-800">
            Action could not be completed
          </p>
          <p className="mt-1 text-sm text-slate-700">{error}</p>
        </section>
      )}

      {success === "status" && successName && successState && (
        <section className="rounded-[1.75rem] border border-green-200 bg-green-50 p-5 shadow-sm ring-1 ring-green-100">
          <p className="text-base font-bold text-green-800">
            Action completed successfully
          </p>
          <p className="mt-1 text-sm text-slate-700">
            {successName}&apos;s account has been {successState}.
          </p>
        </section>
      )}

      {success === "reset" && successName && successEmail && (
        <section className="rounded-[1.75rem] border border-green-200 bg-green-50 p-5 shadow-sm ring-1 ring-green-100">
          <p className="text-base font-bold text-green-800">
            Password reset successfully
          </p>
          <p className="mt-1 text-sm text-slate-700">
            A new temporary password has been sent to {successName} at{" "}
            {successEmail}.
          </p>
        </section>
      )}

      <section className="rounded-[1.75rem] border border-emerald-100 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-bold text-slate-900">Search & Filters</h2>
        <p className="mt-1 text-sm text-slate-600">
          Find users by name, email, role, track, or account status.
        </p>

        <form className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <input
            name="q"
            type="text"
            defaultValue={q}
            placeholder="Search name or email"
            className="rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-green-600"
          />

          <select
            name="role"
            defaultValue={role}
            className="rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-green-600"
          >
            <option value="ALL">All Roles</option>
            <option value="ADMIN">Admins</option>
            <option value="TEACHER">Teachers</option>
            <option value="STUDENT">Students</option>
          </select>

          <select
            name="track"
            defaultValue={track}
            className="rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-green-600"
          >
            <option value="ALL">All Tracks</option>
            {trackOptions.map((trackOption) => (
              <option key={trackOption} value={trackOption}>
                {trackOption}
              </option>
            ))}
          </select>

          <select
            name="status"
            defaultValue={status}
            className="rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-green-600"
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="DISABLED">Disabled</option>
          </select>

          <div className="flex gap-3">
            <button
              type="submit"
              className="flex-1 rounded-xl bg-green-700 px-5 py-3 font-semibold text-white transition duration-200 hover:bg-green-800 active:scale-[0.97] active:shadow-inner"
            >
              Apply
            </button>

            <a
              href="/admin/users"
              className="flex-1 rounded-xl bg-slate-200 px-5 py-3 text-center font-semibold text-slate-800 transition duration-200 hover:bg-slate-300 active:scale-[0.97] active:shadow-inner"
            >
              Reset
            </a>
          </div>
        </form>
      </section>

      <section className="overflow-hidden rounded-[1.75rem] border border-emerald-100 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] border-collapse">
            <thead className="bg-emerald-50/70">
              <tr className="text-left text-sm text-slate-600">
                <th className="px-6 py-4 font-semibold">Name</th>
                <th className="px-6 py-4 font-semibold">Email</th>
                <th className="px-6 py-4 font-semibold">Role</th>
                <th className="px-6 py-4 font-semibold">Track</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold">Actions</th>
              </tr>
            </thead>

            <tbody className="text-sm">
              {users.length > 0 ? (
                users.map((user, index) => {
                  const userTrack =
                    user.student?.track ?? user.teacher?.track ?? "Not assigned";

                  const isSelf = user.id === currentAdmin.userId;
                  const isLastActiveAdmin =
                    user.role === "ADMIN" && user.isActive && activeAdmins <= 1;

                  const disableBlocked = isSelf || isLastActiveAdmin;
                  const resetBlocked = isSelf;
                  const toggleLabel = user.isActive ? "Disable" : "Enable";

                  return (
                    <tr
                      key={user.id}
                      className={`border-t border-slate-100 align-top transition hover:bg-emerald-50/40 ${
                        index % 2 === 0 ? "bg-white" : "bg-slate-50/30"
                      }`}
                    >
                      <td className="px-6 py-5 font-medium text-slate-900">
                        <div className="flex flex-col">
                          <span>{user.name}</span>
                          {isSelf && (
                            <span className="mt-1 text-xs font-medium text-amber-700">
                              Current session
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="px-6 py-5 text-slate-700">{user.email}</td>

                      <td className="px-6 py-5">
                        <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                          {user.role}
                        </span>
                      </td>

                      <td className="px-6 py-5 text-slate-700">{userTrack}</td>

                      <td className="px-6 py-5">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${
                            user.isActive
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {user.isActive ? "ACTIVE" : "DISABLED"}
                        </span>
                      </td>

                      <td className="px-6 py-5">
                        <div className="flex flex-wrap gap-2">
                          <form action={toggleUserStatus}>
                            <input type="hidden" name="userId" value={user.id} />
                            <input type="hidden" name="q" value={q} />
                            <input type="hidden" name="role" value={role} />
                            <input type="hidden" name="track" value={track} />
                            <input type="hidden" name="status" value={status} />

                            <button
                              type="submit"
                              disabled={user.isActive && disableBlocked}
                              title={
                                isSelf
                                  ? "You cannot disable your own account"
                                  : isLastActiveAdmin
                                  ? "You cannot disable the last active admin"
                                  : `${toggleLabel} this account`
                              }
                              className={`rounded-xl px-3 py-2 text-xs font-semibold text-white transition ${
                                user.isActive
                                  ? disableBlocked
                                    ? "cursor-not-allowed bg-red-300"
                                    : "bg-red-600 hover:bg-red-700"
                                  : "bg-green-600 hover:bg-green-700"
                              }`}
                            >
                              {toggleLabel}
                            </button>
                          </form>

                          <form action={resetUserPassword}>
                            <input type="hidden" name="userId" value={user.id} />
                            <input type="hidden" name="q" value={q} />
                            <input type="hidden" name="role" value={role} />
                            <input type="hidden" name="track" value={track} />
                            <input type="hidden" name="status" value={status} />

                            <button
                              type="submit"
                              disabled={resetBlocked}
                              title={
                                isSelf
                                  ? "You cannot reset the password of the account you are currently using from this page"
                                  : "Reset this user's password"
                              }
                              className={`rounded-xl px-3 py-2 text-xs font-semibold text-white transition ${
                                resetBlocked
                                  ? "cursor-not-allowed bg-slate-400"
                                  : "bg-slate-900 hover:bg-slate-800"
                              }`}
                            >
                              Reset Password
                            </button>
                          </form>
                        </div>

                        {isSelf && user.isActive && (
                          <div className="mt-2 space-y-1 text-xs text-slate-500">
                            <p>You cannot disable the account you are currently using.</p>
                            <p>You also cannot reset its password from this page.</p>
                          </div>
                        )}

                        {!isSelf && isLastActiveAdmin && (
                          <p className="mt-2 text-xs text-slate-500">
                            This admin cannot be disabled because they are the last active admin.
                          </p>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-8 text-center text-sm text-slate-600"
                  >
                    No users matched your current filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
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