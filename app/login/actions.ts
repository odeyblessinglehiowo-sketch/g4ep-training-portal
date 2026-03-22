"use server";

import bcrypt from "bcrypt";
import { db } from "@/lib/db";

import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";

function buildLoginRedirect(error: string, next?: string) {
  const params = new URLSearchParams();
  params.set("error", error);

  if (next && next.startsWith("/")) {
    params.set("next", next);
  }

  return `/login?${params.toString()}`;
}

function getDefaultRedirect(role: "ADMIN" | "TEACHER" | "STUDENT") {
  if (role === "ADMIN") return "/admin/dashboard";
  if (role === "TEACHER") return "/teacher/dashboard";
  return "/student/dashboard";
}

function getSafeNextForRole(
  role: "ADMIN" | "TEACHER" | "STUDENT",
  next?: string
) {
  if (!next || !next.startsWith("/")) {
    return null;
  }

  if (role === "ADMIN" && next.startsWith("/admin")) {
    return next;
  }

  if (role === "TEACHER" && next.startsWith("/teacher")) {
    return next;
  }

  if (role === "STUDENT" && next.startsWith("/student")) {
    return next;
  }

  return null;
}

export async function login(formData: FormData) {
  const email = formData.get("email")?.toString().trim().toLowerCase();
  const password = formData.get("password")?.toString().trim();
  const next = formData.get("next")?.toString().trim();

  if (!email || !password) {
    redirect(buildLoginRedirect("Email and password are required.", next));
  }

  const user = await db.user.findUnique({
    where: { email },
  });

  if (!user) {
    redirect(buildLoginRedirect("Invalid login credentials.", next));
  }

  const passwordMatch = await bcrypt.compare(password, user.password);

  if (!passwordMatch) {
    redirect(buildLoginRedirect("Invalid login credentials.", next));
  }

  if (!user.isActive) {
    redirect(
      buildLoginRedirect(
        "This account has been disabled by the administrator.",
        next
      )
    );
  }

  const session = await getSession();

  session.userId = user.id;
  session.role = user.role;
  session.email = user.email;

  await session.save();

  const nextRedirect = getSafeNextForRole(user.role, next);

  if (nextRedirect) {
    redirect(nextRedirect);
  }

  redirect(getDefaultRedirect(user.role));
}