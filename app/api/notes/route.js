import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectDB } from '@/lib/mongodb';
import { requireUser, jsonError } from '@/lib/apiAuth';
import { parseNoteInput } from '@/lib/noteInput';
import Note from '@/models/Note';
import Lead from '@/models/Lead';

export const runtime = 'nodejs';

export async function GET(request) {
  const { error } = await requireUser();
  if (error) return error;
  const leadId = new URL(request.url).searchParams.get('leadId');
  if (!mongoose.Types.ObjectId.isValid(leadId || '')) return jsonError('Invalid lead id', 400);
  await connectDB();

  const notes = await Note.find({ leadId }).sort({ createdAt: -1 }).lean();
  return NextResponse.json({ items: notes });
}

export async function POST(request) {
  const { user, error } = await requireUser();
  if (error) return error;

  const body = await request.json().catch(() => null);
  if (!body) return jsonError('Invalid request body', 400);
  if (!mongoose.Types.ObjectId.isValid(body.leadId || '')) return jsonError('Invalid lead id', 400);

  const parsed = parseNoteInput(body);
  if (parsed.error) return jsonError(parsed.error, 400);

  await connectDB();
  const lead = await Lead.findById(body.leadId).select('_id').lean();
  if (!lead) return jsonError('Lead not found', 404);

  const created = await Note.create({ leadId: body.leadId, ...parsed, createdBy: user.name });
  return NextResponse.json({ item: created.toObject() }, { status: 201 });
}
