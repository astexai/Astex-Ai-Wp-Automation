import mongoose from 'mongoose';
import { LEAD_STATUSES, IMPLEMENTATION_PLANS, BUSINESS_TYPES } from '@/lib/leadOptions';

const LeadSchema = new mongoose.Schema(
  {
    fullName: { type: String, trim: true, default: '' },
    phoneNumber: { type: String, required: true, unique: true, index: true },
    contactNumber: { type: String, default: '' },
    city: { type: String, trim: true, default: '' },
    businessName: { type: String, trim: true, default: '' },
    businessType: { type: String, enum: [...BUSINESS_TYPES, ''], default: '' },
    language: { type: String, enum: ['en', 'hi', ''], default: '' },
    requiredServices: { type: [String], default: [] },
    leadSources: { type: [String], default: [] },
    dailyLeadVolume: { type: String, default: '' },
    currentChallenges: { type: [String], default: [] },
    pricingComfortable: { type: Boolean, default: null },
    demoRequested: { type: Boolean, default: false },
    demoSent: { type: Boolean, default: false },
    demoWatched: { type: Boolean, default: false },
    implementationPlan: { type: String, default: '' },
    founderConsultationRequested: { type: Boolean, default: false },
    leadStatus: { type: String, enum: LEAD_STATUSES, default: 'New Lead', index: true },
    lostReason: { type: String, default: '' },
    leadScore: { type: Number, default: 0 },
    qualificationStatus: {
      type: String,
      enum: ['In Progress', 'Qualified', 'Not Qualified', 'Completed'],
      default: 'In Progress',
    },
    assignedTo: { type: String, default: '' },
    currentConversationStep: { type: String, default: 'LANGUAGE_SELECTION' },
    conversationCompleted: { type: Boolean, default: false },
    source: { type: String, default: 'whatsapp' },
    adReferralData: { type: mongoose.Schema.Types.Mixed, default: null },
  },
  { timestamps: true }
);

LeadSchema.index({ createdAt: -1 });
LeadSchema.index({ city: 1 });
LeadSchema.index({ businessType: 1 });

export default mongoose.models.Lead || mongoose.model('Lead', LeadSchema);
