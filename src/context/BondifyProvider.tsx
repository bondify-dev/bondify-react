// ============================================================
//  @bondify/react — BondifyProvider
//  Global context provider (Clerk-style)
// ============================================================

'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import { BondifyAPIClient } from '../utils/api-client';
import type {
  AuthState,
  AuthStatus,
  BondifyConfig,
  BondifyError,
  BondifyUser,
  UseBondifyAuthReturn,
} from '../types';

// ─── Constants ───────────────────────────────────────────────────────────────
const DEFAULT_API_URL        = 'https://api.bondify.dev';
const DEFAULT_POLLING_MS     = 1500;
const DEFAULT_TIMEOUT_MS     = 120_000;

// ─── Initial state ────────────────────────────────────────────────────────────
const INITIAL_STATE: AuthState = {
  status:       'idle',
  user:         null,
  error:        null,
  sessionToken: null,
  deeplink:     null,
  expiresAt:    null,
  secondsLeft:  null,
};

// ─── Contexts ────────────────────────────────────────────────────────────────
// State and actions are split into two contexts so that consumers who only
// need the actions (e.g. `useBondifyActions()`) don't re-subscribe to every
// state change (status transitions, the once-a-second countdown tick, etc).
// Only `startAuth` and `checkStatus` ever need to read the *current* state
// (to guard against e.g. double-starting a session); they do so via a ref
// rather than a dependency on `state`, so their identity — and this
// context's value — stays stable across state updates.
interface BondifyActionsContextValue extends Omit<UseBondifyAuthReturn, keyof AuthState> {
  config: Required<BondifyConfig>;
  client: BondifyAPIClient;
}

const BondifyStateContext   = createContext<AuthState | null>(null);
const BondifyActionsContext = createContext<BondifyActionsContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────
export interface BondifyProviderProps {
  config: BondifyConfig;
  children: React.ReactNode;
}

export function BondifyProvider({ config, children }: BondifyProviderProps) {
  const fullConfig = useMemo(
    (): Required<BondifyConfig> => ({
      projectId:       config.projectId,
      apiUrl:          config.apiUrl          ?? DEFAULT_API_URL,
      mode:            config.mode            ?? 'redirect',
      pollingInterval: config.pollingInterval ?? DEFAULT_POLLING_MS,
      pollingTimeout:  config.pollingTimeout  ?? DEFAULT_TIMEOUT_MS,
      onSuccess:       config.onSuccess       ?? (() => {}),
      onError:         config.onError         ?? (() => {}),
      onCancel:        config.onCancel        ?? (() => {}),
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [config.projectId, config.apiUrl, config.mode, config.pollingInterval, config.pollingTimeout]
  );

  const client = useMemo(
    () => new BondifyAPIClient(fullConfig.apiUrl, fullConfig.projectId),
    [fullConfig.apiUrl, fullConfig.projectId]
  );

  const [state, setState] = useState<AuthState>(INITIAL_STATE);

  // Always-current snapshot of `state`, read from inside stable callbacks
  // instead of putting `state` (or its fields) in their dependency arrays.
  // This is what keeps `startAuth` / `checkStatus` — and therefore the
  // Actions context value — from changing identity on every state update.
  const stateRef = useRef<AuthState>(state);
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const pollingTimer   = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeoutTimer   = useRef<ReturnType<typeof setTimeout>  | null>(null);
  const countdownTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const isMounted      = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
      clearAllTimers();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const clearAllTimers = useCallback(() => {
    if (pollingTimer.current)   { clearInterval(pollingTimer.current);   pollingTimer.current   = null; }
    if (timeoutTimer.current)   { clearTimeout(timeoutTimer.current);    timeoutTimer.current   = null; }
    if (countdownTimer.current) { clearInterval(countdownTimer.current); countdownTimer.current = null; }
  }, []);

  const setError = useCallback((error: BondifyError) => {
    clearAllTimers();
    if (!isMounted.current) return;
    setState(prev => ({ ...prev, status: 'error', error }));
    fullConfig.onError(error);
  }, [clearAllTimers, fullConfig]);

  // ── Polling ──────────────────────────────────────────────────────────────
  const startPolling = useCallback((sessionToken: string) => {
    if (!isMounted.current) return;

    // Session timeout
    timeoutTimer.current = setTimeout(() => {
      clearAllTimers();
      if (!isMounted.current) return;
      setState(prev => ({ ...prev, status: 'expired', secondsLeft: 0 }));
      setError({ code: 'POLLING_TIMEOUT', message: 'The session has timed out. Request a new link.' });
    }, fullConfig.pollingTimeout);

    // Polling
    pollingTimer.current = setInterval(async () => {
      if (!isMounted.current) return;
      try {
        const res = await client.verifySession(sessionToken);

        if (res.status === 'confirmed' || res.status === 'used') {
          clearAllTimers();
          const user: BondifyUser = {
            telegramId:       res.telegram_id!,
            telegramName:     res.telegram_name!,
            telegramUsername: res.telegram_username ?? null,
            telegramPhone:    res.telegram_phone    ?? null,
            proof:            res.proof!,
            confirmedAt:      res.confirmed_at ?? Date.now(),
          };
          if (!isMounted.current) return;
          setState(prev => ({ ...prev, status: 'confirmed', user, secondsLeft: null }));
          fullConfig.onSuccess(user);
        } else if (res.status === 'expired') {
          clearAllTimers();
          if (!isMounted.current) return;
          setState(prev => ({ ...prev, status: 'expired', secondsLeft: 0 }));
          setError({ code: 'SESSION_EXPIRED', message: 'The sign-in link has expired.' });
        } else if (res.status === 'cancelled') {
          clearAllTimers();
          if (!isMounted.current) return;
          setState(prev => ({ ...prev, status: 'cancelled' }));
          fullConfig.onCancel();
        }
        // status === 'pending' — keep polling
      } catch (e) {
        const code = (e as BondifyError)?.code;
        if (code === 'NETWORK_ERROR') {
          // Transient connectivity issue — keep polling silently, the
          // next tick will likely succeed.
          console.warn('[Bondify] Polling network error (retrying):', e);
          return;
        }
        // Any other code (PROJECT_NOT_FOUND, PROJECT_INACTIVE,
        // PUBLIC_ACCESS_DISABLED, RATE_LIMITED, …) is a definitive response
        // from the backend — retrying won't help, so stop polling and
        // surface it via onError instead of spinning silently forever.
        setError(e as BondifyError);
      }
    }, fullConfig.pollingInterval);
  }, [client, fullConfig, clearAllTimers, setError]);

  // ── Countdown timer ──────────────────────────────────────────────────────
  const startCountdown = useCallback((expiresAt: number) => {
    const tick = () => {
      if (!isMounted.current) return;
      const left = Math.max(0, Math.floor((expiresAt - Date.now()) / 1000));
      setState(prev => ({ ...prev, secondsLeft: left }));
    };
    tick();
    countdownTimer.current = setInterval(tick, 1000);
  }, []);

  // ── Starting authentication ──────────────────────────────────────────────
  const startAuth = useCallback(async () => {
    // Read the current status via ref rather than depending on `state.status`
    // directly — this keeps `startAuth`'s identity stable across state
    // updates, which in turn keeps the Actions context value stable.
    if (stateRef.current.status === 'polling' || stateRef.current.status === 'pending') return;
    clearAllTimers();
    setState({ ...INITIAL_STATE, status: 'pending' });

    try {
      const res = await client.generateSession();
      if (!isMounted.current) return;

      setState(prev => ({
        ...prev,
        status:       'polling',
        sessionToken: res.session_token,
        deeplink:     res.deeplink,
        expiresAt:    res.expires_at,
        error:        null,
      }));

      startCountdown(res.expires_at);
      startPolling(res.session_token);

      // Redirect / popup
      if (fullConfig.mode === 'redirect') {
        window.open(res.deeplink, '_blank', 'noopener,noreferrer');
      }
    } catch (e) {
      setError(e as BondifyError);
    }
  }, [client, fullConfig.mode, clearAllTimers, startPolling, startCountdown, setError]);

  // ── Manual status check ──────────────────────────────────────────────────
  const checkStatus = useCallback(async () => {
    // Same ref-read rationale as `startAuth` above.
    const sessionToken = stateRef.current.sessionToken;
    if (!sessionToken) return;
    try {
      const res = await client.verifySession(sessionToken);
      if (res.status === 'confirmed' || res.status === 'used') {
        clearAllTimers();
        const user: BondifyUser = {
          telegramId:       res.telegram_id!,
          telegramName:     res.telegram_name!,
          telegramUsername: res.telegram_username ?? null,
          telegramPhone:    res.telegram_phone    ?? null,
          proof:            res.proof!,
          confirmedAt:      res.confirmed_at ?? Date.now(),
        };
        setState(prev => ({ ...prev, status: 'confirmed', user }));
        fullConfig.onSuccess(user);
      }
    } catch (e) {
      console.warn('[Bondify] checkStatus error:', e);
    }
  }, [client, fullConfig, clearAllTimers]);

  // ── Reset ─────────────────────────────────────────────────────────────────
  const reset = useCallback(() => {
    clearAllTimers();
    setState(INITIAL_STATE);
  }, [clearAllTimers]);

  const actionsValue = useMemo<BondifyActionsContextValue>(
    () => ({
      startAuth,
      reset,
      checkStatus,
      config: fullConfig,
      client,
    }),
    [startAuth, reset, checkStatus, fullConfig, client]
  );

  return (
    <BondifyActionsContext.Provider value={actionsValue}>
      <BondifyStateContext.Provider value={state}>
        {children}
      </BondifyStateContext.Provider>
    </BondifyActionsContext.Provider>
  );
}

// ─── Context-access hooks ──────────────────────────────────────────────────────

/** State only — re-renders whenever any field of `AuthState` changes. */
export function useBondifyState(): AuthState {
  const ctx = useContext(BondifyStateContext);
  if (!ctx) {
    throw new Error(
      '[Bondify] useBondify* hooks must be used inside a <BondifyProvider>. ' +
      'Wrap your app: <BondifyProvider config={...}>...</BondifyProvider>'
    );
  }
  return ctx;
}

/**
 * Actions only — `startAuth`, `reset`, `checkStatus`, `config`, `client`.
 * These never change identity due to state/status updates, so a component
 * that only calls this hook will NOT re-render on status transitions or the
 * once-a-second countdown tick.
 */
export function useBondifyActionsContext(): BondifyActionsContextValue {
  const ctx = useContext(BondifyActionsContext);
  if (!ctx) {
    throw new Error(
      '[Bondify] useBondify* hooks must be used inside a <BondifyProvider>. ' +
      'Wrap your app: <BondifyProvider config={...}>...</BondifyProvider>'
    );
  }
  return ctx;
}

/**
 * Combined state + actions — this is what `useBondifyAuth()` uses. Re-renders
 * on both state changes and (rarely) actions/config changes. Prefer the
 * narrower hooks (`useBondifyState`/`useBondifyActionsContext`, or the
 * public `useBondifyUser` / `useBondifyActions` etc.) when you don't need
 * everything.
 */
export function useBondifyContext(): UseBondifyAuthReturn & {
  config: Required<BondifyConfig>;
  client: BondifyAPIClient;
} {
  const state   = useBondifyState();
  const actions = useBondifyActionsContext();
  return { ...state, ...actions };
}
