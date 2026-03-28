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
      id: true,
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
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_#dcfce7,_#f8fafc_40%,_#ecfdf5_70%,_#d1fae5)]">
      <div className="mx-auto flex max-w-7xl gap-6 px-4 py-5 sm:px-6 lg:px-8">
        <aside className="hidden w-72 shrink-0 rounded-[2rem] border border-emerald-100 bg-white/90 p-6 shadow-lg shadow-emerald-100/40 backdrop-blur lg:block">
          <div className="rounded-[1.75rem] bg-gradient-to-br from-emerald-800 via-green-700 to-lime-500 p-5 text-white shadow-md">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-emerald-50/90">
              Admin Panel
            </p>

            <h2 className="mt-3 text-2xl font-bold">G4EP RISE</h2>

            <p className="mt-2 text-sm leading-6 text-emerald-50/90">
              Oversee training operations, users, attendance, submissions,
              assignments, certificates, and learning resources.
            </p>
          </div>

          <PortalSideNav items={navItems} />

          <div className="mt-8 rounded-[1.75rem] border border-emerald-100 bg-gradient-to-r from-emerald-50 to-lime-50 p-4">
            <p className="text-sm font-semibold text-emerald-800">
              Admin Notice
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-700">
              Use this command center to manage participant progress,
              assignment activity, coordinate learning flow, and keep training
              operations running smoothly.
            </p>
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          <div className="rounded-[2rem] border border-emerald-100 bg-white/90 p-4 shadow-sm backdrop-blur sm:p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-emerald-700">
                  Admin Workspace
                </p>
                <h1 className="mt-2 text-2xl font-bold text-slate-900">
                  Training Command Center
                </h1>
              </div>

              <div className="flex w-full items-center justify-between gap-3 lg:w-auto lg:justify-end">
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-sm font-semibold text-emerald-700">
                  Admin
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