import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  changeStudentPassword,
  updateStudentProfile,
} from "./actions";

export default async function StudentProfilePage({
  searchParams,
}: {
  searchParams: Promise<{
    updated?: string;
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

  return (
    <main className="space-y-6">
      <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-green-700">
          Profile
        </p>

        <h1 className="mt-2 text-3xl font-bold text-slate-900">
          My Profile
        </h1>

        <p className="mt-2 text-sm text-slate-600">
          View and update your student information and login details.
        </p>
      </section>

      {updated === "profile" && (
        <section className="rounded-3xl border border-green-200 bg-green-50 p-4 shadow-sm">
          <p className="font-semibold text-green-800">
            Profile updated successfully.
          </p>
          <p className="mt-1 text-sm text-slate-600">
            Your account information has been saved.
          </p>
        </section>
      )}

      {updated === "password" && (
        <section className="rounded-3xl border border-green-200 bg-green-50 p-4 shadow-sm">
          <p className="font-semibold text-green-800">
            Password updated successfully.
          </p>
          <p className="mt-1 text-sm text-slate-600">
            Your new password is now active.
          </p>
        </section>
      )}

      <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-slate-900">
            Account Information
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Update your basic profile details below.
          </p>
        </div>

        <form action={updateStudentProfile} className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Full Name
            </label>
            <input
              name="name"
              type="text"
              defaultValue={studentUser.name}
              className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-green-700"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Email Address
            </label>
            <input
              name="email"
              type="email"
              defaultValue={studentUser.email}
              className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-green-700"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Training Track
            </label>
            <input
              type="text"
              value={student.track ?? "Not assigned"}
              disabled
              className="w-full rounded-xl border border-slate-200 bg-slate-100 px-4 py-3 text-slate-600"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Account Role
            </label>
            <input
              type="text"
              value={studentUser.role}
              disabled
              className="w-full rounded-xl border border-slate-200 bg-slate-100 px-4 py-3 text-slate-600"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Joined On
            </label>
            <input
              type="text"
              value={new Date(student.createdAt).toLocaleDateString()}
              disabled
              className="w-full rounded-xl border border-slate-200 bg-slate-100 px-4 py-3 text-slate-600"
            />
          </div>

          <div className="md:col-span-2">
            <button
              type="submit"
              className="rounded-xl bg-green-700 px-5 py-3 font-semibold text-white transition hover:bg-green-800 active:scale-[0.98]"
            >
              Save Profile Changes
            </button>
          </div>
        </form>
      </section>

      <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-slate-900">
            Change Password
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Use a password you can remember but others can’t guess.
          </p>
        </div>

        <form action={changeStudentPassword} className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Current Password
            </label>
            <input
              name="currentPassword"
              type="password"
              placeholder="Enter current password"
              className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-green-700"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              New Password
            </label>
            <input
              name="newPassword"
              type="password"
              placeholder="Enter new password"
              className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-green-700"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Confirm New Password
            </label>
            <input
              name="confirmPassword"
              type="password"
              placeholder="Confirm new password"
              className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-green-700"
            />
          </div>

          <div className="md:col-span-2">
            <button
              type="submit"
              className="rounded-xl bg-red-700 px-5 py-3 font-semibold text-white transition hover:bg-red-800 active:scale-[0.98]"
            >
              Update Password
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}