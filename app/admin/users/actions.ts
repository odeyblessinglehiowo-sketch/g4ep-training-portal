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
  page?: string;
  perPage?: string;
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
  if (params.page && params.page !== "1") searchParams.set("page", params.page);
  if (params.perPage) searchParams.set("perPage", params.perPage);

  return `/admin/users?${searchParams.toString()}`;
}

export async function toggleUserStatus(formData: FormData) {
  const currentAdmin = await requireRole("ADMIN");

  const userId = formData.get("userId")?.toString();
  const q = formData.get("q")?.toString() ?? "";
  const role = formData.get("role")?.toString() ?? "ALL";
  const track = formData.get("track")?.toString() ?? "ALL";
  const status = formData.get("status")?.toString() ?? "ALL";
  const page = formData.get("page")?.toString() ?? "1";
  const perPage = formData.get("perPage")?.toString() ?? "10";

  if (!userId) {
    redirect(
      buildUsersRedirect({
        error: "Missing user ID.",
        q,
        role,
        track,
        status,
        page,
        perPage,
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
        page,
        perPage,
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
        page,
        perPage,
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
          page,
          perPage,
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
      page,
      perPage,
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
  const page = formData.get("page")?.toString() ?? "1";
  const perPage = formData.get("perPage")?.toString() ?? "10";

  if (!userId) {
    redirect(
      buildUsersRedirect({
        error: "Missing user ID.",
        q,
        role,
        track,
        status,
        page,
        perPage,
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
        page,
        perPage,
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
        page,
        perPage,
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
        page,
        perPage,
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
      page,
      perPage,
    })
  );
}

export async function deleteUser(formData: FormData) {
  const currentAdmin = await requireRole("ADMIN");

  const userId = formData.get("userId")?.toString();
  const q = formData.get("q")?.toString() ?? "";
  const role = formData.get("role")?.toString() ?? "ALL";
  const track = formData.get("track")?.toString() ?? "ALL";
  const status = formData.get("status")?.toString() ?? "ALL";
  const page = formData.get("page")?.toString() ?? "1";
  const perPage = formData.get("perPage")?.toString() ?? "10";

  if (!userId) {
    redirect(
      buildUsersRedirect({
        error: "Missing user ID.",
        q,
        role,
        track,
        status,
        page,
        perPage,
      })
    );
  }

  const user = await db.user.findUnique({
    where: { id: userId },
    include: {
      student: true,
      teacher: true,
    },
  });

  if (!user) {
    redirect(
      buildUsersRedirect({
        error: "User not found.",
        q,
        role,
        track,
        status,
        page,
        perPage,
      })
    );
  }

  if (user.id === currentAdmin.userId) {
    redirect(
      buildUsersRedirect({
        error: "You cannot delete the account you are currently using.",
        q,
        role,
        track,
        status,
        page,
        perPage,
      })
    );
  }

  if (user.role === "ADMIN" && user.isActive) {
    const activeAdmins = await db.user.count({
      where: {
        role: "ADMIN",
        isActive: true,
      },
    });

    if (activeAdmins <= 1) {
      redirect(
        buildUsersRedirect({
          error: "You cannot delete the last active admin.",
          q,
          role,
          track,
          status,
          page,
          perPage,
        })
      );
    }
  }

  try {
    if (user.student) {
      await db.attendanceRecord.deleteMany({
        where: { studentId: user.student.id },
      });

      await db.assignmentView.deleteMany({
        where: { studentId: user.student.id },
      });

      await db.submission.deleteMany({
        where: { studentId: user.student.id },
      });

      await db.certificate.deleteMany({
        where: { studentId: user.student.id },
      });

      await db.student.delete({
        where: { id: user.student.id },
      });
    }

    if (user.teacher) {
      await db.assignment.deleteMany({
        where: { teacherId: user.teacher.id },
      });

      await db.attendanceSession.deleteMany({
        where: { teacherId: user.teacher.id },
      });

      await db.teacher.delete({
        where: { id: user.teacher.id },
      });
    }

    await db.user.delete({
      where: { id: user.id },
    });
  } catch (error) {
    console.error("Delete user failed:", error);

    redirect(
      buildUsersRedirect({
        error:
          "This user could not be deleted. There may still be related records linked to the account.",
        q,
        role,
        track,
        status,
        page,
        perPage,
      })
    );
  }

  redirect(
    buildUsersRedirect({
      success: "deleted",
      name: user.name,
      q,
      role,
      track,
      status,
      page,
      perPage,
    })
  );
}