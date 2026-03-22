import { requireRole } from "@/lib/auth";
export const dynamic = "force-dynamic";
import { db } from "@/lib/db";
import { resetUserPassword, toggleUserStatus } from "./actions";

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
      <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-green-700">
          User Management
        </p>

        <h1 className="mt-2 text-3xl font-bold text-slate-900">
          All Portal Users
        </h1>

        <p className="mt-2 text-sm text-slate-600">
          Manage students, teachers, and administrators from one place.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <p className="text-sm font-medium text-slate-500">Total Users</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">{totalUsers}</p>
        </div>

        <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <p className="text-sm font-medium text-slate-500">Active Users</p>
          <p className="mt-2 text-3xl font-bold text-green-700">{activeUsers}</p>
        </div>

        <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <p className="text-sm font-medium text-slate-500">Disabled Users</p>
          <p className="mt-2 text-3xl font-bold text-red-600">
            {disabledUsers}
          </p>
        </div>

        <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <p className="text-sm font-medium text-slate-500">Active Admins</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">
            {activeAdmins}
          </p>
        </div>
      </section>

      {error && (
        <section className="rounded-3xl border border-red-200 bg-red-50 p-5 shadow-sm ring-1 ring-red-100">
          <p className="text-base font-bold text-red-800">
            Action could not be completed
          </p>
          <p className="mt-1 text-sm text-slate-700">{error}</p>
        </section>
      )}

      {success === "status" && successName && successState && (
        <section className="rounded-3xl border border-green-200 bg-green-50 p-5 shadow-sm ring-1 ring-green-100">
          <p className="text-base font-bold text-green-800">
            Action completed successfully
          </p>
          <p className="mt-1 text-sm text-slate-700">
            {successName}&apos;s account has been {successState}.
          </p>
        </section>
      )}

      {success === "reset" && successName && successEmail && (
        <section className="rounded-3xl border border-green-200 bg-green-50 p-5 shadow-sm ring-1 ring-green-100">
          <p className="text-base font-bold text-green-800">
            Password reset successfully
          </p>
          <p className="mt-1 text-sm text-slate-700">
            A new temporary password has been sent to {successName} at{" "}
            {successEmail}.
          </p>
        </section>
      )}

      <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
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

      <section className="overflow-x-auto rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-slate-200 text-left text-sm text-slate-600">
              <th className="py-3 pr-4">Name</th>
              <th className="py-3 pr-4">Email</th>
              <th className="py-3 pr-4">Role</th>
              <th className="py-3 pr-4">Track</th>
              <th className="py-3 pr-4">Status</th>
              <th className="py-3">Actions</th>
            </tr>
          </thead>

          <tbody className="text-sm">
            {users.length > 0 ? (
              users.map((user) => {
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
                    className="border-b border-slate-100 transition hover:bg-slate-50"
                  >
                    <td className="py-4 pr-4 font-medium text-slate-900">
                      <div className="flex flex-col">
                        <span>{user.name}</span>
                        {isSelf && (
                          <span className="mt-1 text-xs font-medium text-amber-700">
                            Current session
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="py-4 pr-4 text-slate-700">{user.email}</td>

                    <td className="py-4 pr-4">
                      <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                        {user.role}
                      </span>
                    </td>

                    <td className="py-4 pr-4 text-slate-700">{userTrack}</td>

                    <td className="py-4 pr-4">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          user.isActive
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {user.isActive ? "ACTIVE" : "DISABLED"}
                      </span>
                    </td>

                    <td className="py-4">
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
                            className={`rounded-lg px-3 py-2 text-xs font-semibold text-white transition duration-200 active:scale-[0.95] active:shadow-inner ${
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
                            className={`rounded-lg px-3 py-2 text-xs font-semibold text-white transition duration-200 active:scale-[0.95] active:shadow-inner ${
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
                          <p>
                            You cannot disable the account you are currently
                            using.
                          </p>
                          <p>
                            You also cannot reset its password from this page.
                          </p>
                        </div>
                      )}

                      {!isSelf && isLastActiveAdmin && (
                        <p className="mt-2 text-xs text-slate-500">
                          This admin cannot be disabled because they are the
                          last active admin.
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
                  className="py-6 text-center text-sm text-slate-600"
                >
                  No users matched your current filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>
    </main>
  );
}