"use server";

import bcrypt from "bcrypt";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { sendPasswordResetEmail } from "@/lib/email";
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

function buildUsersRedirect(params: {
  success?: string;
  error?: string;
  name?: string;
  email?: string;
  state?: string;
  q?: string;
  role?: string;
  track?: string;
  status?: string;
}) {
  const searchParams = new URLSearchParams();

  if (params.success) searchParams.set("success", params.success);
  if (params.error) searchParams.set("error", params.error);
  if (params.name) searchParams.set("name", params.name);
  if (params.email) searchParams.set("email", params.email);
  if (params.state) searchParams.set("state", params.state);

  if (params.q) searchParams.set("q", params.q);
  if (params.role) searchParams.set("role", params.role);
  if (params.track) searchParams.set("track", params.track);
  if (params.status) searchParams.set("status", params.status);

  return `/admin/users?${searchParams.toString()}`;
}

export async function toggleUserStatus(formData: FormData) {
  const currentAdmin = await requireRole("ADMIN");

  const userId = formData.get("userId")?.toString();
  const q = formData.get("q")?.toString() ?? "";
  const role = formData.get("role")?.toString() ?? "ALL";
  const track = formData.get("track")?.toString() ?? "ALL";
  const status = formData.get("status")?.toString() ?? "ALL";

  if (!userId) {
    redirect(
      buildUsersRedirect({
        error: "Missing user ID.",
        q,
        role,
        track,
        status,
      })
    );
  }

  const user = await db.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    redirect(
      buildUsersRedirect({
        error: "User not found.",
        q,
        role,
        track,
        status,
      })
    );
  }

  const isTryingToDisable = user.isActive;

  if (isTryingToDisable && user.id === currentAdmin.userId) {
    redirect(
      buildUsersRedirect({
        error: "You cannot disable your own account.",
        q,
        role,
        track,
        status,
      })
    );
  }

  if (isTryingToDisable && user.role === "ADMIN") {
    const activeAdmins = await db.user.count({
      where: {
        role: "ADMIN",
        isActive: true,
      },
    });

    if (activeAdmins <= 1) {
      redirect(
        buildUsersRedirect({
          error: "You cannot disable the last active admin.",
          q,
          role,
          track,
          status,
        })
      );
    }
  }

  const updatedUser = await db.user.update({
    where: { id: userId },
    data: {
      isActive: !user.isActive,
    },
  });

  redirect(
    buildUsersRedirect({
      success: "status",
      name: updatedUser.name,
      state: updatedUser.isActive ? "enabled" : "disabled",
      q,
      role,
      track,
      status,
    })
  );
}

export async function resetUserPassword(formData: FormData) {
  const currentAdmin = await requireRole("ADMIN");

  const userId = formData.get("userId")?.toString();
  const q = formData.get("q")?.toString() ?? "";
  const role = formData.get("role")?.toString() ?? "ALL";
  const track = formData.get("track")?.toString() ?? "ALL";
  const status = formData.get("status")?.toString() ?? "ALL";

  if (!userId) {
    redirect(
      buildUsersRedirect({
        error: "Missing user ID.",
        q,
        role,
        track,
        status,
      })
    );
  }

  const user = await db.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    redirect(
      buildUsersRedirect({
        error: "User not found.",
        q,
        role,
        track,
        status,
      })
    );
  }

  if (user.id === currentAdmin.userId) {
    redirect(
      buildUsersRedirect({
        error:
          "You cannot reset the password of the account you are currently using from this page.",
        q,
        role,
        track,
        status,
      })
    );
  }

  const temporaryPassword = generateTemporaryPassword();
  const hashedPassword = await bcrypt.hash(temporaryPassword, 10);

  try {
    await sendPasswordResetEmail({
      name: user.name,
      email: user.email,
      password: temporaryPassword,
      role: user.role,
    });

    await db.user.update({
      where: { id: userId },
      data: {
        password: hashedPassword,
      },
    });
  } catch (error) {
    console.error("Password reset email failed:", error);

    redirect(
      buildUsersRedirect({
        error: `Password reset email could not be sent to ${user.email}. No password change was completed.`,
        q,
        role,
        track,
        status,
      })
    );
  }

  redirect(
    buildUsersRedirect({
      success: "reset",
      name: user.name,
      email: user.email,
      q,
      role,
      track,
      status,
    })
  );
}