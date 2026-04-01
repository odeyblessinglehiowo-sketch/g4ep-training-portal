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
    <div className="lg:hidden">
      {/* TOP ROW */}
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">
          Menu
        </p>

        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-emerald-200 bg-white text-slate-700 shadow-sm transition hover:border-emerald-300 hover:text-emerald-700"
        >
          <div className="flex flex-col gap-1.5">
            <span
              className={`block h-0.5 w-5 bg-current transition ${
                isOpen ? "translate-y-2 rotate-45" : ""
              }`}
            />
            <span
              className={`block h-0.5 w-5 bg-current transition ${
                isOpen ? "opacity-0" : ""
              }`}
            />
            <span
              className={`block h-0.5 w-5 bg-current transition ${
                isOpen ? "-translate-y-2 -rotate-45" : ""
              }`}
            />
          </div>
        </button>
      </div>

      {/* DROPDOWN */}
      <div
        className={`overflow-hidden transition-all duration-300 ${
          isOpen ? "mt-3 max-h-[700px] opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="rounded-2xl border border-emerald-100 bg-white p-3 shadow-sm">
          <div className="grid grid-cols-2 gap-2">
            {items.map((item) => {
              const active = isActive(item.href);

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`relative rounded-xl px-3 py-3 text-center text-sm font-semibold transition ${
                    active
                      ? "bg-emerald-600 text-white shadow-sm"
                      : "bg-slate-50 text-slate-700 hover:bg-emerald-50 hover:text-emerald-700"
                  }`}
                >
                  {item.short}

                  {item.badge !== undefined && item.badge > 0 && (
                    <span className="absolute -right-1.5 -top-1.5 rounded-full bg-red-600 px-1.5 text-[10px] font-bold text-white">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}

            {/* 🔥 REAL LOGOUT BUTTON */}
            <div className="col-span-2">
              <LogoutButton />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}