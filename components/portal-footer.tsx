export default function PortalFooter() {
  return (
    <footer className="mt-10 w-full border-t border-emerald-700 bg-emerald-900 text-white">
      <div className="w-full px-6 py-12 sm:px-8 lg:px-12">
        <div className="grid gap-10 md:grid-cols-4">
          <div>
            <div className="flex items-center gap-3">
              <img
                src="/logo/g4ep.png"
                alt="G4EP logo"
                className="h-12 w-12 object-contain"
              />
              <div>
                <h3 className="text-lg font-extrabold text-white">
                  G4EP Project RISE
                </h3>
                <p className="text-sm text-emerald-100">
                  Digital Training Portal
                </p>
              </div>
            </div>

            <p className="mt-5 max-w-sm text-sm leading-7 text-emerald-100">
              A unified digital training portal for learning, project
              submission, attendance tracking, and certification across all
              G4EP training tracks.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-bold text-white">Quick Links</h3>
            <div className="mt-5 space-y-3">
              <a href="/" className="block text-sm text-emerald-100 transition hover:text-white">
                Home
              </a>
              <a href="/login" className="block text-sm text-emerald-100 transition hover:text-white">
                Login
              </a>
              <a href="/student/dashboard" className="block text-sm text-emerald-100 transition hover:text-white">
                Student
              </a>
              <a href="/teacher/dashboard" className="block text-sm text-emerald-100 transition hover:text-white">
                Teacher
              </a>
              <a href="/admin/dashboard" className="block text-sm text-emerald-100 transition hover:text-white">
                Admin
              </a>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-bold text-white">Portal Navigation</h3>
            <div className="mt-5 space-y-3">
              <a href="/student/resources" className="block text-sm text-emerald-100 transition hover:text-white">
                Resources
              </a>
              <a href="/student/submissions" className="block text-sm text-emerald-100 transition hover:text-white">
                Submissions
              </a>
              <a href="/student/attendance" className="block text-sm text-emerald-100 transition hover:text-white">
                Attendance
              </a>
              <a href="/student/certificate" className="block text-sm text-emerald-100 transition hover:text-white">
                Certificate
              </a>
              <a href="/student/profile" className="block text-sm text-emerald-100 transition hover:text-white">
                Profile
              </a>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-bold text-white">Support</h3>
            <p className="mt-5 text-sm leading-7 text-emerald-100">
              Need help with your learning experience, project submissions,
              attendance, or certificate status?
            </p>
            <p className="mt-4 text-sm font-semibold text-white">
              portal@geeeep.com.ng
            </p>
          </div>
        </div>

        <div className="mt-10 border-t border-emerald-800 pt-6 text-center text-sm text-emerald-100">
          © 2026 G4EP Project RISE. All rights reserved.
        </div>
      </div>
    </footer>
  );
}