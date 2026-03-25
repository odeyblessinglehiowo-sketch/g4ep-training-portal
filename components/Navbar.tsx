import Link from "next/link";

const navItems = [
  { name: "Home", href: "/" },
  { name: "Login", href: "/login" },
  { name: "Student", href: "/student/dashboard" },
  { name: "Teacher", href: "/teacher/dashboard" },
  { name: "Admin", href: "/admin/dashboard" },
];

export default function Navbar() {
  return (
    <header className="sticky top-0 z-50 border-b border-emerald-100 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <Link href="/" className="flex min-w-0 items-center gap-3">
          <img
            src="/logo/g4ep.png"
            alt="G4EP logo"
            className="h-11 w-11 shrink-0 rounded-full object-contain sm:h-12 sm:w-12"
          />

          <div className="min-w-0">
            <p className="text-base font-extrabold leading-tight text-emerald-700 sm:text-2xl">
              G4EP Project RISE
            </p>
            <p className="hidden text-xs font-medium tracking-[0.12em] text-slate-500 sm:block">
              Digital Training Portal
            </p>
          </div>
        </Link>

        <nav className="hidden items-center gap-2 md:flex">
          {navItems.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className="rounded-xl px-4 py-2 text-sm font-bold text-slate-700 transition hover:bg-emerald-50 hover:text-emerald-700"
            >
              {item.name}
            </Link>
          ))}
        </nav>
      </div>

      <div className="border-t border-emerald-100 bg-white md:hidden">
        <div className="mx-auto flex max-w-7xl items-center gap-2 overflow-x-auto px-4 py-2 scrollbar-none sm:px-6">
          {navItems.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className="whitespace-nowrap rounded-full border border-emerald-100 bg-emerald-50 px-4 py-2 text-sm font-bold text-emerald-700 transition hover:bg-emerald-100 active:scale-[0.98]"
            >
              {item.name}
            </Link>
          ))}
        </div>
      </div>
    </header>
  );
}