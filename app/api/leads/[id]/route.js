import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectDB } from '@/lib/mongodb';
import { requireUser, jsonError } from '@/lib/apiAuth';
import Lead from '@/models/Lead';
import { LEAD_STATUSES } from '@/lib/leadOptions';
import Consultation from '@/models/Consultation';
import Message from '@/models/Message';
import Note from '@/models/Note';
import Inquiry from '@/models/Inquiry';
import Conversation from '@/models/Conversation';

export const runtime = 'nodejs';

function validId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

export async function GET(request, { params }) {
  const { error } = await requireUser();
  if (error) return error;
  if (!validId(params.id)) return jsonError('Invalid lead id', 400);
  await connectDB();

  const lead = await Lead.findById(params.id).lean();
  if (!lead) return jsonError('Lead not found', 404);

  const [consultations, notes, inquiries] = await Promise.all([
    Consultation.find({ leadId: lead._id }).sort({ requestedDate: -1 }).lean(),
    Note.find({ leadId: lead._id }).sort({ createdAt: -1 }).lean(),
    Inquiry.find({ leadId: lead._id }).sort({ createdAt: -1 }).lean(),
  ]);

  return NextResponse.json({ lead, consultations, notes, inquiries });
}

export async function PATCH(request, { params }) {
  const { error } = await requireUser();
  if (error) return error;
  if (!validId(params.id)) return jsonError('Invalid lead id', 400);

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== 'object') return jsonError('Invalid request body', 400);

  const update = {};
  if (body.leadStatus !== undefined) {
    if (!LEAD_STATUSES.includes(body.leadStatus)) return jsonError('Unknown lead status', 400);
    update.leadStatus = body.leadStatus;
  }
  if (body.lostReason !== undefined) {
    update.lostReason = String(body.lostReason).slice(0, 500);
  }
  if (update.leadStatus && update.leadStatus !== 'Lost') update.lostReason = '';
  if (Object.keys(update).length === 0) return jsonError('Nothing to update', 400);

  await connectDB();
  const lead = await Lead.findByIdAndUpdate(params.id, { $set: update }, { new: true }).lean();
  if (!lead) return jsonError('Lead not found', 404);
  return NextResponse.json({ lead });
}

export async function DELETE(request, { params }) {
  const { error } = await requireUser();
  if (error) return error;
  if (!validId(params.id)) return jsonError('Invalid lead id', 400);
  await connectDB();

  const lead = await Lead.findById(params.id);
  if (!lead) return jsonError('Lead not found', 404);

  await Promise.all([
    Message.deleteMany({ leadId: lead._id }),
    Consultation.deleteMany({ leadId: lead._id }),
    Note.deleteMany({ leadId: lead._id }),
    Conversation.deleteMany({ leadId: lead._id }),
  ]);
  await lead.deleteOne();
  return NextResponse.json({ ok: true });
}
