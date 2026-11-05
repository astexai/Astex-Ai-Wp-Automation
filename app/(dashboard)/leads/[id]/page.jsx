'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, Loader2, Send, Plus, Phone, MapPin, Building2, Check, Video } from 'lucide-react';
import { apiRequest } from '@/lib/clientApi';
import { LEAD_STATUSES } from '@/lib/leadOptions';
import { formatConsultationDate, formatConsultationTime, formatDateTime, instantToIstDateInput, instantToIstTimeInput } from '@/lib/format';
import StatusBadge from '@/components/common/StatusBadge';
import Modal from '@/components/common/Modal';

const TABS = [
  { key: 'inquiry', label: 'Inquiry' },
  { key: 'chat', label: 'WhatsApp Chat' },
  { key: 'consultation', label: 'Consultation Scheduled' },
  { key: 'notes', label: 'Notes' },
];

const yesNo = (v) => (v === true ? 'Yes' : v === false ? 'No' : '-');
const list = (items) => (items && items.length ? items.join(', ') : '-');

function Card({ title, children }) {
  return (
    <section className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
      <h3 className="mb-4 text-sm font-semibold text-neutral-900">{title}</h3>
      <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2">{children}</dl>
    </section>
  );
}

function Row({ label, value, wide }) {
  return (
    <div className={wide ? 'sm:col-span-2' : ''}>
      <dt className="text-xs font-medium uppercase tracking-wide text-neutral-500">{label}</dt>
      <dd className="mt-1 text-sm text-neutral-900">{value || '-'}</dd>
    </div>
  );
}

function InquiryTab({ inquiries }) {
  if (!inquiries.length) {
    return <p className="rounded-2xl border border-dashed border-neutral-300 bg-white p-10 text-center text-sm text-neutral-500">No inquiries recorded yet. A new inquiry appears here when this lead starts chatting.</p>;
  }
  return (
    <div className="space-y-6">
      {inquiries.map((inquiry, index) => (
        <Card key={inquiry._id} title={`Inquiry ${inquiries.length - index} · started ${formatDateTime(inquiry.createdAt)}`}>
          <Row label="Full Name" value={inquiry.fullName} />
          <Row label="Contact Number" value={inquiry.contactNumber} />
          <Row label="City" value={inquiry.city} />
          <Row label="Business Name" value={inquiry.businessName} />
          <Row label="Business Type" value={inquiry.businessType} wide />
          <Row label="Services Required" value={list(inquiry.requiredServices)} wide />
          <Row label="Lead Generation Sources" value={list(inquiry.leadSources)} wide />
          <Row label="Current Daily Leads" value={inquiry.dailyLeadVolume} />
          <Row label="Current Challenges" value={list(inquiry.currentChallenges)} wide />
          <Row label="Pricing Comfortable" value={yesNo(inquiry.pricingComfortable)} />
          <Row label="Demo Requested" value={yesNo(inquiry.demoRequested)} />
          <Row label="Demo Sent" value={yesNo(inquiry.demoSent)} />
          <Row label="Demo Watched" value={yesNo(inquiry.demoWatched)} />
          <Row label="Implementation Plan" value={inquiry.implementationPlan} />
          <Row label="Founder Consultation Requested" value={yesNo(inquiry.founderConsultationRequested)} wide />
        </Card>
      ))}
    </div>
  );
}

function ChatTab({ leadId, lead }) {
  const [messages, setMessages] = useState(null);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const bottomRef = useRef(null);

  const loadMessages = useCallback(() => {
    apiRequest(`/api/whatsapp/messages/${leadId}`)
      .then((data) => setMessages(data.items))
      .catch((err) => setError(err.message));
  }, [leadId]);

  useEffect(() => {
    loadMessages();
    const handle = setInterval(loadMessages, 5000);
    return () => clearInterval(handle);
  }, [loadMessages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function send(event) {
    event.preventDefault();
    const body = text.trim();
    if (!body) return;
    setSending(true);
    setError('');
    try {
      await apiRequest('/api/whatsapp/send', { method: 'POST', body: { leadId, text: body } });
      setText('');
      loadMessages();
    } catch (err) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex h-[32rem] flex-col overflow-hidden rounded-2xl border border-neutral-200 bg-[#EFEAE2]">
      <div className="flex-1 space-y-2 overflow-y-auto p-4">
        {!messages && <p className="text-center text-sm text-neutral-500">Loading conversation...</p>}
        {messages && messages.length === 0 && (
          <p className="text-center text-sm text-neutral-500">No messages yet for {lead.fullName || 'this lead'}.</p>
        )}
        {messages?.map((m) => {
          const outgoing = m.direction === 'outgoing';
          return (
            <div key={m._id} className={`flex ${outgoing ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[75%] rounded-xl px-3 py-2 text-sm shadow-sm ${outgoing ? 'bg-[#D9FDD3]' : 'bg-white'}`}>
                {m.mediaType === 'video' && m.mediaUrl && (
                  <video src={m.mediaUrl} controls className="mb-1 max-h-48 rounded-lg" />
                )}
                {m.mediaType && m.mediaType !== 'video' && !m.mediaUrl && (
                  <p className="mb-1 inline-flex items-center gap-1 text-xs text-neutral-500"><Video className="h-3 w-3" />{m.mediaType} received</p>
                )}
                <p className="whitespace-pre-wrap break-words text-neutral-900">{m.messageText}</p>
                <p className="mt-1 flex items-center justify-end gap-1 text-[10px] text-neutral-500">
                  {formatDateTime(m.timestamp)}
                  {outgoing && <Check className="h-3 w-3" />}
                  {outgoing && m.deliveryStatus === 'failed' && <span className="text-red-600">Failed</span>}
                  {outgoing && m.sentByAgent && <span>by {m.sentByAgent}</span>}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>
      {error && <p className="bg-red-50 px-4 py-2 text-xs text-red-700">{error}</p>}
      <form onSubmit={send} className="flex items-center gap-2 border-t border-neutral-200 bg-white p-3">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type a message"
          maxLength={4000}
          className="h-10 flex-1 rounded-full border border-neutral-200 px-4 text-sm outline-none focus:border-[#FF4D00] focus:ring-2 focus:ring-[#FF4D00]/20"
        />
        <button
          type="submit"
          disabled={sending || !text.trim()}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-[#FF4D00] text-white transition hover:bg-[#E64500] disabled:opacity-50"
          aria-label="Send message"
        >
          {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </button>
      </form>
    </div>
  );
}

function ConsultationTab({ consultations }) {
  if (!consultations.length) {
    return <p className="rounded-2xl border border-dashed border-neutral-300 bg-white p-10 text-center text-sm text-neutral-500">No consultation requests from this lead yet.</p>;
  }
  return (
    <div className="overflow-x-auto rounded-2xl border border-neutral-200 bg-white shadow-sm">
      <table className="min-w-full divide-y divide-neutral-100 text-sm">
        <thead className="bg-neutral-50 text-left text-xs uppercase tracking-wide text-neutral-500">
          <tr>
            <th className="px-5 py-3 font-medium">Date</th>
            <th className="px-5 py-3 font-medium">Time</th>
            <th className="px-5 py-3 font-medium">Meeting With</th>
            <th className="px-5 py-3 font-medium">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-100">
          {consultations.map((c) => {
            const isConfirmed = c.confirmedDate;
            const date = isConfirmed ? c.confirmedDate : c.requestedDate;
            const time = isConfirmed ? c.confirmedTime : c.requestedTime;
            return (
              <tr key={c._id}>
                <td className="px-5 py-3.5">{formatConsultationDate(date)}</td>
                <td className="px-5 py-3.5">{formatConsultationTime(time)}</td>
                <td className="px-5 py-3.5">{c.meetingWith || '-'}</td>
                <td className="px-5 py-3.5"><StatusBadge status={c.status} /></td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function NotesTab({ leadId, notes, onSaved }) {
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');
  const [followUpTime, setFollowUpTime] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState(null);

  function reset() {
    setEditingId(null);
    setNote('');
    setFollowUpDate('');
    setFollowUpTime('');
    setError('');
  }

  function openEdit(n) {
    setEditingId(n._id);
    setNote(n.note);
    setFollowUpDate(n.nextFollowUpDate ? instantToIstDateInput(n.nextFollowUpDate) : '');
    setFollowUpTime(n.nextFollowUpTime || '');
    setError('');
    setOpen(true);
  }

  async function save(event) {
    event.preventDefault();
    if (!note.trim()) {
      setError('Please write a note before saving.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const body = { note, nextFollowUpDate: followUpDate, nextFollowUpTime: followUpTime };
      if (editingId) {
        await apiRequest(`/api/notes/${editingId}`, { method: 'PATCH', body });
      } else {
        await apiRequest('/api/notes', { method: 'POST', body: { ...body, leadId } });
      }
      reset();
      setOpen(false);
      onSaved();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  const inputClass = 'w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-[#FF4D00] focus:ring-2 focus:ring-[#FF4D00]/20';

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-[#FF4D00] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#E64500]"
        >
          <Plus className="h-4 w-4" /> Add Note
        </button>
      </div>

      {notes.length === 0 && (
        <p className="rounded-2xl border border-dashed border-neutral-300 bg-white p-10 text-center text-sm text-neutral-500">
          No internal notes yet. Notes are never sent to the customer.
        </p>
      )}
      {notes.length > 0 && (
        <div className="overflow-x-auto rounded-2xl border border-neutral-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-neutral-100 text-sm">
            <thead className="bg-neutral-50 text-left text-xs uppercase tracking-wide text-neutral-500">
              <tr>
                <th className="px-5 py-3 font-medium">S.No</th>
                <th className="px-5 py-3 font-medium">Note</th>
                <th className="px-5 py-3 font-medium">Next Follow-up</th>
                <th className="px-5 py-3 text-right font-medium">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {notes.map((n, index) => (
                <tr key={n._id}>
                  <td className="px-5 py-3.5 text-neutral-500">{index + 1}</td>
                  <td className="max-w-md px-5 py-3.5">
                    <p className="whitespace-pre-wrap text-neutral-900">{n.note}</p>
                    <p className="mt-1 text-xs text-neutral-500">Added {formatDateTime(n.createdAt)} by {n.createdBy || 'team'}</p>
                  </td>
                  <td className="px-5 py-3.5 text-neutral-700">{n.nextFollowUpDate ? formatDateTime(n.nextFollowUpDate) : '-'}</td>
                  <td className="px-5 py-3.5 text-right">
                    <button onClick={() => openEdit(n)} className="rounded-lg border border-neutral-200 px-3 py-1.5 text-xs font-medium transition hover:bg-neutral-50">
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={open} title={editingId ? 'Edit Note' : 'Add Note'} onClose={() => { setOpen(false); reset(); }}>
        <form onSubmit={save} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium">Note</label>
            <textarea rows={4} value={note} onChange={(e) => setNote(e.target.value)} className={inputClass} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-sm font-medium">Next Follow-up Date</label>
              <input type="date" value={followUpDate} onChange={(e) => setFollowUpDate(e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Next Follow-up Time</label>
              <input type="time" value={followUpTime} onChange={(e) => setFollowUpTime(e.target.value)} className={inputClass} />
            </div>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => { setOpen(false); reset(); }} className="rounded-lg border border-neutral-200 px-4 py-2 text-sm font-medium hover:bg-neutral-50">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="inline-flex items-center gap-2 rounded-lg bg-[#FF4D00] px-4 py-2 text-sm font-medium text-white hover:bg-[#E64500] disabled:opacity-60">
              {saving && <Loader2 className="h-4 w-4 animate-spin" />} Save Note
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default function LeadDetailPage() {
  const params = useParams();
  const leadId = params.id;
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [tab, setTab] = useState('inquiry');
  const [statusError, setStatusError] = useState('');
  const [lostReason, setLostReason] = useState('');

  const load = useCallback(() => {
    apiRequest(`/api/leads/${leadId}`)
      .then((res) => { setData(res); setError(''); })
      .catch((err) => setError(err.message));
  }, [leadId]);

  useEffect(() => { load(); }, [load]);

  async function changeStatus(status) {
    setStatusError('');
    if (status === 'Lost' && !lostReason.trim()) {
      setStatusError('Enter a lost reason before marking this lead as Lost.');
      return;
    }
    try {
      await apiRequest(`/api/leads/${leadId}`, {
        method: 'PATCH',
        body: status === 'Lost' ? { leadStatus: status, lostReason } : { leadStatus: status },
      });
      load();
    } catch (err) {
      setStatusError(err.message);
    }
  }

  if (error) {
    return (
      <div className="space-y-4">
        <Link href="/leads" className="inline-flex items-center gap-1 text-sm text-neutral-600 hover:text-neutral-900"><ArrowLeft className="h-4 w-4" /> Back to leads</Link>
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="space-y-4">
        <div className="h-28 animate-pulse rounded-2xl bg-white" />
        <div className="h-64 animate-pulse rounded-2xl bg-white" />
      </div>
    );
  }

  const { lead, consultations, notes, inquiries } = data;

  return (
    <div className="space-y-6">
      <Link href="/leads" className="inline-flex items-center gap-1 text-sm text-neutral-600 hover:text-neutral-900"><ArrowLeft className="h-4 w-4" /> Back to leads</Link>

      <div className="flex flex-col gap-4 rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{lead.fullName || 'Unnamed lead'}</h1>
          <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-sm text-neutral-600">
            <span className="inline-flex items-center gap-1.5"><Phone className="h-3.5 w-3.5" />{lead.contactNumber || lead.phoneNumber}</span>
            <span className="inline-flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" />{lead.city || '-'}</span>
            <span className="inline-flex items-center gap-1.5"><Building2 className="h-3.5 w-3.5" />{lead.businessName || '-'}</span>
          </div>
        </div>
        <div className="flex flex-col items-start gap-2 md:items-end">
          <div className="flex items-center gap-3">
            <StatusBadge status={lead.leadStatus} />
            <select
              value={lead.leadStatus}
              onChange={(e) => changeStatus(e.target.value)}
              className="h-9 rounded-lg border border-neutral-200 bg-white px-3 text-sm outline-none focus:border-[#FF4D00] focus:ring-2 focus:ring-[#FF4D00]/20"
              aria-label="Lead status"
            >
              {LEAD_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          {lead.leadStatus === 'Lost' && lead.lostReason && (
            <p className="text-xs text-red-700">Lost reason: {lead.lostReason}</p>
          )}
          <div className="flex items-center gap-2">
            <input
              value={lostReason}
              onChange={(e) => setLostReason(e.target.value)}
              placeholder="Lost reason (needed for Lost)"
              className="h-9 w-64 rounded-lg border border-neutral-200 px-3 text-xs outline-none focus:border-[#FF4D00]"
            />
          </div>
          {statusError && <p className="text-xs text-red-600">{statusError}</p>}
        </div>
      </div>

      <div className="flex gap-1 overflow-x-auto rounded-xl bg-white p-1 shadow-sm">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium transition ${
              tab === t.key ? 'bg-[#FF4D00] text-white' : 'text-neutral-600 hover:bg-neutral-100'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'inquiry' && <InquiryTab inquiries={inquiries} />}
      {tab === 'chat' && <ChatTab leadId={leadId} lead={lead} />}
      {tab === 'consultation' && <ConsultationTab consultations={consultations} />}
      {tab === 'notes' && <NotesTab leadId={leadId} notes={notes} onSaved={load} />}
    </div>
  );
}
