import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectDB } from '@/lib/mongodb';
import { requireUser, jsonError, parsePagination } from '@/lib/apiAuth';
import { istToInstant, instantToIstDateInput } from '@/lib/format';
import Consultation, { CONSULTATION_STATUSES } from '@/models/Consultation';

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

export async function POST() {
  return jsonError('Consultations are created from WhatsApp conversations', 405);
}
