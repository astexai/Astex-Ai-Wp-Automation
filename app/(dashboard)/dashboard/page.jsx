'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Users, UserPlus, CalendarClock, BadgeCheck, ArrowRight, Phone, MapPin } from 'lucide-react';
import { apiRequest } from '@/lib/clientApi';
import { formatConsultationDate, formatConsultationTime } from '@/lib/format';
import StatusBadge from '@/components/common/StatusBadge';

function StatCard({ label, value, icon: Icon, loading }) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm transition hover:shadow-md">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-neutral-500">{label}</p>
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-50 text-[#FF4D00]">
          <Icon className="h-4 w-4" />
        </div>
      </div>
      {loading ? (
        <div className="mt-3 h-8 w-20 animate-pulse rounded bg-neutral-100" />
      ) : (
        <p className="mt-3 text-3xl font-semibold tracking-tight">{value}</p>
      )}
    </div>
  );
}

function Panel({ title, viewAllHref, children }) {
  return (
    <section className="rounded-2xl border border-neutral-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-neutral-100 px-5 py-4">
        <h2 className="text-base font-semibold">{title}</h2>
        <Link href={viewAllHref} className="inline-flex items-center gap-1 text-sm font-medium text-[#FF4D00] hover:underline">
          View All <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
      {children}
    </section>
  );
}

function PanelSkeleton() {
  return (
    <div className="space-y-3 p-5">
      {[0, 1, 2].map((i) => (
        <div key={i} className="h-10 animate-pulse rounded-lg bg-neutral-100" />
      ))}
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    apiRequest('/api/dashboard/stats')
      .then(setData)
      .catch((err) => setError(err.message));
  }, []);

  const stats = data?.stats;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="mt-1 text-sm text-neutral-500">A live overview of your WhatsApp enquiries and consultations.</p>
      </div>

      {error && <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Leads" value={stats?.totalLeads ?? 0} icon={Users} loading={!data && !error} />
        <StatCard label="Today's Leads" value={stats?.todaysLeads ?? 0} icon={UserPlus} loading={!data && !error} />
        <StatCard label="Today's Consultations" value={stats?.todaysConsultations ?? 0} icon={CalendarClock} loading={!data && !error} />
        <StatCard label="Converted" value={stats?.converted ?? 0} icon={BadgeCheck} loading={!data && !error} />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Panel title="Recent New Leads" viewAllHref="/leads">
          {!data ? (
            <PanelSkeleton />
          ) : data.recentLeads.length === 0 ? (
            <p className="px-5 py-10 text-center text-sm text-neutral-500">No new leads yet. They appear here as soon as someone messages your number.</p>
          ) : (
            <ul className="divide-y divide-neutral-100">
              {data.recentLeads.map((lead) => (
                <li
                  key={lead._id}
                  onClick={() => router.push(`/leads/${lead._id}`)}
                  className="cursor-pointer px-5 py-3.5 transition hover:bg-neutral-50"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="truncate text-sm font-medium">{lead.fullName || 'Unnamed lead'}</p>
                    <StatusBadge status={lead.leadStatus} />
                  </div>
                  <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-neutral-500">
                    <span className="inline-flex items-center gap-1"><Phone className="h-3 w-3" />{lead.contactNumber || lead.phoneNumber}</span>
                    <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" />{lead.city || '-'}</span>
                    <span>{lead.businessName || '-'}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title="New Consultation Requests" viewAllHref="/consultations">
          {!data ? (
            <PanelSkeleton />
          ) : data.consultationRequests.length === 0 ? (
            <p className="px-5 py-10 text-center text-sm text-neutral-500">No pending consultation requests right now.</p>
          ) : (
            <ul className="divide-y divide-neutral-100">
              {data.consultationRequests.map((c) => (
                <li
                  key={c._id}
                  onClick={() => router.push('/consultations')}
                  className="cursor-pointer px-5 py-3.5 transition hover:bg-neutral-50"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="truncate text-sm font-medium">{c.leadId.fullName || 'Unnamed lead'}</p>
                    <StatusBadge status={c.status} />
                  </div>
                  <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-neutral-500">
                    <span className="inline-flex items-center gap-1"><Phone className="h-3 w-3" />{c.leadId.contactNumber || c.leadId.phoneNumber}</span>
                    <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" />{c.leadId.city || '-'}</span>
                    <span>{c.leadId.businessName || '-'}</span>
                    <span>{formatConsultationDate(c.requestedDate)} at {formatConsultationTime(c.requestedTime)}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </div>
  );
}
