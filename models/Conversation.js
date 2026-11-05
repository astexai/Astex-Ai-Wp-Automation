import mongoose from 'mongoose';

const ConversationSchema = new mongoose.Schema(
  {
    leadId: { type: mongoose.Schema.Types.ObjectId, ref: 'Lead', required: true, unique: true },
    currentStep: { type: String, default: 'LANGUAGE_SELECTION' },
    previousStep: { type: String, default: '' },
    language: { type: String, default: '' },
    answers: { type: mongoose.Schema.Types.Mixed, default: {} },
    isActive: { type: Boolean, default: true },
    isPaused: { type: Boolean, default: false },
    lastMessageAt: { type: Date, default: Date.now },
    lastProcessedMessageId: { type: String, default: '' },
  },
  { timestamps: true }
);

export default mongoose.models.Conversation || mongoose.model('Conversation', ConversationSchema);
