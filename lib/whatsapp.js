import crypto from 'crypto';
import fs from 'fs/promises';
import path from 'path';

const GRAPH_BASE = () => `https://graph.facebook.com/${process.env.WHATSAPP_API_VERSION || 'v20.0'}`;

export function verifyWebhookSignature(rawBody, signatureHeader) {
  const secret = process.env.WHATSAPP_APP_SECRET;
  if (!secret || !signatureHeader) return false;
  const expected = 'sha256=' + crypto.createHmac('sha256', secret).update(rawBody, 'utf8').digest('hex');
  const a = Buffer.from(expected);
  const b = Buffer.from(signatureHeader);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

function graphCredentials() {
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  if (!phoneNumberId || !token) throw new Error('WhatsApp credentials are not configured');
  return { phoneNumberId, token };
}

async function postToGraph(url, token, body, headers = {}) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, ...headers },
    body,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message = data?.error?.message || `WhatsApp API error (${res.status})`;
    throw new Error(message);
  }
  return data;
}

async function sendPayload(to, body) {
  const { phoneNumberId, token } = graphCredentials();
  const data = await postToGraph(
    `${GRAPH_BASE()}/${phoneNumberId}/messages`,
    token,
    JSON.stringify({ messaging_product: 'whatsapp', recipient_type: 'individual', to, ...body }),
    { 'Content-Type': 'application/json' }
  );
  return data?.messages?.[0]?.id || null;
}

export async function uploadMedia(filePath, mimeType) {
  const { phoneNumberId, token } = graphCredentials();
  const form = new FormData();
  form.append('messaging_product', 'whatsapp');
  form.append('type', mimeType);
  const bytes = await fs.readFile(filePath);
  form.append('file', new Blob([bytes], { type: mimeType }), path.basename(filePath));

  const data = await postToGraph(`${GRAPH_BASE()}/${phoneNumberId}/media`, token, form);
  if (!data?.id) throw new Error('WhatsApp did not return a media id');
  return data.id;
}

export function sendText(to, text) {
  return sendPayload(to, { type: 'text', text: { body: text, preview_url: false } });
}

export function sendReplyButtons(to, bodyText, buttons) {
  return sendPayload(to, {
    type: 'interactive',
    interactive: {
      type: 'button',
      body: { text: bodyText },
      action: {
        buttons: buttons.map((b) => ({ type: 'reply', reply: { id: b.id, title: b.title } })),
      },
    },
  });
}

export function sendListMessage(to, bodyText, buttonText, rows, sectionTitle = 'Options') {
  return sendPayload(to, {
    type: 'interactive',
    interactive: {
      type: 'list',
      body: { text: bodyText },
      action: {
        button: buttonText,
        sections: [
          {
            title: sectionTitle,
            rows: rows.map((r) => ({ id: r.id, title: r.title, ...(r.description ? { description: r.description } : {}) })),
          },
        ],
      },
    },
  });
}

export function sendFlowMessage(to, { bodyText, flowId, flowToken, ctaText, screen }) {
  return sendPayload(to, {
    type: 'interactive',
    interactive: {
      type: 'flow',
      body: { text: bodyText },
      action: {
        name: 'flow',
        parameters: {
          flow_message_version: '3',
          flow_token: flowToken,
          flow_id: flowId,
          flow_cta: ctaText,
          flow_action: 'navigate',
          flow_action_payload: { screen },
        },
      },
    },
  });
}

export function sendVideo(to, mediaId, caption) {
  return sendPayload(to, { type: 'video', video: { id: mediaId, caption } });
}

export function sendImage(to, link, caption) {
  return sendPayload(to, { type: 'image', image: { link, caption } });
}

export function sendDocument(to, link, caption, filename) {
  return sendPayload(to, { type: 'document', document: { link, caption, filename } });
}
