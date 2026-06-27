// ============================================================
//  @bondify/react — Public API
//  Single export point for the React SDK
// ============================================================

// Provider
export { BondifyProvider }         from './context/BondifyProvider';
export type { BondifyProviderProps } from './context/BondifyProvider';

// Hooks
export {
  useBondifyAuth,
  useBondifyUser,
  useBondifyStatus,
  useBondifyError,
  useBondifySession,
  useBondifyActions,
  useIsAuthenticated,
} from './hooks';

// Components
export { BondifyButton } from './components/BondifyButton';
export { BondifyModal }  from './components/BondifyModal';
export { BondifyQR }     from './components/BondifyQR';

// Types
export type {
  BondifyConfig,
  BondifyUser,
  AuthState,
  AuthStatus,
  BondifyError,
  BondifyErrorCode,
  BondifyButtonProps,
  BondifyModalProps,
  BondifyQRProps,
  UseBondifyAuthReturn,
} from './types';

// API Client (for advanced use-cases)
export { BondifyAPIClient } from './utils/api-client';
