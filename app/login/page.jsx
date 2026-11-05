'use client';

import { useState } from 'react';
import { Zap, Loader2, Mail, Lock } from 'lucide-react';
import { apiRequest } from '@/lib/clientApi';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await apiRequest('/api/auth/login', { method: 'POST', body: { email, password } });
      const next = new URLSearchParams(window.location.search).get('next');
      window.location.assign(next && next.startsWith('/') ? next : '/dashboard');
    } catch (err) {
      setError(err.message);
      setSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-white px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#FF4D00] text-white shadow-sm">
            <Zap className="h-6 w-6" />
          </div>
          <h1 className="mt-4 text-2xl font-semibold tracking-tight">ASTEX AI</h1>
          <p className="mt-1 text-sm text-neutral-500">Automating the Future</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
          <div>
            <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-neutral-700">Email</label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-neutral-400" />
              <input
                id="email"
                type="email"
                autoComplete="username"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-10 w-full rounded-lg border border-neutral-200 bg-white pl-9 pr-3 text-sm outline-none transition focus:border-[#FF4D00] focus:ring-2 focus:ring-[#FF4D00]/20"
              />
            </div>
          </div>
          <div>
            <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-neutral-700">Password</label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-neutral-400" />
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-10 w-full rounded-lg border border-neutral-200 bg-white pl-9 pr-3 text-sm outline-none transition focus:border-[#FF4D00] focus:ring-2 focus:ring-[#FF4D00]/20"
              />
            </div>
          </div>

          {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-[#FF4D00] text-sm font-medium text-white transition hover:bg-[#E64500] disabled:opacity-60"
          >
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
            Sign in
          </button>
        </form>
      </div>
    </main>
  );
}
