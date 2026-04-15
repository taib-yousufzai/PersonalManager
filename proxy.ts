import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function proxy(request: NextRequest) {
  const sessionCookie = request.cookies.get('session')

  if (!sessionCookie?.value) {
    const signInUrl = new URL('/sign-in', request.url)
    return NextResponse.redirect(signInUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - /sign-in (auth route)
     * - /api/ (API routes — verified server-side)
     * - /_next/static (static files)
     * - /_next/image (image optimization)
     * - /favicon.ico
     * - /icons/ (PWA icons)
     * - /manifest.json
     */
    '/((?!sign-in|api|_next/static|_next/image|favicon\\.ico|icons|manifest\\.json|sw\\.js|workbox-).*)',
  ],
}
