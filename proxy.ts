import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyToken } from "./lib/auth";

const publicPaths: string[] = [
  "/",
  "/login",
  "/register",
  "/api/auth/register",
  "/api/auth/login",
  "/api/auth/logout",
  "/api/auth/me",
  "/admin/login",
  "/api/admin/login",
  "/api/payment/wechat/notify",
];

const publicApiPrefixes = [
  "/api/characters",
  "/api/analysis",
  "/api/chat",
];

const publicApiMethods: Record<string, string[]> = {
  "/api/characters": ["GET"],
};

function isPublicPath(pathname: string, method: string) {
  if (publicApiMethods[pathname]?.includes(method)) {
    return true;
  }
  if (publicApiPrefixes.some((prefix) => pathname.startsWith(prefix) && method === "GET")) {
    return true;
  }
  return publicPaths.some((path) => pathname === path || pathname.startsWith(path + "/"));
}

function redirectToLogin(request: NextRequest, pathname: string) {
  const isAdminArea =
    pathname === "/admin" ||
    (pathname.startsWith("/admin/") && pathname !== "/admin/login") ||
    (pathname.startsWith("/api/admin/") && pathname !== "/api/admin/login");

  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  const loginUrl = new URL(isAdminArea ? "/admin/login" : "/login", request.url);
  if (!isAdminArea) {
    loginUrl.searchParams.set("from", pathname);
  }
  return NextResponse.redirect(loginUrl);
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const method = request.method;

  if (pathname.startsWith("/_next") || pathname.startsWith("/static") || pathname.startsWith("/favicon")) {
    return NextResponse.next();
  }

  if (isPublicPath(pathname, method)) {
    return NextResponse.next();
  }

  const token = request.cookies.get("qianren-session")?.value;
  if (!token) {
    return redirectToLogin(request, pathname);
  }

  const payload = verifyToken(token);
  if (!payload) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "登录已失效" }, { status: 401 });
    }
    const isAdminArea =
      pathname === "/admin" ||
      (pathname.startsWith("/admin/") && pathname !== "/admin/login");
    const loginUrl = new URL(isAdminArea ? "/admin/login" : "/login", request.url);
    if (!isAdminArea) {
      loginUrl.searchParams.set("from", pathname);
    }
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!.*\\.).*)",
  ],
};
