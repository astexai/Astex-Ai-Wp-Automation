import { istToInstant } from '@/lib/format';

const DATE_RX = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RX = /^([01]\d|2[0-3]):[0-5]\d$/;

export function parseNoteInput(body) {
  const note = typeof body.note === 'string' ? body.note.trim() : '';
  if (!note) return { error: 'Note cannot be empty' };
  if (note.length > 2000) return { error: 'Note is too long (max 2000 characters)' };

  const hasDate = DATE_RX.test(body.nextFollowUpDate || '');
  const hasTime = TIME_RX.test(body.nextFollowUpTime || '');
  if (body.nextFollowUpDate && !hasDate) return { error: 'Invalid follow-up date' };
  if (body.nextFollowUpTime && !hasTime) return { error: 'Invalid follow-up time' };

  return {
    note,
    nextFollowUpDate: hasDate ? istToInstant(body.nextFollowUpDate, hasTime ? body.nextFollowUpTime : '00:00') : null,
    nextFollowUpTime: hasTime ? body.nextFollowUpTime : '',
  };
}
