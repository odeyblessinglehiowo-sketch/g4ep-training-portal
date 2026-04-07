import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { markAttendanceByCodeForStudent } from "@/lib/attendance";
import { revalidatePath } from "next/cache";

function getBaseUrl(request: Request) {
  const forwardedProto = request.headers.get("x-forwarded-proto");
  const forwardedHost = request.headers.get("x-forwarded-host");
  const host = request.headers.get("host");

  if (forwardedHost) {
    return `${forwardedProto ?? "https"}://${forwardedHost}`;
  }

  if (host) {
    const protocol = host.includes("localhost") ? "http" : "https";
    return `${protocol}://${host}`;
  }

  return process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || "https://portal.geeeep.com.ng";
}

function buildResultUrl(request: Request, params: Record<string, string>) {
  const url = new URL("/student/attendance/scan/result", getBaseUrl(request));

  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.set(key, value);
  });

  return url;
}

function getSafeNextPath(pathWithSearch: string) {
  if (!pathWithSearch.startsWith("/")) {
    return "/student/attendance";
  }

  return pathWithSearch;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code")?.trim().toUpperCase();

  if (!code) {
    return NextResponse.redirect(
      buildResultUrl(request, {
        status: "error",
        message: "Attendance QR code is missing or invalid.",
      })
    );
  }

  const user = await getCurrentUser();

  if (!user) {
    const nextPath = getSafeNextPath(
      `${url.pathname}?${url.searchParams.toString()}`
    );

    const loginUrl = new URL("/login", getBaseUrl(request));
    loginUrl.searchParams.set("next", nextPath);

    return NextResponse.redirect(loginUrl);
  }

  if (user.role !== "STUDENT") {
    return NextResponse.redirect(
      buildResultUrl(request, {
        status: "error",
        message: "Only students can mark attendance with this QR code.",
      })
    );
  }

  try {
    const result = await markAttendanceByCodeForStudent(user.userId, code);

    revalidatePath("/student/attendance");
    revalidatePath("/student/dashboard");
    revalidatePath("/teacher/attendance");
    revalidatePath("/teacher/students");
    revalidatePath("/admin/attendance");
    revalidatePath("/admin/dashboard");

    return NextResponse.redirect(
      buildResultUrl(request, {
        status: "success",
        title: result.sessionTitle,
        time: result.checkedInAt,
      })
    );
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Attendance could not be marked.";

    return NextResponse.redirect(
      buildResultUrl(request, {
        status: "error",
        message,
      })
    );
  }
}