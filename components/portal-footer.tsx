export default function PortalFooter() {
  return (
    <footer className="mt-10 border-t border-emerald-200 bg-emerald-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-8 md:grid-cols-3">
          <div>
            <p className="text-sm font-extrabold uppercase tracking-[0.22em] text-emerald-700">
              G4EP Project RISE
            </p>
            <p className="mt-3 max-w-md text-sm leading-7 text-slate-600">
              A unified digital training portal for learning, project
              submission, attendance tracking, and certification across all
              G4EP training tracks.
            </p>
          </div>

          <div>
            <p className="text-sm font-bold uppercase tracking-[0.16em] text-slate-800">
              Quick Links
            </p>
            <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
              <a href="/" className="font-semibold text-slate-600 transition hover:text-emerald-700">
                Home
              </a>
              <a href="/login" className="font-semibold text-slate-600 transition hover:text-emerald-700">
                Login
              </a>
              <a href="/student/dashboard" className="font-semibold text-slate-600 transition hover:text-emerald-700">
                Student
              </a>
              <a href="/teacher/dashboard" className="font-semibold text-slate-600 transition hover:text-emerald-700">
                Teacher
              </a>
              <a href="/admin/dashboard" className="font-semibold text-slate-600 transition hover:text-emerald-700">
                Admin
              </a>
            </div>
          </div>

          <div>
            <p className="text-sm font-bold uppercase tracking-[0.16em] text-slate-800">
              Support
            </p>
            <p className="mt-3 text-sm font-semibold text-slate-600">
              portal@geeeep.com.ng
            </p>
          </div>
        </div>

        <div className="mt-8 border-t border-emerald-200 pt-4 text-sm text-slate-500">
          © 2026 G4EP Project RISE. All rights reserved.
        </div>
      </div>
    </footer>
  );
}