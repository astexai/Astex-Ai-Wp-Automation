import * as outbound from './outboundService';
import { istToInstant, formatConsultationDate, formatConsultationTime } from '@/lib/format';

const MEETING_LINK = 'https://meet.google.com/pwf-qxyt-uhv';

const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];

function toTwentyFourHour(hour, minute, meridiem) {
  let h = hour;
  if (meridiem) {
    const pm = meridiem.toLowerCase() === 'pm';
    if (h < 1 || h > 12) return null;
    if (pm && h !== 12) h += 12;
    if (!pm && h === 12) h = 0;
  }
  if (h > 23 || minute > 59) return null;
  return { h, min: minute };
}

function buildParsed(year, monthIndex, day, time) {
  if (!time || monthIndex < 0 || monthIndex > 11 || day < 1 || day > 31) return null;
  const probe = new Date(Date.UTC(year, monthIndex, day));
  if (probe.getUTCDate() !== day) return null;
  const ymd = `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  const hm = `${String(time.h).padStart(2, '0')}:${String(time.min).padStart(2, '0')}`;
  return { instant: istToInstant(ymd, hm), hm };
}

// Accepts "5 Nov 2026, 11:00 AM", "5 November 2026 11am", "2026-11-05 14:30".
export function parseRequestedDateText(text) {
  const cleaned = String(text || '').trim().replace(/\s+/g, ' ');

  let match = cleaned.match(/^(\d{1,2})[\s\-/]+([a-zA-Z]{3,9})[\s\-/,]+(\d{4})[\s,]*(\d{1,2})(?::(\d{2}))?\s*(am|pm)?$/i);
  if (match) {
    const time = toTwentyFourHour(Number(match[4]), Number(match[5] || 0), match[6]);
    return buildParsed(Number(match[3]), MONTHS.indexOf(match[2].slice(0, 3).toLowerCase()), Number(match[1]), time);
  }

  match = cleaned.match(/^(\d{4})-(\d{2})-(\d{2})[\s,T]+(\d{1,2})(?::(\d{2}))?\s*(am|pm)?$/i);
  if (match) {
    const time = toTwentyFourHour(Number(match[4]), Number(match[5] || 0), match[6]);
    return buildParsed(Number(match[1]), Number(match[2]) - 1, Number(match[3]), time);
  }

  return null;
}

function founderDetails() {
  return {
    name: process.env.FOUNDER_NAME || 'Aditya Patel',
    title: process.env.FOUNDER_TITLE || 'Founder & CEO - Astex AI',
  };
}

function scheduleLines(consultation) {
  return `📅 Date: ${formatConsultationDate(consultation.confirmedDate)}\n\n⏰ Time: ${formatConsultationTime(consultation.confirmedTime)}\n\n🔗 Meeting Link: ${MEETING_LINK}`;
}

function confirmationText(consultation) {
  const founder = founderDetails();
  return `🎉 Great News! Your Free Consultation Has Been Successfully Scheduled!\n\nYour meeting details are below:\n\n${scheduleLines(consultation)}\n\n👤 Meeting With:\n\n${founder.name}\n\n${founder.title}\n\nDuring this consultation, we'll discuss your business requirements, current challenges and how Astex AI can help you improve your lead generation, automate operations and grow your Real Estate business.\n\n📞 We look forward to speaking with you!\n\nThank you for choosing Astex AI. 🚀`;
}

function rescheduleText(consultation) {
  return `🔄 Your free consultation has been rescheduled. Here are your updated meeting details:\n\n${scheduleLines(consultation)}\n\nWe look forward to speaking with you!`;
}

function cancellationText() {
  return 'Your free consultation with Astex AI has been cancelled. If you would like to book a new time, reply "restart" to begin again or contact our team.';
}

// Returns an error message string if the lead could not be notified, otherwise null.
export async function notifyConsultationChange(lead, previous, next) {
  const dateChanged = previous.confirmedDate?.getTime() !== next.confirmedDate?.getTime();
  const timeChanged = previous.confirmedTime !== next.confirmedTime;
  const becameScheduled = next.status === 'Scheduled' && previous.status !== 'Scheduled';
  const isActiveSchedule = next.status === 'Scheduled' || next.status === 'Rescheduled';

  let text = null;
  if (next.status === 'Cancelled' && previous.status !== 'Cancelled') {
    text = cancellationText();
  } else if (becameScheduled) {
    text = confirmationText(next);
  } else if (isActiveSchedule && (dateChanged || timeChanged)) {
    text = rescheduleText(next);
  }

  if (!text) return null;

  try {
    await outbound.sendText(lead, text);
    return null;
  } catch (err) {
    return `The change was saved, but the WhatsApp message could not be delivered: ${err.message}`;
  }
}
