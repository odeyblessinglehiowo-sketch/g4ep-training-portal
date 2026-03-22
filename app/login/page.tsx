export const dynamic = "force-dynamic";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { login } from "./actions";

function getDefaultRedirect(role: "ADMIN" | "TEACHER" | "STUDENT") {
  if (role === "ADMIN") return "/admin/dashboard";
  if (role === "TEACHER") return "/teacher/dashboard";
  return "/student/dashboard";
}

function isSafeNext(next?: string): next is string {
  return typeof next === "string" && next.startsWith("/");
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{
    error?: string;
    next?: string;
  }>;
}) {
  const user = await getCurrentUser();
  const params = await searchParams;
  const error = params.error;
  const next = params.next;

  if (user) {
    if (isSafeNext(next)) {
      if (user.role === "STUDENT" && next.startsWith("/student")) {
        redirect(next);
      }

      if (user.role === "TEACHER" && next.startsWith("/teacher")) {
        redirect(next);
      }

      if (user.role === "ADMIN" && next.startsWith("/admin")) {
        redirect(next);
      }
    }

    redirect(getDefaultRedirect(user.role));
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
        <h1 className="text-2xl font-bold text-slate-900">Portal Login</h1>

        <p className="mt-2 text-sm text-slate-600">
          Sign in to access your dashboard.
        </p>

        {error && (
          <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3">
            <p className="text-sm font-medium text-red-700">{error}</p>
          </div>
        )}

        <form action={login} className="mt-6 space-y-4">
          <input type="hidden" name="next" value={next ?? ""} />

          <input
            name="email"
            type="email"
            placeholder="Email"
            className="w-full rounded-lg border border-slate-300 px-4 py-2 outline-none transition focus:border-green-600"
          />

          <input
            name="password"
            type="password"
            placeholder="Password"
            className="w-full rounded-lg border border-slate-300 px-4 py-2 outline-none transition focus:border-green-600"
          />

          <button
            type="submit"
            className="w-full rounded-lg bg-green-700 py-2 font-semibold text-white transition hover:bg-green-800"
          >
            Login
          </button>
        </form>
      </div>
    </main>
  );
}