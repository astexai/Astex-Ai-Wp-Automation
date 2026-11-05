import crypto from 'crypto';
import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { verifyWebhookSignature } from '@/lib/whatsapp';
import { processIncomingMessage } from '@/services/automationService';
import { findOrCreateLead, recordIncomingMessage, syncCurrentInquiry } from '@/services/leadService';
import Message from '@/models/Message';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const STATUS_MAP = { sent: 'sent', delivered: 'delivered', read: 'read', failed: 'failed' };

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  const expected = process.env.WHATSAPP_VERIFY_TOKEN || '';
  const tokenOk =
    token && expected && token.length === expected.length &&
    crypto.timingSafeEqual(Buffer.from(token), Buffer.from(expected));

  if (mode === 'subscribe' && tokenOk && challenge) {
    return new NextResponse(challenge, { status: 200, headers: { 'Content-Type': 'text/plain' } });
  }
  return new NextResponse('Forbidden', { status: 403 });
}

function parseFlowResponse(raw) {
  try {
    const parsed = JSON.parse(raw || '{}');
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch {
    return null;
  }
}

function extractContent(msg) {
  switch (msg.type) {
    case 'text':
      return { messageType: 'text', messageText: msg.text?.body || '', replyId: '', text: msg.text?.body || '' };
    case 'interactive': {
      if (msg.interactive?.type === 'nfm_reply') {
        return {
          messageType: 'interactive',
          messageText: 'Submitted details form',
          replyId: '',
          text: '',
          flowResponse: parseFlowResponse(msg.interactive.nfm_reply?.response_json),
        };
      }
      const reply = msg.interactive?.button_reply || msg.interactive?.list_reply;
      return {
        messageType: 'interactive',
        messageText: reply?.title || '',
        replyId: reply?.id || '',
        text: reply?.title || '',
        interactiveResponse: reply || null,
      };
    }
    case 'button':
      return { messageType: 'interactive', messageText: msg.button?.text || '', replyId: msg.button?.payload || '', text: msg.button?.text || '' };
    case 'image':
    case 'video':
    case 'document':
    case 'audio': {
      const caption = msg[msg.type]?.caption || '';
      return { messageType: msg.type, messageText: caption, mediaType: msg.type, replyId: '', text: caption };
    }
    default:
      return { messageType: msg.type || 'unknown', messageText: '', replyId: '', text: '' };
  }
}

async function handleStatuses(statuses) {
  for (const status of statuses) {
    const mapped = STATUS_MAP[status.status];
    if (!mapped || !status.id) continue;
    await Message.updateOne(
      { whatsappMessageId: status.id },
      { $set: { deliveryStatus: mapped } }
    );
  }
}

async function handleInboundMessage(msg) {
  const { lead, conversation, isNew } = await findOrCreateLead(msg.from, msg.referral);

  const content = extractContent(msg);
  const isNewMessage = await recordIncomingMessage(lead._id, {
    whatsappMessageId: msg.id,
    messageType: content.messageType,
    messageText: content.messageText,
    mediaType: content.mediaType || '',
    interactiveResponse: content.interactiveResponse || null,
    timestamp: msg.timestamp ? new Date(Number(msg.timestamp) * 1000) : new Date(),
  });
  if (!isNewMessage) return;

  conversation.lastMessageAt = new Date();
  conversation.lastProcessedMessageId = msg.id;
  try {
    await processIncomingMessage({
      lead,
      conversation,
      message: { id: msg.id, type: msg.type, text: content.text, replyId: content.replyId, flowResponse: content.flowResponse || null },
      isNew,
    });
  } catch (err) {
    console.error('Automation failed for message', msg.id, err);
  } finally {
    await lead.save();
    await conversation.save();
    await syncCurrentInquiry(lead);
  }
}

export async function POST(request) {
  const rawBody = await request.text();
  const signature = request.headers.get('x-hub-signature-256');

  if (!verifyWebhookSignature(rawBody, signature)) {
    return new NextResponse('Invalid signature', { status: 401 });
  }

  await connectDB();

  let payload;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return new NextResponse('Invalid payload', { status: 400 });
  }

  if (payload?.object !== 'whatsapp_business_account') {
    return NextResponse.json({ received: true });
  }

  for (const entry of payload.entry || []) {
    for (const change of entry.changes || []) {
      const value = change.value || {};
      try {
        if (value.statuses?.length) await handleStatuses(value.statuses);
        for (const msg of value.messages || []) {
          await handleInboundMessage(msg);
        }
      } catch (err) {
        console.error('Webhook processing error', err);
      }
    }
  }

  return NextResponse.json({ received: true });
}
