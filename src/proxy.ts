import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE, verifySession } from "@/lib/session";

const PUBLIC_PATHS = ["/login", "/manifest.webmanifest"];
// PWA install assets (manifest + icons) must be reachable without a
// session — the browser/OS fetches these before the user has ever signed
// in, to decide whether the app can be installed to the home screen.
const PUBLIC_FILE_PATTERN = /^\/(icon-\d+\.png|apple-touch-icon\.png)$/;

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isPublic =
    PUBLIC_PATHS.some((p) => pathname === p) ||
    PUBLIC_FILE_PATTERN.test(pathname) ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/public") ||
    pathname === "/favicon.ico";

  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const session = token ? await verifySession(token) : null;

  if (!isPublic && !session) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (pathname === "/login" && session) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  if (pathname === "/") {
    return NextResponse.redirect(new URL(session ? "/dashboard" : "/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image).*)"],
};
