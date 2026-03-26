"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type NavItem = {
  name: string;
  href: string;
  short: string;
};

export default function MobileDashboardNav({
  items,
}: {
  items: NavItem[];
}) {
  const pathname = usePathname();

  function isActive(href: string) {
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  return (
    <div className="mt-4 grid grid-cols-2 gap-3 lg:hidden">
      {items.map((item) => {
        const active = isActive(item.href);

        return (
          <Link
            key={item.name}
            href={item.href}
            className={`rounded-2xl px-4 py-4 text-center text-sm font-semibold shadow-sm transition ${
              active
                ? "bg-emerald-600 text-white"
                : "bg-gradient-to-br from-white to-emerald-50 text-slate-800 hover:text-emerald-700"
            }`}
          >
            {item.short}
          </Link>
        );
      })}
    </div>
  );
}