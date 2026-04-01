import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const protectedPaths = ['/dashboard']
const authPaths = ['/auth/sign-in', '/auth/sign-up', '/auth/forgot-password']

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Check for auth token in cookie or via client-side redirect
  // Since we use localStorage for tokens (client-side), middleware can only
  // check a lightweight session cookie. For now, we'll handle auth redirects
  // client-side in the dashboard layout.

  // Prevent caching of auth pages
  if (authPaths.some(path => pathname.startsWith(path))) {
    const response = NextResponse.next()
    response.headers.set('Cache-Control', 'no-store')
    return response
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*', '/auth/:path*'],
}
