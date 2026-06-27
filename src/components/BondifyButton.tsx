// ============================================================
//  @bondify/react — BondifyButton
//  Drop-in "Log in with Telegram" button
// ============================================================

'use client';

import React from 'react';
import { useBondifyActions, useBondifyStatus } from '../hooks';
import type { BondifyButtonProps } from '../types';

const TelegramIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="currentColor"
    aria-hidden="true"
    style={{ flexShrink: 0 }}
  >
    <path d="M11.944 0A12 12 0 1 0 24 12 12 12 0 0 0 11.944 0Zm5.48 7.22-2.36 11.12c-.18.82-.66 1.02-1.34.64l-3.6-2.65-1.74 1.68c-.2.2-.36.36-.72.36l.26-3.6 6.6-5.96c.28-.26-.06-.4-.44-.14l-8.16 5.14-3.52-1.1c-.76-.24-.78-.76.16-1.12L17.1 6.18c.64-.22 1.2.16.98 1.04Z" />
  </svg>
);

const SIZES = {
  sm: { padding: '6px 14px', fontSize: '13px', gap: '6px' },
  md: { padding: '10px 20px', fontSize: '15px', gap: '8px' },
  lg: { padding: '14px 28px', fontSize: '17px', gap: '10px' },
};

const THEMES: Record<string, React.CSSProperties> = {
  telegram: {
    background: '#2AABEE',
    color:      '#ffffff',
    border:     'none',
  },
  dark: {
    background: '#1c1c1e',
    color:      '#ffffff',
    border:     '1px solid #3a3a3c',
  },
  light: {
    background: '#ffffff',
    color:      '#1c1c1e',
    border:     '1px solid #e0e0e0',
  },
  custom: {},
};

export function BondifyButton({
  label     = 'Log in with Telegram',
  showIcon  = true,
  size      = 'md',
  theme     = 'telegram',
  className,
  disabled,
  style,
  ...rest
}: BondifyButtonProps) {
  const { startAuth }  = useBondifyActions();
  const status         = useBondifyStatus();

  const isLoading  = status === 'pending' || status === 'polling';
  const isDisabled = disabled || isLoading || status === 'confirmed';

  const sizeStyle  = SIZES[size];
  const themeStyle = THEMES[theme] ?? {};

  const baseStyle: React.CSSProperties = {
    display:        'inline-flex',
    alignItems:     'center',
    justifyContent: 'center',
    gap:            sizeStyle.gap,
    padding:        sizeStyle.padding,
    fontSize:       sizeStyle.fontSize,
    fontWeight:     600,
    lineHeight:     1.2,
    borderRadius:   '8px',
    cursor:         isDisabled ? 'not-allowed' : 'pointer',
    opacity:        isDisabled ? 0.6 : 1,
    transition:     'opacity 0.2s, transform 0.1s',
    userSelect:     'none',
    outline:        'none',
    ...themeStyle,
    ...style,
  };

  const handleClick = async () => {
    if (isDisabled) return;
    await startAuth();
  };

  const getLabel = () => {
    if (status === 'pending')   return 'Creating session…';
    if (status === 'polling')   return 'Waiting for confirmation…';
    if (status === 'confirmed') return '✅ Signed in';
    return label;
  };

  return (
    <button
      {...rest}
      type="button"
      className={className}
      style={baseStyle}
      disabled={isDisabled}
      onClick={handleClick}
      aria-label={getLabel()}
      aria-busy={isLoading}
    >
      {isLoading ? (
        <Spinner size={parseInt(sizeStyle.fontSize)} />
      ) : (
        showIcon && <TelegramIcon />
      )}
      <span>{getLabel()}</span>
    </button>
  );
}

function Spinner({ size = 16 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.5}
      aria-hidden="true"
      style={{
        animation: 'bondify-spin 0.8s linear infinite',
        flexShrink: 0,
      }}
    >
      <style>{`
        @keyframes bondify-spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
      <circle cx="12" cy="12" r="10" strokeOpacity={0.25} />
      <path d="M12 2a10 10 0 0 1 10 10" />
    </svg>
  );
}
