"use server";

import { sendAccountEmail } from "@/lib/email";
import bcrypt from "bcrypt";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";

function generateTemporaryPassword(length = 8) {
  const chars =
    "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
  let password = "";

  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  return password;
}

export async function createTeacher(formData: FormData) {
  await requireRole("ADMIN");

  const name = formData.get("name")?.toString().trim();
  const email = formData.get("email")?.toString().trim().toLowerCase();
  const track = formData.get("track")?.toString().trim();

  if (!name || !email || !track) {
    throw new Error("Name, email, and track are required.");
  }

  const existingUser = await db.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    throw new Error("A user with this email already exists.");
  }

  const temporaryPassword = generateTemporaryPassword();
  const hashedPassword = await bcrypt.hash(temporaryPassword, 10);

  const user = await db.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
      role: "TEACHER",
    },
  });

  await db.teacher.create({
    data: {
      userId: user.id,
      track,
    },
  });

  await sendAccountEmail({
    name,
    email,
    password: temporaryPassword,
    role: "Teacher",
  });

  redirect(
    `/admin/teachers?created=1&email=${encodeURIComponent(email)}&password=${encodeURIComponent(temporaryPassword)}`
  );
}