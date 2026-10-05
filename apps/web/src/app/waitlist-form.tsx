'use client';

import { useState, type FormEvent } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000/v1';

type Status = 'idle' | 'sending' | 'done' | 'error';

export function WaitlistForm() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<Status>('idle');

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus('sending');
    try {
      const response = await fetch(`${API_URL}/waitlist`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, locale: 'es', source: 'web' }),
      });
      setStatus(response.ok ? 'done' : 'error');
    } catch {
      setStatus('error');
    }
  }

  if (status === 'done') {
    return (
      <p role="status" className="mt-10 text-lg text-sol">
        Listo. Te escribimos cuando Manta esté en las tiendas.
      </p>
    );
  }

  return (
    <form onSubmit={onSubmit} className="mt-10 flex flex-col gap-3 sm:flex-row">
      <label htmlFor="email" className="sr-only">
        Tu correo
      </label>
      <input
        id="email"
        type="email"
        required
        autoComplete="email"
        placeholder="Tu correo"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        className="min-h-12 flex-1 rounded-xl border border-bruma/40 bg-white/5 px-4 text-lg text-espuma placeholder:text-bruma focus:border-sol focus:outline-none"
      />
      <button
        type="submit"
        disabled={status === 'sending'}
        className="min-h-12 rounded-xl bg-sol px-6 text-lg font-semibold text-abismo focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sol disabled:opacity-60"
      >
        {status === 'sending' ? 'Enviando…' : 'Avisarme cuando salga'}
      </button>
      {status === 'error' && (
        <p role="alert" className="text-base text-sol sm:basis-full">
          No pudimos guardar tu correo. Revisa la dirección e inténtalo de nuevo.
        </p>
      )}
    </form>
  );
}
