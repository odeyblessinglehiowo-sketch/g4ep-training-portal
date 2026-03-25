"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type NavItem = {
  name: string;
  href: string;
};

export default function PortalSideNav({ items }: { items: NavItem[] }) {
  const pathname = usePathname();

  function isActive(href: string) {
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  return (
    <nav className="mt-6 space-y-2">
      {items.map((item) => {
        const active = isActive(item.href);

        return (
          <Link
            key={item.name}
            href={item.href}
            className={`group flex items-center justify-between rounded-2xl px-4 py-3 text-sm font-medium transition-all duration-200 ${
              active
                ? "border border-emerald-200 bg-emerald-50 text-emerald-800 shadow-sm"
                : "border border-transparent bg-slate-50 text-slate-700 hover:border-emerald-100 hover:bg-emerald-50 hover:text-emerald-800"
            }`}
          >
            <span className="flex items-center gap-3">
              {active && <span className="h-2.5 w-2.5 rounded-full bg-emerald-600" />}
              <span>{item.name}</span>
            </span>

            <span
              className={`text-emerald-600 transition ${
                active ? "opacity-100" : "opacity-0 group-hover:opacity-100"
              }`}
            >
              →
            </span>
          </Link>
        );
      })}
    </nav>
  );
}