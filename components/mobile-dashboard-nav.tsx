"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import LogoutButton from "@/components/logout-button";

type NavItem = {
  name: string;
  href: string;
  short: string;
  badge?: number;
};

export default function MobileDashboardNav({
  items,
}: {
  items: NavItem[];
}) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  function isActive(href: string) {
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  return (
    <div>
      <div className="flex items-center justify-end">
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          aria-expanded={isOpen}
          aria-label={isOpen ? "Close menu" : "Open menu"}
          className="inline-flex h-9 w-9 items-center justify-center border border-emerald-200 bg-white text-slate-700 shadow-sm transition hover:border-emerald-300 hover:text-emerald-700"
        >
          <div className="flex flex-col gap-1">
            <span
              className={`block h-0.5 w-4 bg-current transition-all duration-300 ${
                isOpen ? "translate-y-[6px] rotate-45" : ""
              }`}
            />
            <span
              className={`block h-0.5 w-4 bg-current transition-all duration-300 ${
                isOpen ? "opacity-0" : "opacity-100"
              }`}
            />
            <span
              className={`block h-0.5 w-4 bg-current transition-all duration-300 ${
                isOpen ? "-translate-y-[6px] -rotate-45" : ""
              }`}
            />
          </div>
        </button>
      </div>

      <div
        className={`overflow-hidden transition-all duration-300 ${
          isOpen ? "mt-2 max-h-[760px] opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="border border-emerald-100 bg-white p-2.5 shadow-sm">
          <div className="grid grid-cols-2 gap-2">
            {items.map((item) => {
              const active = isActive(item.href);

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`relative px-3 py-2.5 text-center text-xs font-semibold transition ${
                    active
                      ? "bg-emerald-600 text-white shadow-sm"
                      : "bg-slate-50 text-slate-700 hover:bg-emerald-50 hover:text-emerald-700"
                  }`}
                >
                  {item.short}

                  {item.badge !== undefined && item.badge > 0 && (
                    <span className="absolute -right-1 -top-1 inline-flex min-h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[9px] font-bold text-white">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}

            <div className="col-span-2">
              <LogoutButton />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}