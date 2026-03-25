export default function PortalFooter() {
  return (
    <footer className="mt-8 rounded-[2rem] border border-emerald-100 bg-white/90 px-5 py-5 shadow-sm backdrop-blur sm:px-6">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">
            G4EP Project RISE
          </p>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
            A unified digital training portal for learning, project submission,
            attendance tracking, and certification across all G4EP training tracks.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm text-slate-600 sm:flex sm:flex-wrap sm:items-center sm:justify-end">
          <a href="/" className="transition hover:text-emerald-700">
            Home
          </a>
          <a href="/login" className="transition hover:text-emerald-700">
            Login
          </a>
          <a href="/student/dashboard" className="transition hover:text-emerald-700">
            Student
          </a>
          <a href="/teacher/dashboard" className="transition hover:text-emerald-700">
            Teacher
          </a>
          <a href="/admin/dashboard" className="transition hover:text-emerald-700">
            Admin
          </a>
        </div>
      </div>

      <div className="mt-5 border-t border-slate-200 pt-4 text-xs text-slate-500 sm:flex sm:items-center sm:justify-between">
        <p>© 2026 G4EP Project RISE. All rights reserved.</p>
        <p className="mt-2 sm:mt-0">Support: portal@geeeep.com.ng</p>
      </div>
    </footer>
  );
}