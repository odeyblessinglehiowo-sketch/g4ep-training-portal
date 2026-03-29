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
      short: "Projects",
      badge: newSubmissionCount,
    },
  ];

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_#dcfce7,_#f8fafc_40%,_#ecfdf5_70%,_#d1fae5)]">
      <div className="mx-auto flex max-w-7xl gap-6 px-4 py-5 sm:px-6 lg:px-8">
        <aside className="hidden w-72 shrink-0 rounded-[2rem] border border-emerald-100 bg-white/90 p-6 shadow-lg shadow-emerald-100/40 backdrop-blur lg:block">
          <div className="rounded-[1.75rem] bg-gradient-to-br from-emerald-700 via-green-600 to-lime-500 p-5 text-white shadow-md">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-emerald-50/90">
              Teacher Panel
            </p>

            <h2 className="mt-3 text-2xl font-bold">G4EP RISE</h2>

            <p className="mt-2 text-sm leading-6 text-emerald-50/90">
              Manage your track, monitor students, upload learning resources,
              publish assignments, and review submissions.
            </p>
          </div>

          <PortalSideNav items={navItems} />

          <div className="mt-8 rounded-[1.75rem] border border-emerald-100 bg-gradient-to-r from-emerald-50 to-lime-50 p-4">
            <p className="text-sm font-semibold text-emerald-800">
              Teaching Tools
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-700">
              Use this space to manage attendance sessions, publish resources,
              create assignments, and review student performance across your
              assigned track.
            </p>
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          <div className="rounded-[2rem] border border-emerald-100 bg-white/90 p-4 shadow-sm backdrop-blur sm:p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-emerald-700">
                  Teacher Workspace
                </p>
                <h1 className="mt-2 text-2xl font-bold text-slate-900">
                  Track Management Hub
                </h1>
              </div>

              <div className="flex w-full items-center justify-between gap-3 lg:w-auto lg:justify-end">
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-sm font-semibold text-emerald-700">
                  Teacher
                </span>
                <LogoutButton />
              </div>
            </div>

            <MobileDashboardNav items={navItems} />
          </div>

          <div className="mt-5 space-y-6">{children}</div>
        </div>
      </div>
      <PortalFooter />
    </div>
  );
}