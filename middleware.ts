import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"

export function middleware(request: NextRequest) {
  const enable = process.env.ENABLE_TEST_ROUTES === "true"
  const path = request.nextUrl.pathname

  if (!enable) {
    if (
      path.startsWith("/api/debug/") ||
      path === "/test-paypal" ||
      path.startsWith("/test-paypal/") ||
      path === "/test-paypal-credentials" ||
      path === "/test-payments-i18n"
    ) {
      return new NextResponse("Not Found", { status: 404 })
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    "/api/debug/:path*",
    "/test-paypal",
    "/test-paypal/:path*",
    "/test-paypal-credentials",
    "/test-payments-i18n",
  ],
}

