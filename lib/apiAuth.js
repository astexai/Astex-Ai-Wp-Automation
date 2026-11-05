import { NextResponse } from 'next/server';
import { getCurrentUser } from './auth';

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) {
    return { user: null, error: NextResponse.json({ error: 'Not authenticated' }, { status: 401 }) };
  }
  return { user, error: null };
}

export function jsonError(message, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export function parsePagination(searchParams, defaultLimit = 20) {
  const page = Math.max(1, Number(searchParams.get('page')) || 1);
  const limit = Math.min(100, Math.max(1, Number(searchParams.get('limit')) || defaultLimit));
  return { page, limit, skip: (page - 1) * limit };
}

export function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
