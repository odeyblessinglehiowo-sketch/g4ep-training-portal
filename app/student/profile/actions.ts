"use server";

import bcrypt from "bcrypt";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";

export async function updateStudentProfile(formData: FormData) {
  const name = formData.get("name")?.toString().trim();
  const email = formData.get("email")?.toString().trim().toLowerCase();

  if (!name || !email) {
    throw new Error("Name and email are required.");
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
    throw new Error("This email is already in use by another account.");
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

  redirect("/student/profile?updated=profile");
}

export async function changeStudentPassword(formData: FormData) {
  const currentPassword = formData.get("currentPassword")?.toString().trim();
  const newPassword = formData.get("newPassword")?.toString().trim();
  const confirmPassword = formData.get("confirmPassword")?.toString().trim();

  if (!currentPassword || !newPassword || !confirmPassword) {
    throw new Error("All password fields are required.");
  }

  if (newPassword.length < 6) {
    throw new Error("New password must be at least 6 characters long.");
  }

  if (newPassword !== confirmPassword) {
    throw new Error("New password and confirm password do not match.");
  }

  const currentUser = await requireRole("STUDENT");

  const user = await db.user.findUnique({
    where: {
      id: currentUser.userId,
    },
  });

  if (!user) {
    throw new Error("User account not found.");
  }

  const passwordMatch = await bcrypt.compare(currentPassword, user.password);

  if (!passwordMatch) {
    throw new Error("Current password is incorrect.");
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

  redirect("/student/profile?updated=password");
}