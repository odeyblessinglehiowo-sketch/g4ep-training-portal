import Link from "next/link";
import { ReactNode } from "react";
import { requireRole } from "@/lib/auth";
import LogoutButton from "@/components/logout-button";

const navItems = [
  { name: "Dashboard", href: "/teacher/dashboard" },
  { name: "Students", href: "/teacher/students" },
  { name: "Resources", href: "/teacher/resources" },
  { name: "Attendance", href: "/teacher/attendance" },
  { name: "Submissions", href: "/teacher/submissions" },
];

export default async function TeacherLayout({
  children,
}: {
  children: ReactNode;
}) {
  await requireRole("TEACHER");

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-slate-50 to-green-100">
      <div className="mx-auto flex max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <aside className="hidden w-72 shrink-0 rounded-3xl bg-white/90 p-6 shadow-md ring-1 ring-slate-200 backdrop-blur lg:block">
          <div className="border-b border-slate-200 pb-5">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-green-700">
              Teacher Panel
            </p>

            <h2 className="mt-2 text-2xl font-bold text-slate-900">
              G4EP RISE
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-600">
              Manage your track, students, resources, attendance, and submissions.
            </p>
          </div>

          <nav className="mt-6 space-y-2">
            {navItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="group block rounded-xl px-4 py-3 text-sm font-medium text-slate-700 transition-all duration-200 hover:bg-green-100 hover:text-green-800 active:scale-[0.98]"
              >
                <span className="flex items-center justify-between">
                  {item.name}
                  <span className="text-green-600 opacity-0 transition group-hover:opacity-100">
                    →
                  </span>
                </span>
              </Link>
            ))}
          </nav>

          <div className="mt-8 rounded-2xl bg-gradient-to-r from-green-50 to-emerald-100 p-4 shadow-sm">
            <p className="text-sm font-semibold text-green-800">
              Teaching Tools
            </p>

            <p className="mt-2 text-sm leading-6 text-slate-700">
              Use this panel to manage your track resources, track attendance,
              and review student project submissions.
            </p>
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          <div className="mb-6 flex items-center justify-between rounded-2xl bg-white/80 px-6 py-4 shadow-sm ring-1 ring-slate-200 backdrop-blur">
            <h1 className="text-lg font-semibold text-slate-800">
              Teacher
            </h1>

            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-slate-600">
                Teacher
              </span>

              <LogoutButton />
            </div>
          </div>

          {children}
        </div>
      </div>
    </div>
  );
}