import {
  AuthProviderSchema,
  AuthSessionSchema,
  type AuthProvider,
  type AuthSession,
  type AuthUser,
} from '@manta/shared';

import { adoptProgress, setSyncAccount, type SyncAccount } from '@/features/progress/progress';
import { track } from '@/lib/analytics';
import { api } from '@/lib/api';
import { secure } from '@/lib/secure';
import { createStore, useStore } from '@/lib/store';

import { appleCredential } from './apple';
import { googleIdToken } from './google';

/**
 * Con cuenta (Apple o Google), el progreso se guarda en el teléfono y en la nube.
 * Como invitado, solo en el teléfono; se puede entrar con una cuenta más tarde sin perder nada.
 */
export type Session =
  { kind: 'guest' } | { kind: 'account'; provider: AuthProvider; token: string; user: AuthUser };

type AccountSession = Extract<Session, { kind: 'account' }>;

const KEY = 'manta.session';
const sessionStore = createStore<Session | null>(null);

export function useSession(): Session | null {
  return useStore(sessionStore);
}

export function getSession(): Session | null {
  return sessionStore.get();
}

/** Lee la sesión guardada en el llavero. Se llama una vez al abrir la app. */
export function loadSession(): void {
  const session = parseSession(secure.get(KEY));
  sessionStore.set(session);
  if (session?.kind === 'account') setSyncAccount(syncAccount(session));
}

function parseSession(raw: string | null): Session | null {
  if (!raw) return null;
  try {
    const value = JSON.parse(raw) as { kind?: unknown; provider?: unknown };
    if (value.kind === 'guest') return { kind: 'guest' };
    const provider = AuthProviderSchema.safeParse(value.provider);
    const auth = AuthSessionSchema.safeParse(value);
    if (value.kind !== 'account' || !provider.success || !auth.success) return null;
    return { kind: 'account', provider: provider.data, ...auth.data };
  } catch {
    return null;
  }
}

function saveSession(session: Session): void {
  secure.set(KEY, JSON.stringify(session));
  sessionStore.set(session);
}

function syncAccount(session: AccountSession): SyncAccount {
  return {
    userId: session.user.id,
    token: session.token,
    // Si la nube ya no acepta la sesión, se sigue como invitado: el progreso del teléfono no se pierde.
    onRejected: () => saveSession({ kind: 'guest' }),
  };
}

/** Sin cuenta: todo se queda en el teléfono. */
export function enterAsGuest(): void {
  saveSession({ kind: 'guest' });
  setSyncAccount(null);
  track('account_guest');
}

/** Devuelve false si la persona cerró la ventana de Apple sin entrar. */
export async function signInWithApple(): Promise<boolean> {
  const credential = await appleCredential();
  if (!credential) return false;
  await startAccountSession('apple', await api.signInWithApple(credential));
  return true;
}

/** Devuelve false si la persona cerró la ventana de Google sin entrar. */
export async function signInWithGoogle(): Promise<boolean> {
  const idToken = await googleIdToken();
  if (!idToken) return false;
  await startAccountSession('google', await api.signInWithGoogle(idToken));
  return true;
}

async function startAccountSession(provider: AuthProvider, auth: AuthSession): Promise<void> {
  const session: AccountSession = { kind: 'account', provider, ...auth };
  saveSession(session);
  track('account_signed_in', { provider });
  // El progreso del teléfono y el de la nube se juntan: gana el más reciente.
  await adoptProgress(syncAccount(session));
}
