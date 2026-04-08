import Image from "next/image";
import Link from "next/link";
import { login } from "./actions";

export const dynamic = "force-dynamic";

export default function LoginPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-gradient-to-br from-emerald-50 via-white to-lime-50">
      {/* Wide blurred background logo */}
      

      {/* soft overlays */}
      <div className="pointer-events-none absolute left-[-60px] top-[100px] h-40 w-40 rounded-full bg-emerald-100/60 blur-2xl" />
      <div className="pointer-events-none absolute bottom-[80px] right-[-40px] h-48 w-48 rounded-full bg-lime-100/60 blur-2xl" />

      <div className="relative mx-auto flex min-h-screen max-w-7xl items-center justify-center px-4 py-10 sm:px-6 lg:px-8">
        <div className="w-full max-w-md">
          <section className="relative overflow-hidden rounded-[2rem] border border-emerald-100 bg-white/90 p-6 shadow-xl backdrop-blur sm:p-8">
            {/* soft shape decorations */}
            <div className="pointer-events-none absolute -left-10 -top-10 h-28 w-28 rounded-full bg-emerald-50" />
            <div className="pointer-events-none absolute right-8 top-28 h-16 w-16 rounded-full bg-slate-100/80" />
            <div className="pointer-events-none absolute bottom-6 right-6 h-20 w-20 rounded-full bg-lime-50/90" />

            <div className="relative z-10">
              <div className="mb-6 flex justify-center">
                <Image
                  src="/logo/g4ep.png"
                  alt="G4EP logo"
                  width={72}
                  height={72}
                  className="h-16 w-16 object-contain"
                />
              </div>

              <div className="text-center">
                <h1 className="text-4xl font-bold leading-tight text-emerald-800 sm:text-5xl">
                  Welcome back
                </h1>
                <p className="mt-2 text-base text-slate-600 sm:text-lg">
                  Login to your account below
                </p>
              </div>

              <form action={login} className="mt-8 space-y-5">
                <div>
                  <label className="mb-2 block text-sm font-medium text-emerald-700">
                    Email
                  </label>
                  <input
                    name="email"
                    type="email"
                    placeholder="Enter your email"
                    className="w-full rounded-xl border border-emerald-200 bg-white px-4 py-3 text-base outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                    required
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-emerald-700">
                    Password
                  </label>
                  <input
                    name="password"
                    type="password"
                    placeholder="Enter your password"
                    className="w-full rounded-xl border border-emerald-200 bg-white px-4 py-3 text-base outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="w-full rounded-xl bg-emerald-700 px-5 py-3 text-base font-semibold text-white transition hover:bg-emerald-800 active:scale-[0.99]"
                >
                  Login
                </button>
              </form>

              <div className="mt-6 text-center">
                <p className="text-sm text-slate-400">Start your application</p>

                <a
                  href="https://form.jotform.com/252385187138565"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-flex items-center gap-2 text-lg font-medium text-emerald-800 transition hover:text-emerald-600"
                >
                  Apply here
                  <span aria-hidden="true">→</span>
                </a>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}