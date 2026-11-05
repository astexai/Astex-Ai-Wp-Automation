import { BUSINESS_TYPES } from '@/lib/leadOptions';

export const GREETING_BODY =
  '👋 Hello! Welcome to Astex AI.\n\nWe help Real Estate businesses generate more leads, automate customer interactions, manage enquiries and increase property site visits using AI & Automation.\n\nTo get started, please select your preferred language. 😊';

export const LANGUAGE_BUTTONS = [
  { id: 'lang_en', title: '🇬🇧 English' },
  { id: 'lang_hi', title: '🇮🇳 हिंदी' },
];

export const DETAILS_INTRO_BODY =
  "Great! Let's get to know you and your business first.\n\nPlease fill in the details below to get started. 👇";

export const DETAILS_FLOW_ID = '3853508994791998';

export const DETAILS_CTA = 'Fill Form';

export const DETAILS_INVALID = 'Some of the details look incomplete. Please fill in the form again.';

export const DETAIL_PROMPTS = {
  fullName: 'Please type your full name.',
  contactNumber: 'Please type your contact number with country code (for example: +91 98765 43210).',
  city: 'Please type the city where your business operates.',
  businessName: 'Please type your business name.',
};

export const BUSINESS_TYPE_BODY = 'What type of Real Estate business do you operate?';

export const SERVICE_OPTIONS = [
  'Generate More Leads',
  'WhatsApp Automation',
  'Lead Management CRM',
  'Automated Follow-ups',
  'Increase Site Visits & Sales',
  'Complete Business Automation',
];

export const SOURCE_OPTIONS = [
  'Facebook & Instagram Ads',
  'Instagram Organic',
  'Google Ads',
  'Property Portals (99acres, Magicbricks, etc.)',
  'Website / Google Business',
  'References / Channel Partners',
  'Other Sources',
];

export const DAILY_LEAD_OPTIONS = ['0–5 Leads', '5–15 Leads', '15–30 Leads', '30–50 Leads', '50+ Leads'];

export const CHALLENGE_OPTIONS = [
  'Not Getting Enough Quality Leads',
  'High Cost Per Lead',
  'Delayed Response to Enquiries',
  'Leads Not Converting into Site Visits',
  'Too Many Unqualified Leads',
  'Difficulty Managing & Following Up',
  'Missing Potential Leads',
  'Difficulty Closing Deals',
];

export const SERVICE_BODY = 'What are you mainly looking to improve in your business?';
export const SOURCE_BODY = 'Where do you currently get most of your property enquiries from?';
export const DAILY_BODY = 'Approximately how many new leads or enquiries do you receive per day?';
export const CHALLENGE_BODY = "What is the biggest challenge you're currently facing in your Real Estate business?";

export const PRICING_BODY =
  'Thank you for sharing your business requirements! 🙌\n\nAt Astex AI, our solutions are customized according to your business needs.\n\nOur services start from ₹40,000, with final pricing depending on your requirements and project scope.\n\nWe also work with a limited number of qualified businesses to ensure dedicated attention and quality delivery.\n\nWould you be comfortable investing in a solution starting from ₹40,000?';

export const PRICING_NO_BODY =
  "No worries! We completely understand. 😊\n\nThank you for considering Astex AI. We'd be happy to connect with you whenever you're ready to explore our solutions.\n\nHave a great day!";

export const DEMO_OFFER_BODY =
  'Great! 😊\n\nWould you like to watch a short demo video of our WhatsApp Automation system?\n\nSee how it can automatically handle enquiries, qualify leads, manage follow-ups and help schedule property site visits.';

export const DEMO_WATCH_INTRO =
  "Here's a quick look at our WhatsApp Automation system! 🚀\n\nWatch how we help Real Estate businesses automate their customer interactions and manage enquiries more efficiently.";

export const DEMO_UNAVAILABLE =
  "Our demo video is being prepared and will be shared with you shortly. Let's continue.";

export const DEMO_SKIP_INTRO = "No problem! Let's move ahead. 😊\n\nWe'd like to understand your plans so we can guide you better.";

export const TIMELINE_BODY =
  'How soon are you looking to implement a solution like this in your business?';

export const DEMO_WATCHED_TIMELINE_INTRO =
  "Now that you've seen how our system works, we'd love to understand your plans.";

export const FOUNDER_OFFER_BODY =
  "Thank you for sharing! 😊\n\nWe'd love to understand your business in more detail and discuss how Astex AI can help you achieve your goals.\n\nWould you like to schedule a FREE consultation with our Founder?";

export const FOUNDER_DECLINE_BODY =
  "Absolutely! No problem. 😊\n\nThank you for your interest in Astex AI.\n\nIf you need any assistance in the future, feel free to reach out. We'd be happy to help!\n\nHave a great day! 🚀";

export const CONSULTATION_DATE_BODY =
  "Perfect! 🎉\n\nLet's schedule your free consultation.\n\nPlease select your preferred date for the meeting.\n\nExample: 5 Nov 2026, 11:00 AM (Simply type and send).";

export const CONSULTATION_DATE_INVALID =
  "We couldn't read that date and time. Please send it in this format: 5 Nov 2026, 11:00 AM";

export const CONSULTATION_DATE_PAST =
  'That date and time has already passed. Please send another preferred date and time, for example: 5 Nov 2026, 11:00 AM';

export const CONSULTATION_RECEIVED =
  "Thank you! We've received your preferred date and time. Our team will review availability and confirm your consultation shortly.";

export const RESTART_MESSAGE = "No problem! Let's start again. 😊";

export const CLOSED_MESSAGE =
  'This conversation has ended. Tap Restart below or type "restart" if you would like to begin again.';

export const UNKNOWN_IN_STEP_HINT = 'Sorry, that response is not valid here. Please select one of the options shown above.';

export const BUSINESS_TYPE_ROWS = BUSINESS_TYPES.map((label, index) => ({ id: `bt_${index}`, title: label }));

export const DAILY_ROWS = DAILY_LEAD_OPTIONS.map((label, index) => ({ id: `dl_${index}`, title: label }));

export const TIMELINE_ROWS = ['Immediately', 'Within 15 Days', 'Within 30 Days', 'Just Exploring'].map((label, index) => ({
  id: `tl_${index}`,
  title: label,
}));

const BUSINESS_CONTACT_NUMBER = '+91 9098343508';

export const CALL_US_REPLY = `You can reach the Astex AI team on ${BUSINESS_CONTACT_NUMBER}.`;

const SHORT_LABELS = {
  'Increase Site Visits & Sales': 'Increase Site Visits',
  'Complete Business Automation': 'Full Business Automation',
  'Property Portals (99acres, Magicbricks, etc.)': 'Property Portals',
  'Website / Google Business': 'Website / Google Biz',
  'References / Channel Partners': 'References / Partners',
  'Not Getting Enough Quality Leads': 'Not Enough Quality Leads',
  'Delayed Response to Enquiries': 'Delayed Enquiry Response',
  'Leads Not Converting into Site Visits': 'Leads Not Converting',
  'Too Many Unqualified Leads': 'Too Many Unqualified',
  'Difficulty Managing & Following Up': 'Difficulty Following Up',
};

export function listRows(options, prefix) {
  return options.map((label, index) => {
    const title = SHORT_LABELS[label] || label;
    return title === label
      ? { id: `${prefix}_${index}`, title }
      : { id: `${prefix}_${index}`, title, description: label };
  });
}
