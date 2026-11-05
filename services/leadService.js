import { connectDB } from '@/lib/mongodb';
import { normalizePhone } from '@/lib/phone';
import Lead from '@/models/Lead';
import Conversation from '@/models/Conversation';
import Message from '@/models/Message';
import Inquiry from '@/models/Inquiry';

const DUPLICATE_KEY = 11000;

const INQUIRY_FIELDS = [
  'fullName',
  'contactNumber',
  'city',
  'businessName',
  'businessType',
  'requiredServices',
  'leadSources',
  'dailyLeadVolume',
  'currentChallenges',
  'pricingComfortable',
  'demoRequested',
  'demoSent',
  'demoWatched',
  'implementationPlan',
  'founderConsultationRequested',
];

export async function startNewInquiry(leadId) {
  await connectDB();
  return Inquiry.create({ leadId });
}

// Keeps the newest inquiry row in step with the lead's current answers.
export async function syncCurrentInquiry(lead) {
  await connectDB();
  const snapshot = Object.fromEntries(INQUIRY_FIELDS.map((field) => [field, lead[field]]));
  const latest = await Inquiry.findOne({ leadId: lead._id }).sort({ createdAt: -1 });
  if (!latest) return Inquiry.create({ leadId: lead._id, ...snapshot });
  latest.set(snapshot);
  return latest.save();
}

export async function findOrCreateLead(rawPhone, referral) {
  await connectDB();
  const phoneNumber = normalizePhone(rawPhone);

  const existing = await Lead.findOne({ phoneNumber });
  if (existing) {
    const conversation = await getOrCreateConversation(existing._id);
    return { lead: existing, conversation, isNew: false };
  }

  try {
    const lead = await Lead.create({
      phoneNumber,
      source: referral ? 'click_to_whatsapp' : 'whatsapp',
      adReferralData: referral || null,
    });
    const conversation = await getOrCreateConversation(lead._id);
    return { lead, conversation, isNew: true };
  } catch (err) {
    if (err.code !== DUPLICATE_KEY) throw err;
    const lead = await Lead.findOne({ phoneNumber });
    const conversation = await getOrCreateConversation(lead._id);
    return { lead, conversation, isNew: false };
  }
}

export async function getOrCreateConversation(leadId) {
  const conversation = await Conversation.findOne({ leadId });
  if (conversation) return conversation;
  try {
    return await Conversation.create({ leadId });
  } catch (err) {
    if (err.code !== DUPLICATE_KEY) throw err;
    return Conversation.findOne({ leadId });
  }
}

// Returns false when this WhatsApp message id was already stored (a webhook retry).
export async function recordIncomingMessage(leadId, fields) {
  try {
    await Message.create({ leadId, direction: 'incoming', deliveryStatus: 'received', ...fields });
    return true;
  } catch (err) {
    if (err.code === DUPLICATE_KEY) return false;
    throw err;
  }
}
