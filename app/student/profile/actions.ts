"use server";

import bcrypt from "bcrypt";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";

function buildProfileRedirect(params: {
  updated?: "profile" | "password";
  error?: string;
}) {
  const searchParams = new URLSearchParams();

  if (params.updated) {
    searchParams.set("updated", params.updated);
  }

  if (params.error) {
    searchParams.set("error", params.error);
  }

  return `/student/profile?${searchParams.toString()}`;
}

export async function updateStudentProfile(formData: FormData) {
  const name = formData.get("name")?.toString().trim();
  const email = formData.get("email")?.toString().trim().toLowerCase();

  if (!name || !email) {
    redirect(buildProfileRedirect({ error: "Name and email are required." }));
  }

  const currentUser = await requireRole("STUDENT");

  const existingUser = await db.user.findFirst({
    where: {
      email,
      NOT: {
        id: currentUser.userId,
      },
    },
  });

  if (existingUser) {
    redirect(
      buildProfileRedirect({
        error: "This email is already in use by another account.",
      })
    );
  }

  await db.user.update({
    where: {
      id: currentUser.userId,
    },
    data: {
      name,
      email,
    },
  });

  redirect(buildProfileRedirect({ updated: "profile" }));
}

export async function changeStudentPassword(formData: FormData) {
  const currentPassword = formData.get("currentPassword")?.toString().trim();
  const newPassword = formData.get("newPassword")?.toString().trim();
  const confirmPassword = formData.get("confirmPassword")?.toString().trim();

  if (!currentPassword || !newPassword || !confirmPassword) {
    redirect(
      buildProfileRedirect({
        error: "All password fields are required.",
      })
    );
  }

  if (newPassword.length < 6) {
    redirect(
      buildProfileRedirect({
        error: "New password must be at least 6 characters long.",
      })
    );
  }

  if (newPassword !== confirmPassword) {
    redirect(
      buildProfileRedirect({
        error: "New password and confirm password do not match.",
      })
    );
  }

  const currentUser = await requireRole("STUDENT");

  const user = await db.user.findUnique({
    where: {
      id: currentUser.userId,
    },
  });

  if (!user) {
    redirect(
      buildProfileRedirect({
        error: "User account not found.",
      })
    );
  }

  const passwordMatch = await bcrypt.compare(currentPassword, user.password);

  if (!passwordMatch) {
    redirect(
      buildProfileRedirect({
        error: "Current password is incorrect.",
      })
    );
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);

  await db.user.update({
    where: {
      id: user.id,
    },
    data: {
      password: hashedPassword,
    },
  });

  redirect(buildProfileRedirect({ updated: "password" }));
}