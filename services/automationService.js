import Consultation from '@/models/Consultation';
import { isValidPhone, normalizePhone } from '@/lib/phone';
import * as out from './outboundService';
import * as C from './flowContent';
import { parseRequestedDateText } from './consultationService';
import { formatConsultationDate, formatConsultationTime } from '@/lib/format';
import { findDemoVideo } from '@/lib/demoVideo';
import { startNewInquiry } from './leadService';

const CALL_US_BUTTON = { id: 'call_us', title: 'Call Us' };
const RESTART_BUTTON = { id: 'restart', title: 'Restart' };
const DEMO_BUTTONS = [
  { id: 'demo_yes', title: 'Yes, Show Demo' },
  { id: 'demo_no', title: 'No, Skip Demo' },
];

const LIST_CONFIGS = {
  SERVICE_REQUIRED: {
    body: C.SERVICE_BODY,
    options: C.SERVICE_OPTIONS,
    prefix: 'sr',
    field: 'requiredServices',
    section: 'Services',
    next: 'LEAD_SOURCE',
  },
  LEAD_SOURCE: {
    body: C.SOURCE_BODY,
    options: C.SOURCE_OPTIONS,
    prefix: 'ls',
    field: 'leadSources',
    section: 'Sources',
    next: 'DAILY_LEADS',
  },
  CURRENT_CHALLENGES: {
    body: C.CHALLENGE_BODY,
    options: C.CHALLENGE_OPTIONS,
    prefix: 'cc',
    field: 'currentChallenges',
    section: 'Challenges',
    next: 'PRICING_QUALIFICATION',
  },
};

function isRestartMessage(message) {
  return message.replyId === 'restart' || /^\s*restart\s*$/i.test(message.text || '');
}

function pickIndex(message, prefix, count) {
  const byId = message.replyId?.match(new RegExp(`^${prefix}_(\\d+)$`));
  if (byId) return Number(byId[1]);
  const byNumber = /^\s*(\d+)\s*$/.exec(message.text || '');
  if (byNumber) {
    const n = Number(byNumber[1]);
    if (n >= 1 && n <= count) return n - 1;
  }
  return -1;
}

function setAnswers(conversation, patch) {
  conversation.answers = { ...(conversation.answers || {}), ...patch };
}

function goTo(lead, conversation, step) {
  conversation.previousStep = conversation.currentStep;
  conversation.currentStep = step;
  lead.currentConversationStep = step;
}

async function sendListStep(lead, step) {
  const config = LIST_CONFIGS[step];
  return out.sendList(lead, config.body, 'Choose', C.listRows(config.options, config.prefix), config.section);
}

async function enterStep(lead, conversation, step) {
  goTo(lead, conversation, step);
  if (LIST_CONFIGS[step]) return sendListStep(lead, step);
  if (step === 'BUSINESS_TYPE') {
    return out.sendList(lead, C.BUSINESS_TYPE_BODY, 'Select Business Type', C.BUSINESS_TYPE_ROWS, 'Business Type');
  }
  if (step === 'DAILY_LEADS') {
    return out.sendList(lead, C.DAILY_BODY, 'Select Range', C.DAILY_ROWS, 'Daily Enquiries');
  }
  if (step === 'PRICING_QUALIFICATION') {
    return out.sendButtons(lead, C.PRICING_BODY, [
      { id: 'price_yes', title: "Yes, I'm Comfortable" },
      { id: 'price_no', title: 'No, Not Right Now' },
    ]);
  }
  if (step === 'DEMO_OFFER') {
    return out.sendButtons(lead, C.DEMO_OFFER_BODY, DEMO_BUTTONS);
  }
  if (step === 'IMPLEMENTATION_TIMELINE') {
    return out.sendList(lead, C.TIMELINE_BODY, 'Select Timeline', C.TIMELINE_ROWS, 'Timeline');
  }
  if (step === 'FOUNDER_CONSULTATION') {
    return out.sendButtons(lead, C.FOUNDER_OFFER_BODY, [
      { id: 'consult_yes', title: 'Yes, Schedule a Call' },
      { id: 'consult_no', title: 'No, Maybe Later' },
    ]);
  }
  if (step === 'CONSULTATION_DATE') {
    return out.sendText(lead, C.CONSULTATION_DATE_BODY);
  }
  throw new Error(`Unhandled step ${step}`);
}

async function startGreeting(lead, conversation) {
  goTo(lead, conversation, 'LANGUAGE_SELECTION');
  setAnswers(conversation, { detailsStage: '' });
  await out.sendButtons(lead, C.GREETING_BODY, C.LANGUAGE_BUTTONS);
}

async function restartFlow(lead, conversation) {
  await startNewInquiry(lead._id);
  Object.assign(lead, {
    businessType: '',
    requiredServices: [],
    leadSources: [],
    dailyLeadVolume: '',
    currentChallenges: [],
    pricingComfortable: null,
    demoRequested: false,
    demoSent: false,
    demoWatched: false,
    implementationPlan: '',
    founderConsultationRequested: false,
    qualificationStatus: 'In Progress',
    conversationCompleted: false,
  });
  conversation.isActive = true;
  conversation.answers = {};
  await startGreeting(lead, conversation);
}

async function askForDetails(lead, conversation) {
  try {
    await out.sendDetailsForm(lead, C.DETAILS_FLOW_ID, C.DETAILS_INTRO_BODY, C.DETAILS_CTA);
    setAnswers(conversation, { detailsStage: 'form' });
  } catch (err) {
    console.error('Details form could not be sent, asking questions instead', err);
    setAnswers(conversation, { detailsStage: 'fullName' });
    await out.sendText(lead, C.DETAIL_PROMPTS.fullName);
  }
}

async function handleLanguage(ctx) {
  const { lead, conversation, message } = ctx;
  if (message.replyId === 'lang_en' || message.replyId === 'lang_hi') {
    const language = message.replyId === 'lang_hi' ? 'hi' : 'en';
    lead.language = language;
    conversation.language = language;
    if (language === 'hi') {
      await out.sendText(lead, 'Our Hindi flow is coming soon. We will continue in English for now.');
    }
    goTo(lead, conversation, 'BASIC_DETAILS');
    return askForDetails(lead, conversation);
  }
  return out.sendButtons(lead, 'Please select your preferred language using the buttons below. 😊', C.LANGUAGE_BUTTONS);
}

async function handleDetailsSubmission({ lead, conversation, message }) {
  const details = message.flowResponse;
  const fullName = String(details.full_name || '').trim();
  const contactNumber = normalizePhone(String(details.contact_number || ''));
  const city = String(details.city || '').trim();
  const businessName = String(details.business_name || '').trim();

  if (fullName.length < 2 || !isValidPhone(contactNumber) || city.length < 2 || businessName.length < 2) {
    await out.sendText(lead, C.DETAILS_INVALID);
    return askForDetails(lead, conversation);
  }

  Object.assign(lead, { fullName, contactNumber, city, businessName });
  setAnswers(conversation, { detailsStage: 'done' });
  return enterStep(lead, conversation, 'BUSINESS_TYPE');
}

async function handleBasicDetails(ctx) {
  const { lead, conversation, message } = ctx;
  if (message.flowResponse) return handleDetailsSubmission(ctx);

  const stage = conversation.answers?.detailsStage || 'form';
  const text = (message.text || '').trim();

  if (stage === 'form' || stage === 'await_start') {
    return askForDetails(lead, conversation);
  }

  if (stage === 'fullName') {
    if (text.length < 2) return out.sendText(lead, C.DETAIL_PROMPTS.fullName);
    lead.fullName = text;
    setAnswers(conversation, { detailsStage: 'contactNumber' });
    return out.sendText(lead, C.DETAIL_PROMPTS.contactNumber);
  }

  if (stage === 'contactNumber') {
    const normalized = normalizePhone(text);
    if (!isValidPhone(normalized)) return out.sendText(lead, C.DETAIL_PROMPTS.contactNumber);
    lead.contactNumber = normalized;
    setAnswers(conversation, { detailsStage: 'city' });
    return out.sendText(lead, C.DETAIL_PROMPTS.city);
  }

  if (stage === 'city') {
    if (text.length < 2) return out.sendText(lead, C.DETAIL_PROMPTS.city);
    lead.city = text;
    setAnswers(conversation, { detailsStage: 'businessName' });
    return out.sendText(lead, C.DETAIL_PROMPTS.businessName);
  }

  if (stage === 'businessName') {
    if (text.length < 2) return out.sendText(lead, C.DETAIL_PROMPTS.businessName);
    lead.businessName = text;
    setAnswers(conversation, { detailsStage: 'done' });
    return enterStep(lead, conversation, 'BUSINESS_TYPE');
  }
}

async function handleBusinessType(ctx) {
  const { lead, conversation, message } = ctx;
  const index = pickIndex(message, 'bt', C.BUSINESS_TYPE_ROWS.length);
  if (index < 0) return enterStep(lead, conversation, 'BUSINESS_TYPE');
  lead.businessType = C.BUSINESS_TYPE_ROWS[index].title;
  return enterStep(lead, conversation, 'SERVICE_REQUIRED');
}

async function handleListChoice(ctx, step) {
  const { lead, conversation, message } = ctx;
  const config = LIST_CONFIGS[step];
  const index = pickIndex(message, config.prefix, config.options.length);
  if (index < 0) return sendListStep(lead, step);
  lead[config.field] = [config.options[index]];
  return enterStep(lead, conversation, config.next);
}

async function handleDailyLeads(ctx) {
  const { lead, conversation, message } = ctx;
  const index = pickIndex(message, 'dl', C.DAILY_ROWS.length);
  if (index < 0) return enterStep(lead, conversation, 'DAILY_LEADS');
  lead.dailyLeadVolume = C.DAILY_ROWS[index].title;
  return enterStep(lead, conversation, 'CURRENT_CHALLENGES');
}

async function handlePricing(ctx) {
  const { lead, conversation, message } = ctx;
  const replyText = String(message.text || '').toLowerCase().replace(/[^a-z]/g, '');
  if (message.replyId === 'price_yes' || replyText === 'yesimcomfortable') {
    lead.pricingComfortable = true;
    if (lead.leadStatus === 'New Lead') lead.leadStatus = 'Qualified';
    return enterStep(lead, conversation, 'DEMO_OFFER');
  }
  if (message.replyId === 'price_no') {
    lead.pricingComfortable = false;
    lead.qualificationStatus = 'Not Qualified';
    goTo(lead, conversation, 'CLOSED');
    conversation.isActive = false;
    return out.sendButtons(lead, C.PRICING_NO_BODY, [CALL_US_BUTTON]);
  }
  return enterStep(lead, conversation, 'PRICING_QUALIFICATION');
}

async function handleDemoOffer(ctx) {
  const { lead, conversation, message } = ctx;

  if (message.replyId === 'demo_yes') {
    lead.demoRequested = true;
    await out.sendText(lead, C.DEMO_WATCH_INTRO);
    const demoPath = findDemoVideo();
    let demoSent = false;
    if (demoPath) {
      try {
        await out.sendDemoVideo(lead, demoPath, 'Astex AI WhatsApp Automation demo');
        demoSent = true;
      } catch (err) {
        console.error('Demo video could not be sent', err);
      }
    }
    if (demoSent) {
      lead.demoSent = true;
      await out.sendList(
        lead,
        `${C.DEMO_WATCHED_TIMELINE_INTRO}\n\n${C.TIMELINE_BODY}`,
        'Select Timeline',
        C.TIMELINE_ROWS,
        'Timeline'
      );
    } else {
      await out.sendText(lead, C.DEMO_UNAVAILABLE);
      await out.sendList(lead, C.TIMELINE_BODY, 'Select Timeline', C.TIMELINE_ROWS, 'Timeline');
    }
    return goTo(lead, conversation, 'IMPLEMENTATION_TIMELINE');
  }

  if (message.replyId === 'demo_no') {
    lead.demoRequested = false;
    goTo(lead, conversation, 'IMPLEMENTATION_TIMELINE');
    return out.sendList(
      lead,
      `${C.DEMO_SKIP_INTRO}\n\n${C.TIMELINE_BODY}`,
      'Select Timeline',
      C.TIMELINE_ROWS,
      'Timeline'
    );
  }

  return enterStep(lead, conversation, 'DEMO_OFFER');
}

async function handleTimeline(ctx) {
  const { lead, conversation, message } = ctx;
  const index = pickIndex(message, 'tl', C.TIMELINE_ROWS.length);
  if (index < 0) return enterStep(lead, conversation, 'IMPLEMENTATION_TIMELINE');
  lead.implementationPlan = C.TIMELINE_ROWS[index].title;
  return enterStep(lead, conversation, 'FOUNDER_CONSULTATION');
}

async function handleFounderOffer(ctx) {
  const { lead, conversation, message } = ctx;
  if (message.replyId === 'consult_yes') {
    lead.founderConsultationRequested = true;
    return enterStep(lead, conversation, 'CONSULTATION_DATE');
  }
  if (message.replyId === 'consult_no') {
    lead.founderConsultationRequested = false;
    lead.qualificationStatus = 'Completed';
    lead.conversationCompleted = true;
    goTo(lead, conversation, 'CLOSED');
    conversation.isActive = false;
    return out.sendButtons(lead, C.FOUNDER_DECLINE_BODY, [CALL_US_BUTTON, RESTART_BUTTON]);
  }
  return enterStep(lead, conversation, 'FOUNDER_CONSULTATION');
}

async function handleConsultationDate(ctx) {
  const { lead, conversation, message } = ctx;
  const parsed = parseRequestedDateText(message.text);
  if (!parsed) return out.sendText(lead, C.CONSULTATION_DATE_INVALID);
  if (parsed.instant.getTime() <= Date.now()) return out.sendText(lead, C.CONSULTATION_DATE_PAST);

  await Consultation.create({
    leadId: lead._id,
    requestedDate: parsed.instant,
    requestedTime: parsed.hm,
    status: 'Pending',
  });

  lead.leadStatus = 'Consultation';
  lead.qualificationStatus = 'Completed';
  lead.conversationCompleted = true;
  goTo(lead, conversation, 'COMPLETED');
  return out.sendText(lead, C.consultationReceived(formatConsultationDate(parsed.instant), formatConsultationTime(parsed.hm)));
}

async function handleCallUs(lead) {
  return out.sendText(lead, C.CALL_US_REPLY);
}

const STEP_HANDLERS = {
  LANGUAGE_SELECTION: handleLanguage,
  BASIC_DETAILS: handleBasicDetails,
  BUSINESS_TYPE: handleBusinessType,
  SERVICE_REQUIRED: (ctx) => handleListChoice(ctx, 'SERVICE_REQUIRED'),
  LEAD_SOURCE: (ctx) => handleListChoice(ctx, 'LEAD_SOURCE'),
  DAILY_LEADS: handleDailyLeads,
  CURRENT_CHALLENGES: (ctx) => handleListChoice(ctx, 'CURRENT_CHALLENGES'),
  PRICING_QUALIFICATION: handlePricing,
  DEMO_OFFER: handleDemoOffer,
  IMPLEMENTATION_TIMELINE: handleTimeline,
  FOUNDER_CONSULTATION: handleFounderOffer,
  CONSULTATION_DATE: handleConsultationDate,
};

export async function processIncomingMessage({ lead, conversation, message, isNewLead }) {
  if (isRestartMessage(message)) {
    return restartFlow(lead, conversation);
  }

  if (isNewLead) {
    return startGreeting(lead, conversation);
  }

  if (conversation.isPaused) return;

  if (message.replyId === CALL_US_BUTTON.id) {
    return handleCallUs(lead);
  }

  if (conversation.currentStep === 'CLOSED') {
    return out.sendButtons(lead, C.CLOSED_MESSAGE, [RESTART_BUTTON]);
  }

  if (conversation.currentStep === 'COMPLETED') {
    return out.sendText(lead, 'Our team is reviewing your consultation request and will confirm it shortly. Thank you for your patience!');
  }

  const handler = STEP_HANDLERS[conversation.currentStep];
  if (!handler) return startGreeting(lead, conversation);
  return handler({ lead, conversation, message });
}
