
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { jwtVerify } from 'jose'

const SECRET_KEY = new TextEncoder().encode(process.env.JWT_SECRET || 'default_secret_key')

export async function middleware(request: NextRequest) {
  const token = request.cookies.get('auth_token')?.value

  const isLoginPage = request.nextUrl.pathname === '/login'

  // If trying to access login page while authenticated, redirect to home
  if (isLoginPage && token) {
    try {
      await jwtVerify(token, SECRET_KEY)
      return NextResponse.redirect(new URL('/', request.url))
    } catch (error) {
      // Token invalid, allow access to login page
    }
  }

  // If trying to access protected route without token
  if (!isLoginPage && !token) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Verify token for protected routes
  if (!isLoginPage && token) {
    try {
      await jwtVerify(token, SECRET_KEY)
    } catch (error) {
      // Token invalid, redirect to login
      const response = NextResponse.redirect(new URL('/login', request.url))
      response.cookies.delete('auth_token')
      return response
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes) - Optional: protect API routes too if needed
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
