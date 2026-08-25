import { setAuthCookie, generateJWT } from '@/lib/auth/jwt';
import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

/**
 * Temporary testing access. This is intentionally disabled unless TEST_MODE
 * is explicitly enabled and TEST_AUTH_SECRET matches.
 *
 * It does not bypass the normal application authorization rules; it only
 * creates the same JWT cookie that the normal login flow creates, using an
 * existing database user.
 */
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  if (process.env.TEST_MODE !== 'true') {
    return NextResponse.json({ error: 'Test access is disabled' }, { status: 404 });
  }

  const configuredSecret = process.env.TEST_AUTH_SECRET;
  const configuredEmail = process.env.TEST_AUTH_EMAIL;
  const suppliedSecret = new URL(request.url).searchParams.get('key');

  if (!configuredSecret || !configuredEmail || suppliedSecret !== configuredSecret) {
    return NextResponse.json({ error: 'Invalid test access configuration' }, { status: 403 });
  }

  const user = await prisma.user.findUnique({
    where: { email: configuredEmail },
  });

  if (!user || user.deletedAt) {
    return NextResponse.json(
      { error: 'TEST_AUTH_EMAIL does not match an active database user' },
      { status: 404 }
    );
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
