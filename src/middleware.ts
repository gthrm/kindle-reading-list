import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";
import { getJwtSecret } from "./lib/auth";

export async function middleware(request: NextRequest) {
  const publicPaths = ["/", "/auth/login", "/auth/register", "/r"];

  const apiAuthExemptPaths = [
    "/api/auth/login",
    "/api/auth/register",
    "/api/auth/logout",
    "/api/user/",
    "/api/public/",
  ];

  const publicReadingApiPaths = [
    "/api/public/reading-lists/",
  ];

  const { pathname } = request.nextUrl;
  console.log("Middleware: Processing request for path:", pathname);

  const isPublicPath = publicPaths.some(
    (path) => pathname === path || pathname.startsWith(path + "/")
  );
  const isApiAuthExempt = apiAuthExemptPaths.some((path) =>
    pathname.startsWith(path)
  );
  const isPublicReadingApi = publicReadingApiPaths.some((path) =>
    pathname.startsWith(path)
  );
  const isPublicReadingList =
    pathname.match(/^\/r\/[a-zA-Z0-9_-]+$/) && request.method === "GET";

  if (isPublicPath || isApiAuthExempt || isPublicReadingList || isPublicReadingApi) {
    console.log("Middleware: Public path or exempt API, allowing access");
    return NextResponse.next();
  }

  const token = request.cookies.get("token")?.value;

  if (!token) {
    console.log("Middleware: No token found in cookies");
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        { message: "Not authenticated" },
        { status: 401 }
      );
    }

    return NextResponse.redirect(new URL("/auth/login", request.url));
  }

  try {
    const secret = getJwtSecret();
    console.log(
      "Middleware: Using JWT_SECRET:",
      secret ? `${secret.substring(0, 3)}...` : "undefined"
    );

    // Используем jose вместо jsonwebtoken для совместимости с Edge Runtime
    const textEncoder = new TextEncoder();
    const secretKey = textEncoder.encode(secret);

    await jwtVerify(token, secretKey);
    console.log("Middleware: Token verification successful");
    return NextResponse.next();
  } catch (error) {
    console.error("Middleware: Token verification failed:", error);
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        { message: "Invalid or expired token" },
        { status: 401 }
      );
    }

    return NextResponse.redirect(new URL("/auth/login", request.url));
  }
}

export const config = {
  matcher: [
    // Match all paths except static files and images
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
