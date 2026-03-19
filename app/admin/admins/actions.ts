"use server";

import bcrypt from "bcrypt";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { sendAccountEmail } from "@/lib/email";

function generateTemporaryPassword(length = 8) {
  const chars =
    "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
  let password = "";

  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  return password;
}

export async function createAdmin(formData: FormData) {
  await requireRole("ADMIN");

  const name = formData.get("name")?.toString().trim();
  const email = formData.get("email")?.toString().trim().toLowerCase();

  if (!name || !email) {
    throw new Error("Name and email are required.");
  }

  const existingUser = await db.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    throw new Error("A user with this email already exists.");
  }

  const temporaryPassword = generateTemporaryPassword();
  const hashedPassword = await bcrypt.hash(temporaryPassword, 10);

  await db.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
      role: "ADMIN",
    },
  });

  // SEND LOGIN EMAIL
  await sendAccountEmail({
    name,
    email,
    password: temporaryPassword,
    role: "Admin",
  });

  redirect(
    `/admin/admins?created=1&email=${encodeURIComponent(email)}&password=${encodeURIComponent(temporaryPassword)}`
  );
}