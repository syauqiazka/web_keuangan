import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("sesi_token")?.value;

  // Lewati static assets, public files, dan api internal Next.js
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/logo-bank-saku-digital.jpeg") ||
    pathname === "/favicon.ico"
  ) {
    return NextResponse.next();
  }

  const isAuthPage = pathname === "/masuk";

  // Jika belum login dan mengakses halaman internal
  if (!token && !isAuthPage) {
    const url = request.nextUrl.clone();
    url.pathname = "/masuk";
    return NextResponse.redirect(url);
  }

  // Jika sudah login dan membuka halaman masuk
  if (token && isAuthPage) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
