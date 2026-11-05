const STYLES = {
  'New Lead': 'bg-sky-50 text-sky-700 ring-sky-600/20',
  Qualified: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  Consultation: 'bg-orange-50 text-[#E64500] ring-[#FF4D00]/25',
  Proposal: 'bg-violet-50 text-violet-700 ring-violet-600/20',
  Negotiation: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  'In Follow-ups': 'bg-amber-50 text-amber-800 ring-amber-600/30',
  Converted: 'bg-green-100 text-green-800 ring-green-600/20',
  Lost: 'bg-red-50 text-red-700 ring-red-600/20',
  'Call Done': 'bg-neutral-100 text-neutral-700 ring-neutral-500/20',
  Pending: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  Scheduled: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  Completed: 'bg-neutral-100 text-neutral-700 ring-neutral-500/20',
  Rescheduled: 'bg-sky-50 text-sky-700 ring-sky-600/20',
  Cancelled: 'bg-red-50 text-red-700 ring-red-600/20',
};

export default function StatusBadge({ status }) {
  const style = STYLES[status] || 'bg-neutral-100 text-neutral-700 ring-neutral-500/20';
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${style}`}>
      {status || '-'}
    </span>
  );
}
