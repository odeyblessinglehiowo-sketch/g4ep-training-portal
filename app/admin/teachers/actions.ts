"use server";

import { sendAccountEmail } from "@/lib/email";
import bcrypt from "bcrypt";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

function generateTemporaryPassword(length = 8) {
  const chars =
    "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
  let password = "";

  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  return password;
}

function buildTeachersRedirect(params: {
  created?: string;
  error?: string;
  email?: string;
  password?: string;
  emailSent?: string;
}) {
  const searchParams = new URLSearchParams();

  if (params.created) searchParams.set("created", params.created);
  if (params.error) searchParams.set("error", params.error);
  if (params.email) searchParams.set("email", params.email);
  if (params.password) searchParams.set("password", params.password);
  if (params.emailSent) searchParams.set("emailSent", params.emailSent);

  return `/admin/teachers?${searchParams.toString()}`;
}

export async function createTeacher(formData: FormData) {
  await requireRole("ADMIN");

  const name = formData.get("name")?.toString().trim();
  const email = formData.get("email")?.toString().trim().toLowerCase();
  const track = formData.get("track")?.toString().trim();

  if (!name || !email || !track) {
    redirect(
      buildTeachersRedirect({
        error: "Name, email, and track are required.",
      })
    );
  }

  const existingUser = await db.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    redirect(
      buildTeachersRedirect({
        error: "A user with this email already exists.",
      })
    );
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

  let emailSent = "0";

  try {
    await sendAccountEmail({
      name,
      email,
      password: temporaryPassword,
      role: "Teacher",
    });
    emailSent = "1";
  } catch (error) {
    console.error("Teacher account email failed:", error);
  }

  revalidatePath("/admin/teachers");
  revalidatePath("/teacher/dashboard");

  redirect(
    buildTeachersRedirect({
      created: "1",
      email,
      password: temporaryPassword,
      emailSent,
    })
  );
}