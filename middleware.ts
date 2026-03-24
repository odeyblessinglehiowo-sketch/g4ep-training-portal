import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const host = request.headers.get("host") ?? "";
  const proto = request.headers.get("x-forwarded-proto") ?? "";

  const isCustomDomain = host === "portal.geeeep.com.ng";

  if (isCustomDomain && proto !== "https") {
    const url = request.nextUrl.clone();
    url.protocol = "https";
    return NextResponse.redirect(url, 301);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};