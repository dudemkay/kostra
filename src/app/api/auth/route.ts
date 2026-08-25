import { generateJWT, getAuthUser, JWTPayload } from '@/lib/auth/jwt';
import { NextRequest } from 'next/server';
import { internalServerErrorResponse, successResponse, unauthorizedResponse } from '@/lib/utils';
import { getUserById } from '@/services/repositories/user';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    const authUser = await getAuthUser(request);

    // A missing/expired auth cookie is a normal unauthenticated state,
    // not a database lookup for an undefined user ID.
    if (!authUser?.userId) {
      return unauthorizedResponse();
    }

    const user = await getUserById(authUser.userId);

    if (!user) {
      return unauthorizedResponse();
    }

    const serializableUser = {
      id: user.id,
      email: user.email,
      name: user.name,
      profilePicture: user.profilePicture,
      role: user.role,
      isOnboarded: user.isOnboarded,
      credits: user.credits,
      plan: user.plan,
      isOverdue: user.isOverDue,
      planExpiringAt: user.planExpiringAt,
    };

    const token = await generateJWT(user as unknown as JWTPayload);

    return successResponse({
      user: serializableUser,
      token,
    });
  } catch (error) {
    console.error('Auth error:', error);
    return internalServerErrorResponse();
  }
}
