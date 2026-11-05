import mongoose from 'mongoose';

export const CONSULTATION_STATUSES = ['Pending', 'Scheduled', 'Completed', 'Rescheduled', 'Cancelled'];

const ConsultationSchema = new mongoose.Schema(
  {
    leadId: { type: mongoose.Schema.Types.ObjectId, ref: 'Lead', required: true, index: true },
    requestedDate: { type: Date, required: true },
    requestedTime: { type: String, required: true },
    confirmedDate: { type: Date, default: null },
    confirmedTime: { type: String, default: '' },
    meetingWith: { type: String, default: '' },
    status: { type: String, enum: CONSULTATION_STATUSES, default: 'Pending', index: true },
    adminNotes: { type: String, default: '' },
  },
  { timestamps: true }
);

ConsultationSchema.index({ status: 1, requestedDate: 1 });
ConsultationSchema.index({ confirmedDate: 1 });

export default mongoose.models.Consultation || mongoose.model('Consultation', ConsultationSchema);
