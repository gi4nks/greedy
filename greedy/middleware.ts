import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// This middleware is currently a pass-through
// Add any custom middleware logic here as needed
export function middleware(_request: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/api/campaigns/:path*",
    "/api/characters/:path*",
    "/api/relationships/:path*",
    "/api/adventures/:path*",
    "/api/sessions/:path*",
    "/api/export/:path*",
    "/api/search/:path*",
    "/api/wiki/:path*",
    "/api/5etools/:path*",
    "/api/analytics/:path*",
    "/api/game-editions/:path*",
    "/api/images/:path*",
  ],
};
