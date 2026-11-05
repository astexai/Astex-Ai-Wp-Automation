'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Trash2, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { apiRequest } from '@/lib/clientApi';
import { LEAD_STATUSES, IMPLEMENTATION_PLANS, BUSINESS_TYPES } from '@/lib/leadOptions';
import StatusBadge from '@/components/common/StatusBadge';
import Modal from '@/components/common/Modal';

const EMPTY_FILTERS = { search: '', date: '', city: '', businessType: '', pricing: '', plan: '', status: '' };

const selectClass =
  'h-10 rounded-lg border border-neutral-200 bg-white px-3 text-sm outline-none transition focus:border-[#FF4D00] focus:ring-2 focus:ring-[#FF4D00]/20';

function SummaryCard({ label, value }) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-neutral-500">{label}</p>
      <p className="mt-2 text-3xl font-semibold tracking-tight">{value ?? '-'}</p>
    </div>
  );
}

export default function LeadsPage() {
  const router = useRouter();
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [page, setPage] = useState(1);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [pendingDelete, setPendingDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async (nextFilters, nextPage) => {
    setLoading(true);
    setError('');
    const params = new URLSearchParams({ page: String(nextPage), limit: '15' });
    Object.entries(nextFilters).forEach(([key, value]) => value && params.set(key, value));
    try {
      setData(await apiRequest(`/api/leads?${params.toString()}`));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const handle = setTimeout(() => load(filters, page), filters.search ? 300 : 0);
    return () => clearTimeout(handle);
  }, [filters, page, load]);

  useEffect(() => {
    if (!notice) return undefined;
    const handle = setTimeout(() => setNotice(''), 3000);
    return () => clearTimeout(handle);
  }, [notice]);

  function updateFilter(key, value) {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPage(1);
  }

  async function confirmDelete() {
    setDeleting(true);
    try {
      await apiRequest(`/api/leads/${pendingDelete._id}`, { method: 'DELETE' });
      setNotice(`Deleted ${pendingDelete.fullName || 'lead'} and their conversation history.`);
      setPendingDelete(null);
      load(filters, page);
    } catch (err) {
      setError(err.message);
      setPendingDelete(null);
    } finally {
      setDeleting(false);
    }
  }

  const leads = data?.items || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Leads Management</h1>
        <p className="mt-1 text-sm text-neutral-500">Every enquiry captured from WhatsApp, in one place.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <SummaryCard label="Total Leads" value={data?.summary?.total} />
        <SummaryCard label="In Follow-ups" value={data?.summary?.inFollowUps} />
        <SummaryCard label="Converted" value={data?.summary?.converted} />
      </div>

      {notice && <p className="rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{notice}</p>}
      {error && <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

      <div className="rounded-2xl border border-neutral-200 bg-white shadow-sm">
        <div className="grid gap-3 border-b border-neutral-100 p-4 md:grid-cols-2 xl:grid-cols-8">
          <div className="relative md:col-span-2 xl:col-span-2">
            <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-neutral-400" />
            <input
              value={filters.search}
              onChange={(e) => updateFilter('search', e.target.value)}
              placeholder="Search by name, phone or business"
              className="h-10 w-full rounded-lg border border-neutral-200 pl-9 pr-3 text-sm outline-none transition focus:border-[#FF4D00] focus:ring-2 focus:ring-[#FF4D00]/20"
            />
          </div>
          <input
            type="date"
            value={filters.date}
            onChange={(e) => updateFilter('date', e.target.value)}
            aria-label="Filter by date added"
            className={selectClass}
          />
          <input
            value={filters.city}
            onChange={(e) => updateFilter('city', e.target.value)}
            placeholder="City"
            className={selectClass}
          />
          <select value={filters.businessType} onChange={(e) => updateFilter('businessType', e.target.value)} className={selectClass}>
            <option value="">All business types</option>
            {BUSINESS_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          <select value={filters.pricing} onChange={(e) => updateFilter('pricing', e.target.value)} className={selectClass}>
            <option value="">All pricing responses</option>
            <option value="comfortable">Comfortable</option>
            <option value="not">Not comfortable</option>
          </select>
          <select value={filters.plan} onChange={(e) => updateFilter('plan', e.target.value)} className={selectClass}>
            <option value="">All timelines</option>
            {IMPLEMENTATION_PLANS.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
          <select value={filters.status} onChange={(e) => updateFilter('status', e.target.value)} className={selectClass}>
            <option value="">All statuses</option>
            {LEAD_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-neutral-100 text-sm">
            <thead className="bg-neutral-50 text-left text-xs uppercase tracking-wide text-neutral-500">
              <tr>
                <th className="px-5 py-3 font-medium">Lead</th>
                <th className="px-5 py-3 font-medium">City</th>
                <th className="px-5 py-3 font-medium">Business</th>
                <th className="px-5 py-3 font-medium">Type</th>
                <th className="px-5 py-3 font-medium">Pricing</th>
                <th className="px-5 py-3 font-medium">Timeline</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {loading && !data &&
                [0, 1, 2, 3, 4].map((i) => (
                  <tr key={i}>
                    <td colSpan={8} className="px-5 py-3"><div className="h-6 animate-pulse rounded bg-neutral-100" /></td>
                  </tr>
                ))}
              {data && leads.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-5 py-14 text-center text-neutral-500">
                    No leads match these filters yet.
                  </td>
                </tr>
              )}
              {leads.map((lead) => (
                <tr
                  key={lead._id}
                  onClick={() => router.push(`/leads/${lead._id}`)}
                  className="cursor-pointer transition hover:bg-orange-50/40"
                >
                  <td className="px-5 py-3.5">
                    <p className="font-medium">{lead.fullName || 'Unnamed lead'}</p>
                    <p className="text-xs text-neutral-500">{lead.contactNumber || lead.phoneNumber}</p>
                  </td>
                  <td className="px-5 py-3.5 text-neutral-700">{lead.city || '-'}</td>
                  <td className="px-5 py-3.5 text-neutral-700">{lead.businessName || '-'}</td>
                  <td className="px-5 py-3.5 text-neutral-700">{lead.businessType || '-'}</td>
                  <td className="px-5 py-3.5">
                    {lead.pricingComfortable === true && <span className="text-emerald-700">Comfortable</span>}
                    {lead.pricingComfortable === false && <span className="text-red-700">Not comfortable</span>}
                    {lead.pricingComfortable === null && <span className="text-neutral-400">-</span>}
                  </td>
                  <td className="px-5 py-3.5 text-neutral-700">{lead.implementationPlan || '-'}</td>
                  <td className="px-5 py-3.5"><StatusBadge status={lead.leadStatus} /></td>
                  <td className="px-5 py-3.5 text-right">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setPendingDelete(lead);
                      }}
                      className="rounded-lg p-2 text-neutral-500 transition hover:bg-red-50 hover:text-red-600"
                      aria-label={`Delete ${lead.fullName || 'lead'}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {data && data.pages > 1 && (
          <div className="flex items-center justify-between border-t border-neutral-100 px-5 py-3 text-sm">
            <p className="text-neutral-500">
              Page {data.page} of {data.pages} ({data.total} leads)
            </p>
            <div className="flex gap-2">
              <button
                disabled={page <= 1 || loading}
                onClick={() => setPage((p) => p - 1)}
                className="inline-flex items-center gap-1 rounded-lg border border-neutral-200 px-3 py-1.5 transition hover:bg-neutral-50 disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4" /> Previous
              </button>
              <button
                disabled={page >= data.pages || loading}
                onClick={() => setPage((p) => p + 1)}
                className="inline-flex items-center gap-1 rounded-lg border border-neutral-200 px-3 py-1.5 transition hover:bg-neutral-50 disabled:opacity-40"
              >
                Next <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
        {loading && data && (
          <div className="flex justify-center border-t border-neutral-100 py-2">
            <Loader2 className="h-4 w-4 animate-spin text-neutral-400" />
          </div>
        )}
      </div>

      <Modal open={!!pendingDelete} title="Delete lead?" onClose={() => setPendingDelete(null)} width="max-w-md">
        <p className="text-sm text-neutral-600">
          This permanently removes <span className="font-medium text-neutral-900">{pendingDelete?.fullName || 'this lead'}</span>,
          their WhatsApp messages, notes and consultations. This cannot be undone.
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <button onClick={() => setPendingDelete(null)} className="rounded-lg border border-neutral-200 px-4 py-2 text-sm font-medium transition hover:bg-neutral-50">
            Cancel
          </button>
          <button
            onClick={confirmDelete}
            disabled={deleting}
            className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700 disabled:opacity-60"
          >
            {deleting && <Loader2 className="h-4 w-4 animate-spin" />}
            Delete lead
          </button>
        </div>
      </Modal>
    </div>
  );
}
