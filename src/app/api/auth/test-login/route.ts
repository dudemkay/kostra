import { setAuthCookie, generateJWT } from '@/lib/auth/jwt';
import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/utils';
import { NextRequest, NextResponse } from 'next/server';

/**
 * Temporary testing access.
 * Disabled unless TEST_MODE=true and TEST_AUTH_SECRET matches.
 * When enabled, it creates/reuses one clearly named test admin account.
 */
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  if (process.env.TEST_MODE !== 'true') {
    return NextResponse.json({ error: 'Test access is disabled' }, { status: 404 });
  }

  const configuredSecret = process.env.TEST_AUTH_SECRET;
  const suppliedSecret = new URL(request.url).searchParams.get('key');

  if (!configuredSecret || !suppliedSecret || suppliedSecret !== configuredSecret) {
    return NextResponse.json({ error: 'Invalid test access configuration' }, { status: 403 });
  }

  const email = process.env.TEST_AUTH_EMAIL || 'test-admin@kostra.local';
  let user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    user = await prisma.user.create({
      data: {
        email,
        name: 'Kostra Test Admin',
        password: await hashPassword(crypto.randomUUID()),
        role: 'ADMIN',
        isOnboarded: true,
        credits: 1000,
        plan: 'PRO',
      },
    });
  }

  if (user.deletedAt) {
    return NextResponse.json({ error: 'Test user is deleted' }, { status: 403 });
  }

  const token = await generateJWT({
    userId: user.id,
    email: user.email,
    role: user.role,
    name: user.name,
    profilePicture: user.profilePicture || undefined,
    isOnboarded: user.isOnboarded,
    credits: user.credits || 0,
    plan: user.plan || 'FREE',
    isOverdue: user.isOverDue || false,
    planExpiringAt: user.planExpiringAt?.toISOString(),
    googleId: user.googleId || '',
    stripeCustomerId: user.stripeCustomerId || undefined,
  });

  await setAuthCookie(token);
  return NextResponse.redirect(new URL('/app', request.url));
}
