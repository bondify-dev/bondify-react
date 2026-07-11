// ============================================================
//  @bondify/react — Hooks
//  useBondifyAuth, useBondifyUser, useBondifyStatus
// ============================================================

'use client';

import { useBondifyContext, useBondifyState, useBondifyActionsContext } from '../context/BondifyProvider';
import type {
  AuthState,
  AuthStatus,
  BondifyUser,
  BondifyError,
  UseBondifyAuthReturn,
} from '../types';

// ─── Main hook — full access to state and actions ────────────────────────────
/**
 * The primary hook for managing Bondify authentication.
 *
 * @example
 * ```tsx
 * const { startAuth, status, user, deeplink } = useBondifyAuth();
 *
 * return (
 *   <>
 *     <button onClick={startAuth}>Log in with Telegram</button>
 *     {status === 'confirmed' && <p>Welcome, {user?.telegramName}!</p>}
 *   </>
 * );
 * ```
 */
export function useBondifyAuth(): UseBondifyAuthReturn {
  const {
    status, user, error, sessionToken,
    deeplink, expiresAt, secondsLeft,
    startAuth, reset, checkStatus,
  } = useBondifyContext();

  return {
    status,
    user,
    error,
    sessionToken,
    deeplink,
    expiresAt,
    secondsLeft,
    startAuth,
    reset,
    checkStatus,
  };
}

// ─── User-data-only hook ──────────────────────────────────────────────────────
/**
 * Returns the authenticated user, or null.
 *
 * @example
 * ```tsx
 * const user = useBondifyUser();
 * if (!user) return <LoginButton />;
 * return <p>Telegram ID: {user.telegramId}</p>;
 * ```
 */
export function useBondifyUser(): BondifyUser | null {
  return useBondifyState().user;
}

// ─── Status-only hook ─────────────────────────────────────────────────────────
/**
 * Returns the current auth status.
 * Handy for conditional rendering without extra re-renders.
 */
export function useBondifyStatus(): AuthStatus {
  return useBondifyState().status;
}

// ─── Error hook ────────────────────────────────────────────────────────────────
/**
 * Returns the current auth error, or null.
 */
export function useBondifyError(): BondifyError | null {
  return useBondifyState().error;
}

// ─── Session deeplink + timer hook ────────────────────────────────────────────
/**
 * Returns the deeplink for the QR/button and a countdown timer.
 *
 * @example
 * ```tsx
 * const { deeplink, secondsLeft } = useBondifySession();
 * return <BondifyQR />;
 * ```
 */
export function useBondifySession(): {
  deeplink: string | null;
  sessionToken: string | null;
  expiresAt: number | null;
  secondsLeft: number | null;
} {
  const { deeplink, sessionToken, expiresAt, secondsLeft } = useBondifyState();
  return { deeplink, sessionToken, expiresAt, secondsLeft };
}

// ─── Actions-only hook (no state subscription) ────────────────────────────────
/**
 * Actions only: startAuth, reset, checkStatus.
 * Doesn't trigger a re-render on status changes — ideal for a trigger button.
 */
export function useBondifyActions(): {
  startAuth: () => Promise<void>;
  reset: () => void;
  checkStatus: () => Promise<void>;
} {
  const { startAuth, reset, checkStatus } = useBondifyActionsContext();
  return { startAuth, reset, checkStatus };
}

// ─── Derived hook: isAuthenticated ────────────────────────────────────────────
/**
 * Simple boolean check: is the user authenticated.
 */
export function useIsAuthenticated(): boolean {
  return useBondifyState().status === 'confirmed';
}
