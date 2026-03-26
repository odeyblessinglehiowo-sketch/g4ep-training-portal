import { redirect } from "next/navigation";
import { getSession } from "./session";
import { db } from "./db";

export type UserRole = "ADMIN" | "TEACHER" | "STUDENT";

export async function getCurrentUser() {
  const session = await getSession();

  if (!session.userId) {
    return null;
  }

  const user = await db.user.findUnique({
    where: {
      id: session.userId,
    },
    select: {
      id: true,
      email: true,
      role: true,
      isActive: true,
      name: true,
    },
  });

  if (!user || !user.isActive) {
    return null;
  }

  return {
    userId: user.id,
    email: user.email,
    role: user.role as UserRole,
    name: user.name,
  };
}

export async function requireAuth() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return user;
}

export async function requireRole(...roles: UserRole[]) {
  const user = await requireAuth();

  if (!roles.includes(user.role)) {
    if (user.role === "ADMIN") {
      redirect("/admin/dashboard");
    }

    if (user.role === "TEACHER") {
      redirect("/teacher/dashboard");
    }

    if (user.role === "STUDENT") {
      redirect("/student/dashboard");
    }

    redirect("/login");
  }

  return user;
}