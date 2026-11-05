import { connectDB } from '@/lib/mongodb';
import Message from '@/models/Message';
import * as wa from '@/lib/whatsapp';

async function deliver(lead, { messageType, messageText, mediaUrl = '', mediaType = '', agent = '', send }) {
  await connectDB();
  let whatsappMessageId = null;
  try {
    whatsappMessageId = await send(lead.phoneNumber);
  } catch (err) {
    await Message.create({
      leadId: lead._id,
      direction: 'outgoing',
      messageType,
      messageText,
      mediaUrl,
      mediaType,
      deliveryStatus: 'failed',
      sentByAgent: agent,
      timestamp: new Date(),
    });
    throw err;
  }

  await Message.create({
    leadId: lead._id,
    whatsappMessageId,
    direction: 'outgoing',
    messageType,
    messageText,
    mediaUrl,
    mediaType,
    deliveryStatus: 'sent',
    sentByAgent: agent,
    timestamp: new Date(),
  });
  return whatsappMessageId;
}

export function sendText(lead, text, agent = '') {
  return deliver(lead, {
    messageType: 'text',
    messageText: text,
    agent,
    send: (to) => wa.sendText(to, text),
  });
}

export function sendButtons(lead, bodyText, buttons) {
  return deliver(lead, {
    messageType: 'interactive',
    messageText: bodyText,
    send: (to) => wa.sendReplyButtons(to, bodyText, buttons),
  });
}

export function sendList(lead, bodyText, buttonText, rows, sectionTitle) {
  return deliver(lead, {
    messageType: 'interactive',
    messageText: bodyText,
    send: (to) => wa.sendListMessage(to, bodyText, buttonText, rows, sectionTitle),
  });
}

export function sendDetailsForm(lead, flowId, bodyText, ctaText) {
  return deliver(lead, {
    messageType: 'interactive',
    messageText: bodyText,
    send: (to) => wa.sendFlowMessage(to, { bodyText, flowId, flowToken: String(lead._id), ctaText, screen: 'DETAILS' }),
  });
}

export function sendDemoVideo(lead, filePath, caption) {
  return deliver(lead, {
    messageType: 'video',
    messageText: caption,
    mediaType: 'video',
    send: async (to) => wa.sendVideo(to, await wa.uploadMedia(filePath, 'video/mp4'), caption),
  });
}
