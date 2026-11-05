// Asia/Kolkata has no daylight saving, so a fixed offset keeps conversions predictable.
const IST_OFFSET_MINUTES = 330;
const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

function shiftToIst(date) {
  return new Date(new Date(date).getTime() + IST_OFFSET_MINUTES * 60000);
}

export function istToInstant(ymd, hm) {
  const [y, m, d] = ymd.split('-').map(Number);
  const [h, min] = hm.split(':').map(Number);
  return new Date(Date.UTC(y, m - 1, d, h, min) - IST_OFFSET_MINUTES * 60000);
}

export function instantToIstDateInput(date) {
  const s = shiftToIst(date);
  return `${s.getUTCFullYear()}-${String(s.getUTCMonth() + 1).padStart(2, '0')}-${String(s.getUTCDate()).padStart(2, '0')}`;
}

export function instantToIstTimeInput(date) {
  const s = shiftToIst(date);
  return `${String(s.getUTCHours()).padStart(2, '0')}:${String(s.getUTCMinutes()).padStart(2, '0')}`;
}

export function formatConsultationDate(date) {
  if (!date) return '-';
  const s = shiftToIst(date);
  return `${s.getUTCDate()} ${MONTH_NAMES[s.getUTCMonth()].slice(0, 3)} ${s.getUTCFullYear()}`;
}

export function formatConsultationTime(hm) {
  if (!hm) return '-';
  const [h, min] = hm.split(':').map(Number);
  const suffix = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${String(min).padStart(2, '0')} ${suffix}`;
}

export function formatDateTime(date) {
  if (!date) return '-';
  return new Date(date).toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}
