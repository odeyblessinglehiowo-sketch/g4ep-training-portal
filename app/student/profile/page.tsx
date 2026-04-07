import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  changeStudentPassword,
  updateStudentProfile,
} from "./actions";

export const dynamic = "force-dynamic";

export default async function StudentProfilePage({
  searchParams,
}: {
  searchParams: Promise<{
    updated?: string;
    error?: string;
  }>;
}) {
  const params = await searchParams;
  const currentUser = await requireRole("STUDENT");

  const studentUser = await db.user.findUnique({
    where: {
      id: currentUser.userId,
    },
    include: {
      student: true,
    },
  });

  if (!studentUser || !studentUser.student) {
    throw new Error("Student profile not found.");
  }

  const student = studentUser.student;
  const updated = params.updated;
  const error = params.error;

  return (
    <main className="space-y-4">
      <section className="overflow-hidden border border-emerald-200 bg-gradient-to-r from-emerald-950 via-emerald-700 to-lime-500 px-4 py-3 text-white shadow-sm">
        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-emerald-100/90">
          Profile
        </p>

        <h1 className="mt-1 text-xl font-bold sm:text-2xl">
          My Profile
        </h1>

        <p className="mt-1 text-sm text-emerald-50/90">
          View and update your student information and login details.
        </p>
      </section>

      {error && (
        <section className="border border-red-200 bg-red-50 p-4 shadow-sm">
          <p className="text-sm font-semibold text-red-800">
            Action could not be completed
          </p>
          <p className="mt-1 text-sm text-slate-600">{error}</p>
        </section>
      )}

      {updated === "profile" && (
        <section className="border border-green-200 bg-green-50 p-4 shadow-sm">
          <p className="text-sm font-semibold text-green-800">
            Profile updated successfully.
          </p>
          <p className="mt-1 text-sm text-slate-600">
            Your account information has been saved.
          </p>
        </section>
      )}

      {updated === "password" && (
        <section className="border border-green-200 bg-green-50 p-4 shadow-sm">
          <p className="text-sm font-semibold text-green-800">
            Password updated successfully.
          </p>
          <p className="mt-1 text-sm text-slate-600">
            Your new password is now active.
          </p>
        </section>
      )}

      <section className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <section className="border border-emerald-100 bg-white p-4 shadow-sm">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-emerald-700">
              Account Information
            </p>
            <h2 className="mt-1 text-lg font-bold text-slate-900">
              Profile Details
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Update your personal account details below.
            </p>
          </div>

          <form action={updateStudentProfile} className="mt-4 grid gap-3 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-600">
                Full Name
              </label>
              <input
                name="name"
                type="text"
                defaultValue={studentUser.name}
                className="w-full border border-emerald-100 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-600">
                Email Address
              </label>
              <input
                name="email"
                type="email"
                defaultValue={studentUser.email}
                className="w-full border border-emerald-100 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-600">
                Training Track
              </label>
              <input
                type="text"
                value={student.track ?? "Not assigned"}
                disabled
                className="w-full border border-emerald-100 bg-emerald-50/40 px-3 py-2.5 text-sm text-slate-600"
              />
            </div>

            <div>
              <label className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-600">
                Account Role
              </label>
              <input
                type="text"
                value={studentUser.role}
                disabled
                className="w-full border border-emerald-100 bg-emerald-50/40 px-3 py-2.5 text-sm text-slate-600"
              />
            </div>

            <div>
              <label className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-600">
                Joined On
              </label>
              <input
                type="text"
                value={new Date(student.createdAt).toLocaleDateString()}
                disabled
                className="w-full border border-emerald-100 bg-emerald-50/40 px-3 py-2.5 text-sm text-slate-600"
              />
            </div>

            <div className="md:col-span-2">
              <button
                type="submit"
                className="bg-emerald-700 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-800"
              >
                Save Profile Changes
              </button>
            </div>
          </form>
        </section>

        <section className="border border-emerald-100 bg-white p-4 shadow-sm">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-emerald-700">
              Password Settings
            </p>
            <h2 className="mt-1 text-lg font-bold text-slate-900">
              Change Password
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Use a password you can remember but others can’t guess.
            </p>
          </div>

          <form action={changeStudentPassword} className="mt-4 grid gap-3">
            <div>
              <label className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-600">
                Current Password
              </label>
              <input
                name="currentPassword"
                type="password"
                placeholder="Enter current password"
                className="w-full border border-emerald-100 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-600">
                New Password
              </label>
              <input
                name="newPassword"
                type="password"
                placeholder="Enter new password"
                className="w-full border border-emerald-100 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-600">
                Confirm New Password
              </label>
              <input
                name="confirmPassword"
                type="password"
                placeholder="Confirm new password"
                className="w-full border border-emerald-100 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-emerald-500"
              />
            </div>

            <div>
              <button
                type="submit"
                className="bg-red-700 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-red-800"
              >
                Update Password
              </button>
            </div>
          </form>
        </section>
      </section>
    </main>
  );
}