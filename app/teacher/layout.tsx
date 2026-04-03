import { ReactNode } from "react";
import { requireRole } from "@/lib/auth";
import LogoutButton from "@/components/logout-button";
import PortalFooter from "@/components/portal-footer";
import PortalSideNav from "@/components/portal-side-nav";
import MobileDashboardNav from "@/components/mobile-dashboard-nav";
import { db } from "@/lib/db";

export default async function TeacherLayout({
  children,
}: {
  children: ReactNode;
}) {
  const currentUser = await requireRole("TEACHER");

  const teacherUser = await db.user.findUnique({
    where: {
      id: currentUser.userId,
    },
    include: {
      teacher: true,
    },
  });

  const teacher = teacherUser?.teacher;

  const newSubmissionCount = teacher
    ? await db.submission.count({
        where: {
          student: {
            track: teacher.track,
          },
          teacherNotifiedAt: null,
        },
      })
    : 0;

  const navItems = [
    { name: "Dashboard", href: "/teacher/dashboard", short: "Home" },
    { name: "Students", href: "/teacher/students", short: "Students" },
    { name: "Resources", href: "/teacher/resources", short: "Resources" },
    {
      name: "Assignments",
      href: "/teacher/assignments",
      short: "Assignments",
    },
    { name: "Attendance", href: "/teacher/attendance", short: "Attendance" },
    {
      name: "Submissions",
      href: "/teacher/submissions",
      short: "Submissions",
      badge: newSubmissionCount,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-lime-50">
      <div className="mx-auto flex max-w-[1400px] gap-4 px-3 py-3 sm:px-6 lg:px-8">
        <aside className="hidden w-64 shrink-0 border border-emerald-100 bg-white p-5 shadow-sm lg:block">
          <div className="bg-gradient-to-br from-emerald-800 via-green-700 to-lime-500 p-4 text-white">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-emerald-100">
              Teacher Panel
            </p>

            <h2 className="mt-2 text-xl font-bold">G4EP RISE</h2>

            <p className="mt-2 text-xs leading-5 text-emerald-100">
              Manage your track, assignments, attendance, resources, and submissions.
            </p>
          </div>

          <div className="mt-6">
            <PortalSideNav items={navItems} />
          </div>

          <div className="mt-6 border border-emerald-100 bg-emerald-50 p-3">
            <p className="text-xs font-semibold text-emerald-700">
              Teaching Tools
            </p>
            <p className="mt-1 text-xs text-slate-600">
              Use this space to manage students, publish resources, track attendance, and review submissions.
            </p>
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          <div className="border border-emerald-100 bg-white px-3 py-2 shadow-sm sm:px-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-emerald-700">
                  Teacher Workspace
                </p>
                <h1 className="mt-1 text-base font-semibold text-slate-900 sm:text-lg">
                  Track Management Hub
                </h1>
              </div>

              <div className="hidden items-center gap-2 lg:flex">
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                  Teacher
                </span>
                <LogoutButton />
              </div>

              <div className="lg:hidden">
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                  Teacher
                </span>
              </div>
            </div>

            <div className="mt-2 lg:hidden">
              <MobileDashboardNav items={navItems} />
            </div>
          </div>

          <div className="mt-3 space-y-4">{children}</div>
        </div>
      </div>

      <PortalFooter />
    </div>
  );
}