import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  
  deleteUser,
  resetUserPassword,
  toggleUserStatus,
} from "./actions";

export const dynamic = "force-dynamic";

const PER_PAGE_OPTIONS = [10, 25, 50, 100];

function buildUsersUrl(params: {
  q?: string;
  role?: string;
  track?: string;
  status?: string;
  page?: number;
  perPage?: number;
}) {
  const search = new URLSearchParams();

  if (params.q && params.q.trim()) search.set("q", params.q.trim());
  if (params.role && params.role !== "ALL") search.set("role", params.role);
  if (params.track && params.track !== "ALL") search.set("track", params.track);
  if (params.status && params.status !== "ALL") search.set("status", params.status);
  if (params.page && params.page > 1) search.set("page", String(params.page));
  if (params.perPage) search.set("perPage", String(params.perPage));

  const query = search.toString();
  return query ? `/admin/users?${query}` : "/admin/users";
}

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
    page?: string;
    perPage?: string;
  }>;
}) {
  const currentAdmin = await requireRole("ADMIN");
  const params = await searchParams;

  const q = params.q?.trim() ?? "";
  const role = params.role ?? "ALL";
  const track = params.track ?? "ALL";
  const status = params.status ?? "ALL";

  const rawPage = Number(params.page ?? "1");
  const rawPerPage = Number(params.perPage ?? "10");

  const perPage = PER_PAGE_OPTIONS.includes(rawPerPage) ? rawPerPage : 10;
  const page = Number.isFinite(rawPage) && rawPage > 0 ? rawPage : 1;

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

  const whereClause = {
    AND: [
      q
        ? {
            OR: [
              {
                name: {
                  contains: q,
                  mode: "insensitive" as const,
                },
              },
              {
                email: {
                  contains: q,
                  mode: "insensitive" as const,
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
  };

  const totalFilteredUsers = await db.user.count({
    where: whereClause,
  });

  const totalPages = Math.max(1, Math.ceil(totalFilteredUsers / perPage));
  const currentPage = Math.min(page, totalPages);
  const skip = (currentPage - 1) * perPage;

  const users = await db.user.findMany({
    where: whereClause,
    orderBy: {
      createdAt: "desc",
    },
    skip,
    take: perPage,
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

  const hasPreviousPage = currentPage > 1;
  const hasNextPage = currentPage < totalPages;

  return (
    <main className="space-y-4">
      <section className="overflow-hidden border border-emerald-200 bg-gradient-to-r from-emerald-950 via-emerald-700 to-lime-500 px-4 py-4 text-white shadow-[0_18px_45px_-22px_rgba(16,185,129,0.55)] sm:px-5">
        <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-emerald-100/90">
          User Management
        </p>

        <h1 className="mt-1.5 text-xl font-bold sm:text-2xl">
          All Portal Users
        </h1>

        <p className="mt-2 text-xs text-emerald-50/90 sm:text-sm">
          Manage students, teachers, and administrators from one central workspace.
        </p>
      </section>

      <section className="grid grid-cols-2 gap-2.5 xl:grid-cols-4">
        <StatCard
          label="Total Users"
          value={totalUsers}
          note="All portal accounts"
          soft="from-emerald-50 to-white"
          border="border-emerald-100"
          line="from-emerald-600 to-green-500"
          valueColor="text-emerald-800"
        />
        <StatCard
          label="Active Users"
          value={activeUsers}
          note="Enabled accounts"
          soft="from-green-50 to-white"
          border="border-green-100"
          line="from-green-600 to-emerald-600"
          valueColor="text-green-700"
        />
        <StatCard
          label="Disabled Users"
          value={disabledUsers}
          note="Currently blocked"
          soft="from-red-50 to-white"
          border="border-red-100"
          line="from-red-500 to-rose-500"
          valueColor="text-red-600"
        />
        <StatCard
          label="Active Admins"
          value={activeAdmins}
          note="Enabled admin accounts"
          soft="from-lime-50 to-white"
          border="border-lime-100"
          line="from-lime-500 to-emerald-500"
          valueColor="text-lime-700"
        />
      </section>

      {error && (
        <section className="border border-red-200 bg-red-50 p-4 shadow-sm">
          <p className="text-sm font-bold text-red-800">
            Action could not be completed
          </p>
          <p className="mt-1 text-sm text-slate-700">{error}</p>
        </section>
      )}

      {success === "status" && successName && successState && (
        <section className="border border-green-200 bg-green-50 p-4 shadow-sm">
          <p className="text-sm font-bold text-green-800">
            Action completed successfully
          </p>
          <p className="mt-1 text-sm text-slate-700">
            {successName}&apos;s account has been {successState}.
          </p>
        </section>
      )}

      {success === "reset" && successName && successEmail && (
        <section className="border border-green-200 bg-green-50 p-4 shadow-sm">
          <p className="text-sm font-bold text-green-800">
            Password reset successfully
          </p>
          <p className="mt-1 text-sm text-slate-700">
            A new temporary password has been sent to {successName} at {successEmail}.
          </p>
        </section>
      )}

      {success === "deleted" && successName && (
        <section className="border border-green-200 bg-green-50 p-4 shadow-sm">
          <p className="text-sm font-bold text-green-800">
            User deleted successfully
          </p>
          <p className="mt-1 text-sm text-slate-700">
            {successName}&apos;s account has been permanently deleted.
          </p>
        </section>
      )}

      <section className="border border-emerald-100 bg-white p-4 shadow-sm">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-emerald-700">
            Search & Filters
          </p>
          <h2 className="mt-1 text-lg font-bold text-slate-900">
            Filter Users
          </h2>
        </div>

        <p className="mt-1.5 text-xs text-slate-600 sm:text-sm">
          Find users by name, email, role, track, or account status.
        </p>

        <form className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          <input
            name="q"
            type="text"
            defaultValue={q}
            placeholder="Search name or email"
            className="border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-green-600"
          />

          <select
            name="role"
            defaultValue={role}
            className="border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-green-600"
          >
            <option value="ALL">All Roles</option>
            <option value="ADMIN">Admins</option>
            <option value="TEACHER">Teachers</option>
            <option value="STUDENT">Students</option>
          </select>

          <select
            name="track"
            defaultValue={track}
            className="border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-green-600"
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
            className="border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-green-600"
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="DISABLED">Disabled</option>
          </select>

          <input type="hidden" name="perPage" value={perPage} />

          <div className="grid grid-cols-2 gap-2">
            <button
              type="submit"
              className="bg-green-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-green-800"
            >
              Apply
            </button>

            <a
              href="/admin/users"
              className="bg-slate-200 px-4 py-2.5 text-center text-sm font-semibold text-slate-800 transition hover:bg-slate-300"
            >
              Reset
            </a>
          </div>
        </form>
      </section>

      <section className="overflow-hidden border border-emerald-100 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] border-collapse">
            <thead className="bg-emerald-50/70">
              <tr className="text-left text-sm text-slate-600">
                <th className="px-4 py-4 font-semibold">Name</th>
                <th className="px-4 py-4 font-semibold">Email</th>
                <th className="px-4 py-4 font-semibold">Role</th>
                <th className="px-4 py-4 font-semibold">Track</th>
                <th className="px-4 py-4 font-semibold">Status</th>
                <th className="px-4 py-4 font-semibold">Actions</th>
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
                  const deleteBlocked = isSelf || isLastActiveAdmin;
                  const toggleLabel = user.isActive ? "Disable" : "Enable";

                  return (
                    <tr
                      key={user.id}
                      className={`border-t border-slate-100 align-top transition hover:bg-emerald-50/40 ${
                        index % 2 === 0 ? "bg-white" : "bg-slate-50/30"
                      }`}
                    >
                      <td className="px-4 py-4 font-medium text-slate-900">
                        <div className="flex flex-col">
                          <span>{user.name}</span>
                          {isSelf && (
                            <span className="mt-1 text-xs font-medium text-amber-700">
                              Current session
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="px-4 py-4 text-slate-700">{user.email}</td>

                      <td className="px-4 py-4">
                        <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                          {user.role}
                        </span>
                      </td>

                      <td className="px-4 py-4 text-slate-700">{userTrack}</td>

                      <td className="px-4 py-4">
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

                      <td className="px-4 py-4">
                        <div className="flex flex-wrap gap-2">
                          <form action={toggleUserStatus}>
                            <input type="hidden" name="userId" value={user.id} />
                            <input type="hidden" name="q" value={q} />
                            <input type="hidden" name="role" value={role} />
                            <input type="hidden" name="track" value={track} />
                            <input type="hidden" name="status" value={status} />
                            <input type="hidden" name="page" value={currentPage} />
                            <input type="hidden" name="perPage" value={perPage} />

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
                              className={`px-3 py-2 text-xs font-semibold text-white transition ${
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
                            <input type="hidden" name="page" value={currentPage} />
                            <input type="hidden" name="perPage" value={perPage} />

                            <button
                              type="submit"
                              disabled={resetBlocked}
                              title={
                                isSelf
                                  ? "You cannot reset the password of the account you are currently using from this page"
                                  : "Reset this user's password"
                              }
                              className={`px-3 py-2 text-xs font-semibold text-white transition ${
                                resetBlocked
                                  ? "cursor-not-allowed bg-slate-400"
                                  : "bg-slate-900 hover:bg-slate-800"
                              }`}
                            >
                              Reset Password
                            </button>
                          </form>

                          <form action={deleteUser}>
                            <input type="hidden" name="userId" value={user.id} />
                            <input type="hidden" name="q" value={q} />
                            <input type="hidden" name="role" value={role} />
                            <input type="hidden" name="track" value={track} />
                            <input type="hidden" name="status" value={status} />
                            <input type="hidden" name="page" value={currentPage} />
                            <input type="hidden" name="perPage" value={perPage} />

                            <button
                              type="submit"
                              disabled={deleteBlocked}
                              title={
                                isSelf
                                  ? "You cannot delete the account you are currently using"
                                  : isLastActiveAdmin
                                  ? "You cannot delete the last active admin"
                                  : "Delete this user permanently"
                              }
                              className={`px-3 py-2 text-xs font-semibold text-white transition ${
                                deleteBlocked
                                  ? "cursor-not-allowed bg-red-300"
                                  : "bg-red-700 hover:bg-red-800"
                              }`}
                            >
                              Delete
                            </button>
                          </form>
                        </div>

                        {isSelf && user.isActive && (
                          <div className="mt-2 space-y-1 text-xs text-slate-500">
                            <p>You cannot disable or delete the account you are currently using.</p>
                            <p>You also cannot reset its password from this page.</p>
                          </div>
                        )}

                        {!isSelf && isLastActiveAdmin && (
                          <p className="mt-2 text-xs text-slate-500">
                            This admin cannot be disabled or deleted because they are the last active admin.
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
                    className="px-4 py-8 text-center text-sm text-slate-600"
                  >
                    No users matched your current filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="border border-emerald-100 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {hasPreviousPage ? (
              <a
                href={buildUsersUrl({
                  q,
                  role,
                  track,
                  status,
                  page: currentPage - 1,
                  perPage,
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
                href={buildUsersUrl({
                  q,
                  role,
                  track,
                  status,
                  page: currentPage + 1,
                  perPage,
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
            <input type="hidden" name="q" value={q} />
            <input type="hidden" name="role" value={role} />
            <input type="hidden" name="track" value={track} />
            <input type="hidden" name="status" value={status} />
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
              {PER_PAGE_OPTIONS.map((option) => (
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
          Total results: {totalFilteredUsers} • Page {currentPage} of {totalPages}
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