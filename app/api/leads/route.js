import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { requireUser, jsonError, parsePagination, escapeRegex } from '@/lib/apiAuth';
import Lead from '@/models/Lead';
import { LEAD_STATUSES, IMPLEMENTATION_PLANS, BUSINESS_TYPES } from '@/lib/leadOptions';
import { istToInstant } from '@/lib/format';

export const runtime = 'nodejs';

const DATE_RX = /^\d{4}-\d{2}-\d{2}$/;

function buildLeadFilter(searchParams) {
  const filter = {};
  const search = (searchParams.get('search') || '').trim();
  if (search) {
    const rx = new RegExp(escapeRegex(search), 'i');
    filter.$or = [{ fullName: rx }, { contactNumber: rx }, { phoneNumber: rx }, { businessName: rx }];
  }
  const city = searchParams.get('city');
  if (city) filter.city = new RegExp(`^${escapeRegex(city)}$`, 'i');

  const businessType = searchParams.get('businessType');
  if (businessType && BUSINESS_TYPES.includes(businessType)) filter.businessType = businessType;

  const pricing = searchParams.get('pricing');
  if (pricing === 'comfortable') filter.pricingComfortable = true;
  if (pricing === 'not') filter.pricingComfortable = false;

  const plan = searchParams.get('plan');
  if (plan && IMPLEMENTATION_PLANS.includes(plan)) filter.implementationPlan = plan;

  const status = searchParams.get('status');
  if (status && LEAD_STATUSES.includes(status)) filter.leadStatus = status;

  const date = searchParams.get('date') || '';
  if (DATE_RX.test(date)) {
    const start = istToInstant(date, '00:00');
    filter.createdAt = { $gte: start, $lt: new Date(start.getTime() + 24 * 60 * 60 * 1000) };
  }

  return filter;
}

export async function GET(request) {
  const { error } = await requireUser();
  if (error) return error;
  await connectDB();

  const { searchParams } = new URL(request.url);
  const { page, limit, skip } = parsePagination(searchParams);
  const filter = buildLeadFilter(searchParams);

  const [items, total, summaryTotal, inFollowUps, converted] = await Promise.all([
    Lead.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Lead.countDocuments(filter),
    Lead.countDocuments({}),
    Lead.countDocuments({ leadStatus: 'In Follow-ups' }),
    Lead.countDocuments({ leadStatus: 'Converted' }),
  ]);

  return NextResponse.json({
    items,
    total,
    page,
    pages: Math.max(1, Math.ceil(total / limit)),
    summary: { total: summaryTotal, inFollowUps, converted },
  });
}

export async function POST() {
  return jsonError('Leads are created automatically from WhatsApp conversations', 405);
}
