// ============================================================
//  @bondify/react — Types
//  Full type definitions for the Bondify React SDK
// ============================================================

export interface BondifyConfig {
  /** project_id from the Bondify dashboard */
  projectId: string;
  /** Backend base URL (default: https://api.bondify.dev) */
  apiUrl?: string;
  /** Auth mode: redirect (default) or popup */
  mode?: 'redirect' | 'inline';
  /** Polling interval in ms (default: 1500) */
  pollingInterval?: number;
  /** Polling timeout in ms (default: 120000) */
  pollingTimeout?: number;
  /** Callback after a successful sign-in */
  onSuccess?: (user: BondifyUser) => void;
  /** Callback on error */
  onError?: (error: BondifyError) => void;
  /** Callback on cancel */
  onCancel?: () => void;
}

export interface BondifyUser {
  telegramId: string;
  telegramName: string;
  telegramUsername: string | null;
  telegramPhone: string | null;
  /** JWT proof — a short-lived token (5 min) verified by the backend */
  proof: string;
  confirmedAt: number;
}

export type AuthStatus =
  | 'idle'
  | 'pending'
  | 'polling'
  | 'confirmed'
  | 'expired'
  | 'cancelled'
  | 'error';

export interface AuthState {
  status: AuthStatus;
  user: BondifyUser | null;
  error: BondifyError | null;
  sessionToken: string | null;
  deeplink: string | null;
  expiresAt: number | null;
  /** Remaining session time in seconds */
  secondsLeft: number | null;
}

export interface BondifyError {
  code: BondifyErrorCode;
  message: string;
  details?: unknown;
}

export type BondifyErrorCode =
  | 'SESSION_EXPIRED'
  | 'SESSION_CANCELLED'
  | 'NETWORK_ERROR'
  | 'PROJECT_NOT_FOUND'
  | 'PROJECT_INACTIVE'
  | 'PUBLIC_ACCESS_DISABLED'
  | 'RATE_LIMITED'
  | 'POLLING_TIMEOUT'
  | 'UNKNOWN_ERROR';

export interface GenerateResponse {
  deeplink: string;
  session_token: string;
  expires_at: number;
}

export interface VerifyResponse {
  status: 'pending' | 'confirmed' | 'expired' | 'cancelled' | 'used';
  telegram_id?: string;
  telegram_name?: string;
  telegram_username?: string | null;
  telegram_phone?: string | null;
  proof?: string;
  confirmed_at?: number;
  cancelled_at?: number | null;
}

// Component props
export interface BondifyButtonProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'onClick'> {
  /** Button text (default: "Log in with Telegram") */
  label?: string;
  /** Show the Telegram icon */
  showIcon?: boolean;
  /** Button size */
  size?: 'sm' | 'md' | 'lg';
  /** Color theme */
  theme?: 'telegram' | 'dark' | 'light' | 'custom';
  /** CSS class for style overrides */
  className?: string;
}

export interface BondifyModalProps {
  /** External visibility control */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Modal header content */
  title?: string;
  description?: string;
  className?: string;
}

export interface BondifyQRProps {
  /** QR size in pixels (default: 200) */
  size?: number;
  /** Show the deeplink as a link below the QR code */
  showLink?: boolean;
  className?: string;
}

export interface UseBondifyAuthReturn extends AuthState {
  /** Start an authentication session */
  startAuth: () => Promise<void>;
  /** Reset the state */
  reset: () => void;
  /** Force a status check */
  checkStatus: () => Promise<void>;
}
