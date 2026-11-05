import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectDB } from '@/lib/mongodb';
import { requireUser, jsonError } from '@/lib/apiAuth';
import Message from '@/models/Message';

export const runtime = 'nodejs';

export async function GET(request, { params }) {
  const { error } = await requireUser();
  if (error) return error;
  if (!mongoose.Types.ObjectId.isValid(params.leadId)) return jsonError('Invalid lead id', 400);
  await connectDB();

  const items = await Message.find({ leadId: params.leadId }).sort({ timestamp: 1 }).limit(500).lean();
  return NextResponse.json({ items });
}
