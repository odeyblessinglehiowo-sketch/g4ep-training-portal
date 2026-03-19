export default function Home() {
  const tracks = [
    "Web Design",
    "Photography",
    "Videography",
    "Graphic Design",
    "Artificial Intelligence",
  ];

  return (
    <main className="min-h-screen bg-white text-slate-900">
      <section className="bg-gradient-to-br from-green-900 via-green-800 to-green-600 text-white">
        <div className="mx-auto max-w-7xl px-6 py-16 lg:px-10">
          <div className="grid gap-10 lg:grid-cols-2 lg:items-center lg:py-10">
            <div>
              <p className="mb-4 inline-block rounded-full bg-white/10 px-4 py-2 text-sm font-medium text-green-50">
                Akwa Ibom Digital Skills Training
              </p>

              <h1 className="max-w-3xl text-4xl font-bold leading-tight sm:text-5xl lg:text-6xl">
                G4EP Project RISE Command Center
              </h1>

              <p className="mt-6 max-w-2xl text-base leading-8 text-green-50/90 sm:text-lg">
                A unified training portal for learning, project submission,
                student progress tracking, and certification across Web Design,
                Photography, Videography, Graphic Design, and AI.
              </p>

              <div className="mt-8 flex flex-wrap gap-4">
                <a
                  href="https://form.jotform.com/252385187138565"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-full bg-white px-6 py-3 font-semibold text-green-900 transition hover:bg-green-50"
                >
                  Register Now
                </a>

                <a
                  href="#tracks"
                  className="rounded-full border border-white/30 px-6 py-3 font-semibold text-white transition hover:bg-white/10"
                >
                  Explore Tracks
                </a>
              </div>
            </div>

            <div className="rounded-3xl bg-white/10 p-6 shadow-2xl backdrop-blur">
              <div className="rounded-3xl bg-white p-6 text-slate-900">
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-green-700">
                  Program Focus
                </p>
                <h2 className="mt-3 text-2xl font-bold">
                  Training for impact, creativity, and career growth
                </h2>

                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  {tracks.map((track) => (
                    <div
                      key={track}
                      className="rounded-2xl border border-green-100 bg-green-50 p-4"
                    >
                      <p className="font-semibold text-green-900">{track}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-6 rounded-2xl border border-dashed border-green-200 bg-white p-4 text-sm text-slate-600">
                  G4EP logo will be placed here.
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-16 lg:px-10">
        <div className="grid gap-8 lg:grid-cols-2">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-green-700">
              About the Program
            </p>
            <h2 className="mt-3 text-3xl font-bold text-slate-900">
              One portal for the full training journey
            </h2>
            <p className="mt-5 text-base leading-8 text-slate-600">
              This platform is built to support the Akwa Ibom training from a
              single place. Participants can access learning materials, submit
              projects, track progress, and monitor certificate status through a
              clean and structured dashboard.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-3xl border border-green-100 bg-green-50 p-6">
              <h3 className="text-lg font-semibold text-green-900">
                Student Workspace
              </h3>
              <p className="mt-3 text-sm leading-7 text-slate-600">
                Login, view assigned track, access resources, and submit
                projects.
              </p>
            </div>

            <div className="rounded-3xl border border-green-100 bg-white p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-green-900">
                Admin Command Center
              </h3>
              <p className="mt-3 text-sm leading-7 text-slate-600">
                Manage students, upload materials, review submissions, and
                approve completion.
              </p>
            </div>

            <div className="rounded-3xl border border-green-100 bg-white p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-green-900">
                Certification Flow
              </h3>
              <p className="mt-3 text-sm leading-7 text-slate-600">
                Students can track when their projects are approved and when
                their certificates are ready.
              </p>
            </div>

            <div className="rounded-3xl border border-green-100 bg-green-50 p-6">
              <h3 className="text-lg font-semibold text-green-900">
                Fast Launch Ready
              </h3>
              <p className="mt-3 text-sm leading-7 text-slate-600">
                Built as the fastest solid version we can launch before the
                training begins.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section id="tracks" className="bg-green-50 py-16">
        <div className="mx-auto max-w-7xl px-6 lg:px-10">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-green-700">
            Training Tracks
          </p>
          <h2 className="mt-3 text-3xl font-bold text-slate-900">
            Choose from high-impact digital skill areas
          </h2>

          <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-5">
            {tracks.map((track) => (
              <div
                key={track}
                className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-green-100"
              >
                <div className="mb-4 h-12 w-12 rounded-2xl bg-green-100" />
                <h3 className="text-lg font-semibold text-slate-900">{track}</h3>
                <p className="mt-3 text-sm leading-7 text-slate-600">
                  Structured training, practical assignments, and guided project
                  work.
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-16 lg:px-10">
        <div className="rounded-[2rem] bg-green-900 px-8 py-12 text-center text-white">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-green-100">
            Ready to Join?
          </p>
          <h2 className="mt-3 text-3xl font-bold">
            Start your digital skills journey with G4EP
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-green-50/90">
            Register through the official form and get ready to access the
            training portal, submit projects, and track your progress.
          </p>

          <a
            href="https://form.jotform.com/252385187138565"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-8 inline-flex rounded-full bg-white px-6 py-3 font-semibold text-green-900 transition hover:bg-green-50"
          >
            Open Registration Form
          </a>
        </div>
      </section>
    </main>
  );
}