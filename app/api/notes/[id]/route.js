import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectDB } from '@/lib/mongodb';
import { requireUser, jsonError } from '@/lib/apiAuth';
import { parseNoteInput } from '@/lib/noteInput';
import Note from '@/models/Note';

export const runtime = 'nodejs';

export async function PATCH(request, { params }) {
  const { error } = await requireUser();
  if (error) return error;
  if (!mongoose.Types.ObjectId.isValid(params.id)) return jsonError('Invalid note id', 400);

  const body = await request.json().catch(() => null);
  if (!body) return jsonError('Invalid request body', 400);

  const parsed = parseNoteInput(body);
  if (parsed.error) return jsonError(parsed.error, 400);

  await connectDB();
  const updated = await Note.findByIdAndUpdate(params.id, { $set: parsed }, { new: true }).lean();
  if (!updated) return jsonError('Note not found', 404);
  return NextResponse.json({ item: updated });
}
