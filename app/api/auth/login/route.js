import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { authenticateAdmin, createSessionToken, sessionCookieOptions, SESSION_COOKIE } from '@/lib/auth';
import { jsonError } from '@/lib/apiAuth';

export const runtime = 'nodejs';

export async function POST(request) {
  const body = await request.json().catch(() => null);
  const email = typeof body?.email === 'string' ? body.email.trim() : '';
  const password = typeof body?.password === 'string' ? body.password : '';
  if (!email || !password || password.length > 200) return jsonError('Email and password are required', 400);

  const user = authenticateAdmin(email, password);
  if (!user) return jsonError('Invalid email or password', 401);

  const token = await createSessionToken(user);
  cookies().set(SESSION_COOKIE, token, sessionCookieOptions());
  return NextResponse.json({ user: { name: user.name, email: user.email, role: user.role } });
}
