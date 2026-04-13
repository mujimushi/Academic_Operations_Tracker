import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl;
    const role = req.nextauth.token?.role;

    const roleRoutes: Record<string, string[]> = {
      PRO_RECTOR: ["/pro-rector"],
      DIRECTOR: ["/director"],
      COORDINATOR: ["/coordinator"],
      ADMIN: ["/admin"],
      TEAM_RESOURCE: ["/task"],
    };

    // Check if user has access to this route group
    for (const [allowedRole, prefixes] of Object.entries(roleRoutes)) {
      for (const prefix of prefixes) {
        if (pathname.startsWith(prefix) && role !== allowedRole) {
          return NextResponse.redirect(new URL("/unauthorized", req.url));
        }
      }
    }

    // Redirect "/" to role-based home
    if (pathname === "/") {
      const redirectMap: Record<string, string> = {
        PRO_RECTOR: "/pro-rector/dashboard",
        DIRECTOR: "/director/dashboard",
        COORDINATOR: "/coordinator/tasks",
        ADMIN: "/admin/users",
        TEAM_RESOURCE: "/task/landing",
      };
      const target = redirectMap[role as string] || "/unauthorized";
      return NextResponse.redirect(new URL(target, req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

export const config = {
  matcher: [
    "/",
    "/pro-rector/:path*",
    "/director/:path*",
    "/coordinator/:path*",
    "/admin/:path*",
    "/task/:path*",
  ],
};
