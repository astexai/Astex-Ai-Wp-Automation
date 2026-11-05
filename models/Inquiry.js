import mongoose from 'mongoose';

const InquirySchema = new mongoose.Schema(
  {
    leadId: { type: mongoose.Schema.Types.ObjectId, ref: 'Lead', required: true, index: true },
    fullName: { type: String, default: '' },
    contactNumber: { type: String, default: '' },
    city: { type: String, default: '' },
    businessName: { type: String, default: '' },
    businessType: { type: String, default: '' },
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
  },
  { timestamps: true }
);

export default mongoose.models.Inquiry || mongoose.model('Inquiry', InquirySchema);
