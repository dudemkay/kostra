import { getAuthUser, JWT_KEY, JWTPayload } from '@/lib/auth/jwt';
import {
  applyCorsHeaders,
  checkAccess,
  findMatchingRoute,
  handleCorsPreflightRequest,
  isRouteConfigured,
} from '@/lib/routes';
import { NextRequest, NextResponse } from 'next/server';
import { UserRole } from './lib/prisma/generated/enums';
import { forbiddenResponse } from './lib/utils/response/response';

// Next.js 16 calls this file's request handler "Proxy".
// Keep authentication and authorization decisions here, while leaving
// public routes completely untouched.
const proxy = async (request: NextRequest) => {
  const preflightResponse = handleCorsPreflightRequest(request);
  if (preflightResponse) return preflightResponse;

  const { pathname: path } = new URL(request.url);
  const { method } = request;
  const matchedRoute = findMatchingRoute(path);

  if (!matchedRoute || !isRouteConfigured(path)) {
    const response = NextResponse.json(
      { error: 'Route not found', message: 'This route is not configured' },
      { status: 404 }
    );
    return applyCorsHeaders(request, response);
  }

  // Public routes do not need authentication or role checks.
  if (matchedRoute.isPublic) {
    return applyCorsHeaders(request, NextResponse.next());
  }

  let authUser: JWTPayload | null = null;
  try {
    authUser = await getAuthUser(request);
  } catch (error) {
    console.error('Auth error:', error);
  }

  const methodAccess = matchedRoute.accessTo?.[
    method as Exclude<'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH', null>
  ];

  // An empty access list explicitly means that this HTTP method is public.
  const isPublicMethod = Array.isArray(methodAccess) && methodAccess.length === 0;

  if (isPublicMethod) {
    return applyCorsHeaders(request, NextResponse.next());
  }

  // Protected route: an authenticated user is required.
  if (!authUser) {
    if (path.startsWith('/api/')) {
      const response = forbiddenResponse();
      response.cookies.delete(JWT_KEY || 'auth-token');
      return applyCorsHeaders(request, response);
    }

    // Keep the existing landing-page auth UX. The application does not need
    // separate /login or /signup pages.
    const response = NextResponse.redirect(new URL('/', request.url));
    response.cookies.delete(JWT_KEY || 'auth-token');
    return response;
  }

  // If this route has role restrictions for the current method, enforce them.
  if (methodAccess) {
    const userRole = authUser.role.toUpperCase() as UserRole;
    const hasAccess = checkAccess(path, method, userRole);

    if (!hasAccess) {
      if (path.startsWith('/api/')) {
        return applyCorsHeaders(request, forbiddenResponse());
      }

      // Authenticated but unauthorized: do not pretend the route does not
      // exist. Send the user back to the application dashboard.
      return NextResponse.redirect(new URL('/app', request.url));
    }
  }

  const response = NextResponse.next();
  response.headers.set('x-user-id', authUser.userId.toString());
  return applyCorsHeaders(request, response);
};

export default proxy;

export const config = {
  matcher: [
    '/((?!monitoring|_next/static|_next/image|favicon.ico|favicon/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|webmanifest)$).*)',
  ],
};
