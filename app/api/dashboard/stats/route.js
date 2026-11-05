import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { requireUser } from '@/lib/apiAuth';
import Lead from '@/models/Lead';
import Consultation from '@/models/Consultation';
import { istToInstant, instantToIstDateInput } from '@/lib/format';

export const runtime = 'nodejs';

export async function GET() {
  const { error } = await requireUser();
  if (error) return error;
  await connectDB();

  const startToday = istToInstant(instantToIstDateInput(new Date()), '00:00');
  const endToday = new Date(startToday.getTime() + 24 * 60 * 60 * 1000);
  const todayRange = { $gte: startToday, $lt: endToday };

  const [totalLeads, todaysLeads, todaysConsultations, converted, recentLeads, consultationRequests] =
    await Promise.all([
      Lead.countDocuments({}),
      Lead.countDocuments({ createdAt: todayRange }),
      Consultation.countDocuments({
        status: { $in: ['Pending', 'Scheduled', 'Rescheduled'] },
        $or: [{ confirmedDate: todayRange }, { confirmedDate: null, requestedDate: todayRange }],
      }),
      Lead.countDocuments({ leadStatus: 'Converted' }),
      Lead.find({}).sort({ createdAt: -1 }).limit(5).lean(),
      Consultation.find({ status: 'Pending' })
        .sort({ requestedDate: 1 })
        .limit(5)
        .populate({ path: 'leadId', select: 'fullName contactNumber phoneNumber city businessName' })
        .lean(),
    ]);

  return NextResponse.json({
    stats: { totalLeads, todaysLeads, todaysConsultations, converted },
    recentLeads,
    consultationRequests: consultationRequests.filter((c) => c.leadId),
  });
}
