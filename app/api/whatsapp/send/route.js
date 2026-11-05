import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectDB } from '@/lib/mongodb';
import { requireUser, jsonError } from '@/lib/apiAuth';
import { sendText } from '@/services/outboundService';
import Lead from '@/models/Lead';
import Message from '@/models/Message';

export const runtime = 'nodejs';

const WINDOW_MS = 24 * 60 * 60 * 1000;

export async function POST(request) {
  const { user, error } = await requireUser();
  if (error) return error;

  const body = await request.json().catch(() => null);
  if (!mongoose.Types.ObjectId.isValid(body?.leadId || '')) return jsonError('Invalid lead id', 400);
  const text = typeof body.text === 'string' ? body.text.trim() : '';
  if (!text) return jsonError('Message cannot be empty', 400);
  if (text.length > 4000) return jsonError('Message is too long', 400);

  await connectDB();
  const lead = await Lead.findById(body.leadId);
  if (!lead) return jsonError('Lead not found', 404);

  const lastIncoming = await Message.findOne({ leadId: lead._id, direction: 'incoming' })
    .sort({ timestamp: -1 })
    .lean();
  const windowOpen = lastIncoming && Date.now() - new Date(lastIncoming.timestamp).getTime() < WINDOW_MS;
  if (!windowOpen) {
    return jsonError(
      'The 24-hour WhatsApp reply window has closed. The lead must message you first before you can send a free-form reply.',
      409
    );
  }

  try {
    await sendText(lead, text, user.name);
  } catch (err) {
    return jsonError(`WhatsApp could not deliver the message: ${err.message}`, 502);
  }
  return NextResponse.json({ ok: true }, { status: 201 });
}
