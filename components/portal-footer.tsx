export default function PortalFooter() {
  return (
    <footer className="mt-10 border-t border-emerald-200 bg-emerald-50">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-3">
          <div>
            <h3 className="text-sm font-extrabold uppercase tracking-[0.22em] text-emerald-700">
              G4EP Project RISE
            </h3>
            <p className="mt-4 max-w-md text-sm leading-7 text-slate-600">
              A unified digital training portal for learning, project
              submission, attendance tracking, and certification across all
              G4EP training tracks.
            </p>
          </div>

          <div>
            <h3 className="text-sm font-extrabold uppercase tracking-[0.22em] text-slate-800">
              Quick Links
            </h3>

            <div className="mt-4 grid grid-cols-2 gap-x-8 gap-y-3">
              <a href="/" className="text-sm font-semibold text-slate-600 transition hover:text-emerald-700">
                Home
              </a>
              <a href="/login" className="text-sm font-semibold text-slate-600 transition hover:text-emerald-700">
                Login
              </a>
              <a href="/student/dashboard" className="text-sm font-semibold text-slate-600 transition hover:text-emerald-700">
                Student
              </a>
              <a href="/teacher/dashboard" className="text-sm font-semibold text-slate-600 transition hover:text-emerald-700">
                Teacher
              </a>
              <a href="/admin/dashboard" className="text-sm font-semibold text-slate-600 transition hover:text-emerald-700">
                Admin
              </a>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-extrabold uppercase tracking-[0.22em] text-slate-800">
              Support
            </h3>
            <p className="mt-4 text-sm font-semibold text-slate-600">
              portal@geeeep.com.ng
            </p>
          </div>
        </div>

        <div className="mt-8 border-t border-emerald-200 pt-5">
          <p className="text-sm text-slate-500">
            © 2026 G4EP Project RISE. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}