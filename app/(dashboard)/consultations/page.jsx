'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { CalendarCheck, Clock, CheckCircle2, Pencil, Loader2, AlertTriangle, CheckCircle } from 'lucide-react';
import { apiRequest } from '@/lib/clientApi';
import { formatConsultationDate, formatConsultationTime, instantToIstDateInput, instantToIstTimeInput } from '@/lib/format';
import StatusBadge from '@/components/common/StatusBadge';
import Modal from '@/components/common/Modal';

const STATUSES = ['Pending', 'Scheduled', 'Completed', 'Rescheduled', 'Cancelled'];
const PAGE_SIZE = 15;
const inputClass = 'w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-[#FF4D00] focus:ring-2 focus:ring-[#FF4D00]/20 disabled:bg-neutral-50 disabled:text-neutral-500';

function SummaryCard({ icon: Icon, label, value, loading }) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#FF4D00]/10 text-[#FF4D00]">
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">{label}</p>
        {loading ? <div className="mt-1 h-6 w-12 animate-pulse rounded bg-neutral-200" /> : <p className="text-2xl font-semibold text-neutral-900">{value ?? 0}</p>}
      </div>
    </div>
  );
}

function toFormState(c) {
  const confirmed = Boolean(c.confirmedDate);
  return {
    status: c.status,
    date: confirmed ? instantToIstDateInput(c.confirmedDate) : instantToIstDateInput(c.requestedDate),
    time: confirmed ? c.confirmedTime || '' : instantToIstTimeInput(c.requestedDate),
    meetingWith: c.meetingWith || '',
  };
}

function validate(form) {
  if (form.status === 'Scheduled' || form.status === 'Rescheduled') {
    if (!form.date || !form.time) return 'Date and time are required for this status.';
  }
  if (form.date && !form.time) return 'Please add a time for the consultation.';
  if (form.time && !form.date) return 'Please add a date for the consultation.';
  return '';
}

function EditConsultationModal({ consultation, onClose, onSaved }) {
  const [form, setForm] = useState(() => toFormState(consultation));
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const lead = consultation.leadId;

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function save(event) {
    event.preventDefault();
    const problem = validate(form);
    if (problem) {
      setError(problem);
      return;
    }
    setSaving(true);
    setError('');
    try {
      const res = await apiRequest(`/api/consultations/${consultation._id}`, {
        method: 'PATCH',
        body: {
          status: form.status,
          confirmedDate: form.date,
          confirmedTime: form.time,
          meetingWith: form.meetingWith.trim(),
        },
      });
      onSaved(res.notificationError || '');
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open title="Edit Consultation" onClose={onClose} width="max-w-2xl">
      <form onSubmit={save} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium">Lead Name</label>
            <input className={inputClass} value={lead?.fullName || ''} disabled readOnly />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">Contact Number</label>
            <input className={inputClass} value={lead?.contactNumber || lead?.phoneNumber || ''} disabled readOnly />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">Business Name</label>
            <input className={inputClass} value={lead?.businessName || ''} disabled readOnly />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">Consultation Status</label>
            <select className={inputClass} value={form.status} onChange={(e) => update('status', e.target.value)}>
              {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">Consultation Date (IST)</label>
            <input type="date" className={inputClass} value={form.date} onChange={(e) => update('date', e.target.value)} />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">Consultation Time (IST)</label>
            <input type="time" className={inputClass} value={form.time} onChange={(e) => update('time', e.target.value)} />
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1.5 block text-sm font-medium">Meeting With</label>
            <input className={inputClass} value={form.meetingWith} onChange={(e) => update('meetingWith', e.target.value)} />
          </div>
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onClose} className="rounded-lg border border-neutral-200 px-4 py-2 text-sm font-medium hover:bg-neutral-50">Cancel</button>
          <button type="submit" disabled={saving} className="inline-flex items-center gap-2 rounded-lg bg-[#FF4D00] px-4 py-2 text-sm font-medium text-white hover:bg-[#E64500] disabled:opacity-60">
            {saving && <Loader2 className="h-4 w-4 animate-spin" />} Save Changes
          </button>
        </div>
      </form>
    </Modal>
  );
}

export default function ConsultationsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState(null);
  const [notice, setNotice] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: String(PAGE_SIZE) });
    if (statusFilter) params.set('status', statusFilter);
    apiRequest(`/api/consultations?${params}`)
      .then((res) => { setData(res); setError(''); })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [page, statusFilter]);

  useEffect(() => { load(); }, [load]);

  function handleSaved(notificationError) {
    setEditing(null);
    setNotice(notificationError
      ? { type: 'warning', text: `Consultation saved, but the WhatsApp notification failed: ${notificationError}` }
      : { type: 'success', text: 'Consultation updated and the lead has been notified where needed.' });
    load();
  }

  const summary = data?.summary;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Consultations</h1>
        <p className="mt-1 text-sm text-neutral-500">Review requests, confirm meeting details and keep leads informed.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <SummaryCard icon={CalendarCheck} label="Today's Consultations" value={summary?.today} loading={!data} />
        <SummaryCard icon={Clock} label="Pending Consultations" value={summary?.pending} loading={!data} />
        <SummaryCard icon={CheckCircle2} label="Completed Consultations" value={summary?.completed} loading={!data} />
      </div>

      {notice && (
        <div className={`flex items-start gap-2 rounded-xl px-4 py-3 text-sm ${notice.type === 'success' ? 'bg-emerald-50 text-emerald-800' : 'bg-amber-50 text-amber-800'}`}>
          {notice.type === 'success' ? <CheckCircle className="mt-0.5 h-4 w-4" /> : <AlertTriangle className="mt-0.5 h-4 w-4" />}
          <span>{notice.text}</span>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="h-10 rounded-lg border border-neutral-200 bg-white px-3 text-sm outline-none focus:border-[#FF4D00]"
          aria-label="Filter by status"
        >
          <option value="">All statuses</option>
          {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        {data && <p className="text-sm text-neutral-500">{data.total} consultation{data.total === 1 ? '' : 's'}</p>}
      </div>

      {error && <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

      <div className="overflow-x-auto rounded-2xl border border-neutral-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-neutral-100 text-sm">
          <thead className="bg-neutral-50 text-left text-xs uppercase tracking-wide text-neutral-500">
            <tr>
              <th className="px-5 py-3 font-medium">Lead</th>
              <th className="px-5 py-3 font-medium">City</th>
              <th className="px-5 py-3 font-medium">Business</th>
              <th className="px-5 py-3 font-medium">Date</th>
              <th className="px-5 py-3 font-medium">Time</th>
              <th className="px-5 py-3 font-medium">Status</th>
              <th className="px-5 py-3 font-medium">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {loading && !data && Array.from({ length: 5 }).map((_, i) => (
              <tr key={i}>{Array.from({ length: 7 }).map((__, j) => (
                <td key={j} className="px-5 py-4"><div className="h-4 animate-pulse rounded bg-neutral-200" /></td>
              ))}</tr>
            ))}
            {data && data.items.length === 0 && (
              <tr><td colSpan={7} className="px-5 py-12 text-center text-neutral-500">No consultation requests found.</td></tr>
            )}
            {data?.items.map((c) => {
              const confirmed = Boolean(c.confirmedDate);
              const date = confirmed ? c.confirmedDate : c.requestedDate;
              const time = confirmed ? c.confirmedTime : c.requestedTime;
              return (
                <tr key={c._id} className="transition hover:bg-neutral-50">
                  <td className="px-5 py-3.5">
                    <Link href={`/leads/${c.leadId._id}`} className="font-medium text-neutral-900 hover:text-[#FF4D00]">{c.leadId.fullName || 'Unnamed'}</Link>
                    <p className="text-xs text-neutral-500">{c.leadId.contactNumber || c.leadId.phoneNumber}</p>
                  </td>
                  <td className="px-5 py-3.5">{c.leadId.city || '-'}</td>
                  <td className="px-5 py-3.5">{c.leadId.businessName || '-'}</td>
                  <td className="whitespace-nowrap px-5 py-3.5">{formatConsultationDate(date)}</td>
                  <td className="whitespace-nowrap px-5 py-3.5">{formatConsultationTime(time)}</td>
                  <td className="px-5 py-3.5"><StatusBadge status={c.status} /></td>
                  <td className="px-5 py-3.5">
                    <button
                      onClick={() => setEditing(c)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-200 px-3 py-1.5 text-xs font-medium transition hover:border-[#FF4D00] hover:text-[#FF4D00]"
                    >
                      <Pencil className="h-3.5 w-3.5" /> Edit
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {data && data.pages > 1 && (
        <div className="flex items-center justify-end gap-3">
          <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="rounded-lg border border-neutral-200 px-3 py-1.5 text-sm disabled:opacity-40">Previous</button>
          <span className="text-sm text-neutral-600">Page {data.page} of {data.pages}</span>
          <button disabled={page >= data.pages} onClick={() => setPage((p) => p + 1)} className="rounded-lg border border-neutral-200 px-3 py-1.5 text-sm disabled:opacity-40">Next</button>
        </div>
      )}

      {editing && (
        <EditConsultationModal consultation={editing} onClose={() => setEditing(null)} onSaved={handleSaved} />
      )}
    </div>
  );
}
