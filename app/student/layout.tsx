import Link from "next/link";
import { ReactNode } from "react";
import { requireRole } from "@/lib/auth";
import LogoutButton from "@/components/logout-button";
import PortalFooter from "@/components/portal-footer";
import PortalSideNav from "@/components/portal-side-nav";
import MobileDashboardNav from "@/components/mobile-dashboard-nav";
import { db } from "@/lib/db";

export default async function StudentLayout({
  children,
}: {
  children: ReactNode;
}) {
  await requireRole("STUDENT");
    const currentUser = await requireRole("STUDENT");

  const studentUser = await db.user.findUnique({
    where: {
      id: currentUser.userId,
    },
    include: {
      student: true,
    },
  });

  const unreadReviewedCount = studentUser?.student
    ? await db.submission.count({
        where: {
          studentId: studentUser.student.id,
          status: {
            in: ["APPROVED", "REJECTED"],
          },
          studentSeenReview: false,
        },
      })
    : 0;

  const navItems = [
    { name: "Dashboard", href: "/student/dashboard", short: "Home" },
    { name: "Resources", href: "/student/resources", short: "Resources" },
    {
      name: "Submissions",
      href: "/student/submissions",
      short: "Projects",
      badge: unreadReviewedCount,
    },
    { name: "Attendance", href: "/student/attendance", short: "Attendance" },
    { name: "Certificate", href: "/student/certificate", short: "Certificate" },
    { name: "Profile", href: "/student/profile", short: "Profile" },
  ];

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_#dcfce7,_#f8fafc_40%,_#ecfdf5_70%,_#d1fae5)]">
      <div className="mx-auto flex max-w-7xl gap-6 px-4 py-5 sm:px-6 lg:px-8">
        <aside className="hidden w-72 shrink-0 rounded-[2rem] border border-emerald-100 bg-white/90 p-6 shadow-lg shadow-emerald-100/40 backdrop-blur lg:block">
          <div className="rounded-[1.75rem] bg-gradient-to-br from-emerald-700 via-green-600 to-lime-500 p-5 text-white shadow-md">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-emerald-50/90">
              Student Portal
            </p>

            <h2 className="mt-3 text-2xl font-bold">G4EP RISE</h2>

            <p className="mt-2 text-sm leading-6 text-emerald-50/90">
              Access your learning tools, attendance, projects, and certificate journey in one place.
            </p>
          </div>

         <PortalSideNav items={navItems} />

          <div className="mt-8 rounded-[1.75rem] border border-emerald-100 bg-gradient-to-r from-emerald-50 to-lime-50 p-4">
            <p className="text-sm font-semibold text-emerald-800">Need help?</p>
            <p className="mt-2 text-sm leading-6 text-slate-700">
              Reach out to your coordinator if you need help with materials,
              submissions, attendance, or certificate updates.
            </p>
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          <div className="rounded-[2rem] border border-emerald-100 bg-white/90 p-4 shadow-sm backdrop-blur sm:p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-emerald-700">
                  Student Workspace
                </p>
                <h1 className="mt-2 text-2xl font-bold text-slate-900">
                  Learning Dashboard
                </h1>
              </div>

              <div className="flex w-full items-center justify-between gap-3 lg:w-auto lg:justify-end">
  <span className="rounded-full bg-emerald-50 px-3 py-1 text-sm font-semibold text-emerald-700">
    Student
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