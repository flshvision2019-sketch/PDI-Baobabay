import { NextRequest, NextResponse } from "next/server";
import { getCookieName, verifySession } from "./src/lib/auth";

const protectedPaths = ["/pdi", "/admin", "/supervisor"];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const needsAuth = protectedPaths.some((p) => pathname.startsWith(p));
  if (!needsAuth) return NextResponse.next();

  const token = req.cookies.get(getCookieName())?.value;
  if (!token) return NextResponse.redirect(new URL("/login", req.url));

  try {
    const session = await verifySession(token);

    if (pathname.startsWith("/admin") && session.role !== "HR_ADMIN") {
      return NextResponse.redirect(new URL("/pdi", req.url));
    }
    if (pathname.startsWith("/supervisor") && session.role !== "SUPERVISOR" && session.role !== "HR_ADMIN") {
      return NextResponse.redirect(new URL("/pdi", req.url));
    }
    return NextResponse.next();
  } catch {
    const res = NextResponse.redirect(new URL("/login", req.url));
    res.cookies.delete(getCookieName());
    return res;
  }
}

export const config = { matcher: ["/pdi/:path*", "/admin/:path*", "/supervisor/:path*"] };
