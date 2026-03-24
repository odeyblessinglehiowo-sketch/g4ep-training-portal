import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const hostname = request.headers.get("host") ?? "";
  const forwardedProto = request.headers.get("x-forwarded-proto");

  const isProductionDomain =
    hostname === "portal.geeeep.com.ng" ||
    hostname.endsWith(".up.railway.app");

  if (isProductionDomain && forwardedProto === "http") {
    const httpsUrl = new URL(request.url);
    httpsUrl.protocol = "https:";
    return NextResponse.redirect(httpsUrl, 301);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};