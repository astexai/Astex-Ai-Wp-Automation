import mongoose from 'mongoose';

const MessageSchema = new mongoose.Schema(
  {
    leadId: { type: mongoose.Schema.Types.ObjectId, ref: 'Lead', required: true, index: true },
    whatsappMessageId: { type: String, unique: true, sparse: true },
    direction: { type: String, enum: ['incoming', 'outgoing'], required: true },
    messageType: { type: String, default: 'text' },
    messageText: { type: String, default: '' },
    mediaUrl: { type: String, default: '' },
    mediaType: { type: String, default: '' },
    interactiveResponse: { type: mongoose.Schema.Types.Mixed, default: null },
    deliveryStatus: {
      type: String,
      enum: ['pending', 'sent', 'delivered', 'read', 'failed', 'received'],
      default: 'pending',
    },
    sentByAgent: { type: String, default: '' },
    timestamp: { type: Date, default: Date.now, index: true },
  },
  { timestamps: true }
);

MessageSchema.index({ leadId: 1, timestamp: 1 });

export default mongoose.models.Message || mongoose.model('Message', MessageSchema);
