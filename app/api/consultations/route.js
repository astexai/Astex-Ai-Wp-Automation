import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectDB } from '@/lib/mongodb';
import { requireUser, jsonError, parsePagination } from '@/lib/apiAuth';
import { istToInstant, instantToIstDateInput } from '@/lib/format';
import Consultation, { CONSULTATION_STATUSES } from '@/models/Consultation';
import Lead from '@/models/Lead';
import { notifyConsultationChange } from '@/services/consultationService';

export const runtime = 'nodejs';

const CONSULTATION_POPULATE = { path: 'leadId', select: 'fullName contactNumber phoneNumber city businessName' };
const DATE_RX = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RX = /^([01]\d|2[0-3]):[0-5]\d$/;

function startOfIstToday() {
  const todayYmd = instantToIstDateInput(new Date());
  return istToInstant(todayYmd, '00:00');
}

export async function GET(request) {
  const { error } = await requireUser();
  if (error) return error;
  await connectDB();

  const { searchParams } = new URL(request.url);
  const { page, limit, skip } = parsePagination(searchParams);
  const filter = {};
  const status = searchParams.get('status');
  if (status && CONSULTATION_STATUSES.includes(status)) filter.status = status;

  const startToday = startOfIstToday();
  const endToday = new Date(startToday.getTime() + 24 * 60 * 60 * 1000);

  const [rawItems, total, todays, pending, completed] = await Promise.all([
    Consultation.find(filter).sort({ requestedDate: -1 }).skip(skip).limit(limit).populate(CONSULTATION_POPULATE).lean(),
    Consultation.countDocuments(filter),
    Consultation.countDocuments({ status: 'Scheduled', confirmedDate: { $gte: startToday, $lt: endToday } }),
    Consultation.countDocuments({ status: 'Pending' }),
    Consultation.countDocuments({ status: 'Completed' }),
  ]);

  const items = rawItems.filter((c) => c.leadId);
  return NextResponse.json({
    items,
    total,
    page,
    pages: Math.max(1, Math.ceil(total / limit)),
    summary: { today: todays, pending, completed },
  });
}

export async function POST(request) {
  const { error } = await requireUser();
  if (error) return error;

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== 'object') return jsonError('Invalid request body', 400);
  if (!mongoose.Types.ObjectId.isValid(body.leadId)) return jsonError('Select a valid lead', 400);
  if (!DATE_RX.test(body.date || '') || !TIME_RX.test(body.time || '')) {
    return jsonError('Enter a valid date and time', 400);
  }

  const requestedDate = istToInstant(body.date, body.time);
  if (instantToIstDateInput(requestedDate) !== body.date || requestedDate.getTime() <= Date.now()) {
    return jsonError('Consultation date and time must be in the future', 400);
  }

  await connectDB();
  const lead = await Lead.findById(body.leadId);
  if (!lead) return jsonError('Lead not found', 404);

  const consultation = await Consultation.create({
    leadId: lead._id,
    requestedDate,
    requestedTime: body.time,
    confirmedDate: requestedDate,
    confirmedTime: body.time,
    meetingWith: process.env.FOUNDER_NAME || 'Aditya Patel',
    status: 'Scheduled',
  });
  const notificationError = await notifyConsultationChange(
    lead,
    { status: 'Pending', confirmedDate: null, confirmedTime: '' },
    { status: consultation.status, confirmedDate: consultation.confirmedDate, confirmedTime: consultation.confirmedTime }
  );
  return NextResponse.json({ consultation, notificationError }, { status: 201 });
}
