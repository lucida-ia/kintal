import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  // Check if user has the auth cookie
  const isAuthenticated =
    request.cookies.get("kintal-auth")?.value === "authenticated";

  // If not authenticated and not on the auth page, redirect to auth
  if (!isAuthenticated && !request.nextUrl.pathname.startsWith("/auth")) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth";
    return NextResponse.redirect(url);
  }

  // If authenticated and on auth page, redirect to home
  if (isAuthenticated && request.nextUrl.pathname.startsWith("/auth")) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Match all pages but exclude API routes, static files, and assets
    "/((?!api|_next/static|_next/image|favicon.ico|icon.png).*)",
  ],
};
