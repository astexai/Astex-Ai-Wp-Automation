import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectDB } from '@/lib/mongodb';
import { requireUser, jsonError } from '@/lib/apiAuth';
import { CONSULTATION_STATUSES } from '@/models/Consultation';
import { istToInstant, instantToIstDateInput } from '@/lib/format';
import { notifyConsultationChange } from '@/services/consultationService';
import Consultation from '@/models/Consultation';
import Lead from '@/models/Lead';

export const runtime = 'nodejs';

const DATE_RX = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RX = /^([01]\d|2[0-3]):[0-5]\d$/;

function snapshot(c) {
  return {
    status: c.status,
    confirmedDate: c.confirmedDate ? new Date(c.confirmedDate) : null,
    confirmedTime: c.confirmedTime || '',
  };
}

export async function GET(request, { params }) {
  const { error } = await requireUser();
  if (error) return error;
  if (!mongoose.Types.ObjectId.isValid(params.id)) return jsonError('Invalid consultation id', 400);
  await connectDB();

  const consultation = await Consultation.findById(params.id).populate('leadId').lean();
  if (!consultation) return jsonError('Consultation not found', 404);
  return NextResponse.json({ consultation });
}

export async function PATCH(request, { params }) {
  const { error } = await requireUser();
  if (error) return error;
  if (!mongoose.Types.ObjectId.isValid(params.id)) return jsonError('Invalid consultation id', 400);

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== 'object') return jsonError('Invalid request body', 400);

  await connectDB();
  const consultation = await Consultation.findById(params.id);
  if (!consultation) return jsonError('Consultation not found', 404);

  const previous = snapshot(consultation);

  if (body.status !== undefined) {
    if (!CONSULTATION_STATUSES.includes(body.status)) return jsonError('Unknown consultation status', 400);
    consultation.status = body.status;
  }
  if (body.adminNotes !== undefined) consultation.adminNotes = String(body.adminNotes).slice(0, 2000);
  if (body.meetingWith !== undefined) consultation.meetingWith = String(body.meetingWith).trim().slice(0, 120);

  if (body.confirmedDate !== undefined || body.confirmedTime !== undefined) {
    const dateStr = body.confirmedDate ?? (consultation.confirmedDate ? instantToIstDateInput(consultation.confirmedDate) : '');
    const timeStr = body.confirmedTime ?? consultation.confirmedTime;
    if (!DATE_RX.test(dateStr) || !TIME_RX.test(timeStr || '')) {
      return jsonError('Enter a valid date and time', 400);
    }
    consultation.confirmedDate = istToInstant(dateStr, timeStr);
    consultation.confirmedTime = timeStr;
  }

  if (!consultation.meetingWith) {
    consultation.meetingWith = process.env.FOUNDER_NAME || 'Aditya Patel';
  }

  if (consultation.status === 'Scheduled' || consultation.status === 'Rescheduled') {
    if (!consultation.confirmedDate || !consultation.confirmedTime) {
      return jsonError('Set a confirmed date and time before scheduling', 400);
    }
  }

  await consultation.save();

  const lead = await Lead.findById(consultation.leadId);
  let notificationError = null;
  if (lead) {
    notificationError = await notifyConsultationChange(lead, previous, snapshot(consultation));
  }

  return NextResponse.json({ consultation: consultation.toObject(), notificationError });
}
