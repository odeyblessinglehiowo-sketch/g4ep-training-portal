
import LogoutButton from "@/components/logout-button";
import Link from "next/link";
import { ReactNode } from "react";

const navItems = [
  { name: "Teachers", href: "/admin/teachers" },
  { name: "Admins", href: "/admin/admins" },
  { name: "Dashboard", href: "/admin/dashboard" },
  { name: "Students", href: "/admin/students" },
  { name: "Resources", href: "/admin/resources" },
  { name: "Submissions", href: "/admin/submissions" },
  { name: "Certificates", href: "/admin/certificates" },
  { name: "Attendance", href: "/admin/attendance" },
  { name: "Attendance Leaderboard", href: "/admin/attendance/leaderboard" },
  { name: "Users", href: "/admin/users" },
];

export default function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-slate-50 to-green-100">

      <div className="mx-auto flex max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:px-8">

        {/* Sidebar */}
        <aside className="hidden w-72 shrink-0 rounded-3xl bg-white/90 backdrop-blur p-6 shadow-md ring-1 ring-slate-200 lg:block">

          <div className="border-b border-slate-200 pb-5">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-green-700">
              Admin Panel
            </p>

            <h2 className="mt-2 text-2xl font-bold text-slate-900">
              G4EP RISE
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-600">
              Manage students, resources, submissions, and certificates.
            </p>
          </div>

          {/* Navigation */}
          <nav className="mt-6 space-y-2">

            {navItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="group block rounded-xl px-4 py-3 text-sm font-medium text-slate-700 transition-all duration-200 hover:bg-green-100 hover:text-green-800 active:scale-[0.98]"
              >
                <span className="flex items-center justify-between">
                  {item.name}

                  <span className="opacity-0 transition group-hover:opacity-100 text-green-600">
                    →
                  </span>
                </span>
              </Link>
            ))}

          </nav>

          {/* Admin Note */}
          <div className="mt-8 rounded-2xl bg-gradient-to-r from-green-50 to-emerald-100 p-4 shadow-sm">
            <p className="text-sm font-semibold text-green-800">
              Admin Note
            </p>

            <p className="mt-2 text-sm leading-6 text-slate-700">
              Use this panel to monitor training activity and manage participant progress.
            </p>
          </div>

        </aside>

        {/* Main Content */}
        <div className="min-w-0 flex-1">

  {/* Top Navbar */}
  <div className="mb-6 flex items-center justify-between rounded-2xl bg-white/80 px-6 py-4 shadow-sm ring-1 ring-slate-200 backdrop-blur">

    <h1 className="text-lg font-semibold text-slate-800">
      Admin
    </h1>

    <div className="flex items-center gap-4">
      <span className="text-sm font-medium text-slate-600">
        Admin
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