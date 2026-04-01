import LogoutButton from "@/components/logout-button";
import { ReactNode } from "react";
import PortalFooter from "@/components/portal-footer";
import PortalSideNav from "@/components/portal-side-nav";
import MobileDashboardNav from "@/components/mobile-dashboard-nav";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";

export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  await requireRole("ADMIN");

  const pendingSubmissionCount = await db.submission.count({
    where: {
      status: "PENDING",
    },
  });

  const assignments = await db.assignment.findMany({
    where: {
      isPublished: true,
    },
    select: {
      track: true,
      views: {
        select: {
          seenAt: true,
        },
      },
    },
  });

  const studentCountsByTrackRows = await db.student.groupBy({
    by: ["track"],
    _count: {
      _all: true,
    },
  });

  const studentCountMap = new Map(
    studentCountsByTrackRows.map((row) => [row.track, row._count._all])
  );

  const unreadAssignmentBadgeCount = assignments.filter((assignment) => {
    const totalStudentsInTrack = studentCountMap.get(assignment.track) ?? 0;

    const seenCount = assignment.views.filter(
      (view) => view.seenAt !== null
    ).length;

    const unreadCount = Math.max(totalStudentsInTrack - seenCount, 0);

    return unreadCount > 0;
  }).length;

  const navItems = [
    { name: "Dashboard", href: "/admin/dashboard", short: "Home" },
    { name: "Students", href: "/admin/students", short: "Students" },
    { name: "Teachers", href: "/admin/teachers", short: "Teachers" },
    { name: "Admins", href: "/admin/admins", short: "Admins" },
    { name: "Resources", href: "/admin/resources", short: "Resources" },
    {
      name: "Assignments",
      href: "/admin/assignments",
      short: "Assignments",
      badge: unreadAssignmentBadgeCount,
    },
    {
      name: "Submissions",
      href: "/admin/submissions",
      short: "Projects",
      badge: pendingSubmissionCount,
    },
    { name: "Certificates", href: "/admin/certificates", short: "Certs" },
    { name: "Attendance", href: "/admin/attendance", short: "Attendance" },
    {
      name: "Leaderboard",
      href: "/admin/attendance/leaderboard",
      short: "Ranks",
    },
    { name: "Users", href: "/admin/users", short: "Users" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-lime-50">
      <div className="mx-auto flex max-w-[1400px] gap-5 px-4 py-4 sm:px-6 lg:px-8">
        <aside className="hidden w-64 shrink-0 rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm lg:block">
          <div className="rounded-xl bg-gradient-to-br from-emerald-800 via-green-700 to-lime-500 p-4 text-white">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-emerald-100">
              Admin Panel
            </p>

            <h2 className="mt-2 text-xl font-bold">G4EP RISE</h2>

            <p className="mt-2 text-xs leading-5 text-emerald-100">
              Manage users, training activities, and platform operations.
            </p>
          </div>

          <div className="mt-6">
            <PortalSideNav items={navItems} />
          </div>

          <div className="mt-6 rounded-xl border border-emerald-100 bg-emerald-50 p-3">
            <p className="text-xs font-semibold text-emerald-700">
              Admin Notice
            </p>
            <p className="mt-1 text-xs text-slate-600">
              Monitor activities, track progress, and ensure smooth training flow.
            </p>
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          <div className="rounded-2xl border border-emerald-100 bg-white px-4 py-3 shadow-sm sm:px-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-emerald-700">
                  Admin Workspace
                </p>
                <h1 className="text-lg font-semibold text-slate-900">
                  Command Center
                </h1>
              </div>

              <div className="hidden items-center gap-2 lg:flex">
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                  Admin
                </span>
                <LogoutButton />
              </div>

              <div className="lg:hidden">
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                  Admin
                </span>
              </div>
            </div>

            <div className="mt-3 lg:hidden">
              <MobileDashboardNav items={navItems} />
            </div>
          </div>

          <div className="mt-4 space-y-5">{children}</div>
        </div>
      </div>

      <PortalFooter />
    </div>
  );
}