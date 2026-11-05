import mongoose from 'mongoose';

const NoteSchema = new mongoose.Schema(
  {
    leadId: { type: mongoose.Schema.Types.ObjectId, ref: 'Lead', required: true, index: true },
    note: { type: String, required: true, trim: true },
    nextFollowUpDate: { type: Date, default: null },
    nextFollowUpTime: { type: String, default: '' },
    createdBy: { type: String, default: '' },
  },
  { timestamps: true }
);

export default mongoose.models.Note || mongoose.model('Note', NoteSchema);
