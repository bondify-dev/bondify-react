// ============================================================
//  @bondify/react — Next.js App Router utils
//  Server Actions, cookie management, SSR helpers
// ============================================================

// IMPORTANT: this file is server-only (Next.js App Router).
// Do not import it from Client Components.
//
// The `server-only` import below isn't just documentation — it's a build-time
// guard. If this module ever ends up in a Client Component's bundle, Next.js
// fails the build with a clear error ("You're importing a component that
// needs 'server-only'...") instead of the confusing runtime error you'd get
// from `next/headers` ("headers was called outside a request scope") deep
// inside a component tree.
import 'server-only';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import type { BondifyUser } from './types';

const COOKIE_NAME    = 'bondify_proof';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

// ─── Saving the proof into an httpOnly cookie ────────────────────────────────
/**
 * Server Action: stores the proof JWT in an httpOnly cookie.
 * Called from a Client Component after a successful sign-in.
 *
 * @example
 * ```tsx
 * // app/login/page.tsx (Client Component)
 * import { saveProofCookie } from '@bondify/react/server';
 *
 * const { user } = useBondifyAuth();
 * useEffect(() => {
 *   if (user?.proof) saveProofCookie(user.proof);
 * }, [user]);
 * ```
 */
export async function saveProofCookie(proof: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, proof, {
    httpOnly:  true,
    secure:    process.env.NODE_ENV === 'production',
    sameSite:  'lax',
    path:      '/',
    maxAge:    COOKIE_MAX_AGE,
  });
}

// ─── Clearing the cookie (logout) ────────────────────────────────────────────
export async function clearProofCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

// ─── Reading the proof from the cookie ───────────────────────────────────────
export async function getProofFromCookie(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(COOKIE_NAME)?.value ?? null;
}

// ─── Verify the proof and return the user (SSR) ──────────────────────────────
/**
 * Verifies the proof JWT on the server without calling the Bondify API.
 * Uses @bondify/node under the hood.
 *
 * @example
 * ```tsx
 * // app/dashboard/page.tsx (Server Component)
 * import { getServerUser } from '@bondify/react/server';
 *
 * export default async function DashboardPage() {
 *   const user = await getServerUser();
 *   if (!user) redirect('/login');
 *   return <h1>Welcome, {user.telegramName}!</h1>;
 * }
 * ```
 */
export async function getServerUser(options?: {
  jwtSecret?: string;
  redirectTo?: string;
}): Promise<BondifyUser | null> {
  const proof = await getProofFromCookie();
  if (!proof) {
    if (options?.redirectTo) redirect(options.redirectTo);
    return null;
  }

  try {
    // Dynamically import the Node SDK to perform verification
    // @ts-ignore — @bondify/node types resolved at runtime in monorepo
    const { BondifyServer } = await import('@bondify/node').catch(() => ({ BondifyServer: null }));

    if (!BondifyServer) {
      console.warn('[Bondify] @bondify/node is not installed. Install it to enable server-side verification.');
      return null;
    }

    // Project webhook secret (whsec_…) from the Bondify dashboard — the
    // same secret that signs the proof JWT. Older env var names are kept
    // as a fallback.
    const secret = options?.jwtSecret
      ?? process.env.BONDIFY_WEBHOOK_SECRET
      ?? process.env.BONDIFY_JWT_SECRET
      ?? process.env.SERVER_SECRET;
    if (!secret) {
      console.error('[Bondify] BONDIFY_WEBHOOK_SECRET is not set in .env (whsec_… from the dashboard: Project → Settings → Webhook Secret)');
      return null;
    }

    const server = new BondifyServer({ jwtSecret: secret });
    // verifyProof() is async — always await it (see @bondify/node's docs).
    // As of @bondify/node v3, it already returns camelCase fields matching
    // BondifyUser, so no manual snake_case → camelCase mapping is needed here.
    const payload = await server.verifyProof(proof);

    return {
      telegramId:       payload.telegramId,
      telegramName:     payload.telegramName,
      telegramUsername: payload.telegramUsername ?? null,
      telegramPhone:    null,
      proof,
      confirmedAt:      payload.confirmedAt ?? 0,
    };
  } catch (e) {
    console.warn('[Bondify] getServerUser: proof verification failed:', e);
    if (options?.redirectTo) redirect(options.redirectTo);
    return null;
  }
}

// ─── requireAuth — protecting Server Components ──────────────────────────────
/**
 * Redirects if the user is not authenticated.
 * Use in Server Components and Route Handlers.
 *
 * @example
 * ```tsx
 * export default async function ProtectedPage() {
 *   const user = await requireAuth('/login');
 *   return <Dashboard user={user} />;
 * }
 * ```
 */
export async function requireAuth(
  redirectTo = '/login',
  jwtSecret?: string
): Promise<BondifyUser> {
  const user = await getServerUser({ jwtSecret, redirectTo });
  if (!user) {
    redirect(redirectTo);
    throw new Error('unreachable'); // redirect() never returns in Next.js
  }
  return user;
}
