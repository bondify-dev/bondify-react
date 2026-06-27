// ============================================================
//  @bondify/react — BondifyModal
//  Ready-made modal with QR code and auth statuses
// ============================================================

'use client';

import React, { useCallback, useEffect } from 'react';
import { useBondifyAuth, useBondifyActions } from '../hooks';
import { BondifyQR } from './BondifyQR';
import type { BondifyModalProps } from '../types';

export function BondifyModal({
  open,
  onOpenChange,
  title       = 'Log in with Telegram',
  description = 'Scan the QR code or tap the link in Telegram',
  className,
}: BondifyModalProps) {
  const { status, user, error, secondsLeft, deeplink, startAuth } = useBondifyAuth();
  const { reset } = useBondifyActions();

  const isOpen = open ?? (status === 'polling' || status === 'pending');

  const handleClose = useCallback(() => {
    reset();
    onOpenChange?.(false);
  }, [reset, onOpenChange]);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, handleClose]);

  // Lock body scroll while open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!isOpen && status !== 'confirmed' && status !== 'error') return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      style={overlayStyle}
      onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}
    >
      <div style={panelStyle} className={className}>
        {/* Header */}
        <div style={headerStyle}>
          <div>
            <h2 style={titleStyle}>{title}</h2>
            {status === 'polling' && (
              <p style={descStyle}>{description}</p>
            )}
          </div>
          <button
            onClick={handleClose}
            style={closeButtonStyle}
            aria-label="Close"
            type="button"
          >
            <CloseIcon />
          </button>
        </div>

        {/* Body */}
        <div style={bodyStyle}>
          {/* Waiting for confirmation */}
          {(status === 'polling' || status === 'pending') && (
            <>
              <BondifyQR size={200} showLink />
              {secondsLeft !== null && (
                <p style={timerStyle}>
                  Link valid for{' '}
                  <strong>{formatSeconds(secondsLeft)}</strong>
                </p>
              )}
              <p style={hintStyle}>
                Open Telegram and tap <strong>"Log in"</strong> in the bot
              </p>
            </>
          )}

          {/* Success */}
          {status === 'confirmed' && user && (
            <div style={successStyle}>
              <div style={successIconStyle}>✅</div>
              <p style={successTitleStyle}>Signed in!</p>
              <p style={successNameStyle}>
                {user.telegramName}
                {user.telegramUsername && (
                  <span style={{ color: '#8e8e93' }}> @{user.telegramUsername}</span>
                )}
              </p>
              <button
                onClick={handleClose}
                style={primaryButtonStyle}
                type="button"
              >
                Continue
              </button>
            </div>
          )}

          {/* Error / expired */}
          {(status === 'error' || status === 'expired' || status === 'cancelled') && (
            <div style={errorStyle}>
              <div style={errorIconStyle}>
                {status === 'cancelled' ? '🚫' : '⏰'}
              </div>
              <p style={errorTitleStyle}>
                {status === 'cancelled' ? 'Sign-in cancelled' : 'Link expired'}
              </p>
              {error && <p style={errorMsgStyle}>{error.message}</p>}
              <button
                onClick={startAuth}
                style={primaryButtonStyle}
                type="button"
              >
                Try again
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Utilities ─────────────────────────────────────────────────────────────────
function formatSeconds(s: number): string {
  const m = Math.floor(s / 60);
  const r = s % 60;
  return m > 0 ? `${m}:${String(r).padStart(2, '0')}` : `${r}s`;
}

function CloseIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────────
const overlayStyle: React.CSSProperties = {
  position:        'fixed',
  inset:           0,
  background:      'rgba(0,0,0,0.5)',
  backdropFilter:  'blur(4px)',
  display:         'flex',
  alignItems:      'center',
  justifyContent:  'center',
  zIndex:          9999,
  padding:         '16px',
};

const panelStyle: React.CSSProperties = {
  background:   '#ffffff',
  borderRadius: '16px',
  width:        '100%',
  maxWidth:     '400px',
  boxShadow:    '0 20px 60px rgba(0,0,0,0.3)',
  overflow:     'hidden',
};

const headerStyle: React.CSSProperties = {
  display:        'flex',
  alignItems:     'flex-start',
  justifyContent: 'space-between',
  padding:        '20px 20px 0',
};

const titleStyle: React.CSSProperties = {
  margin:     0,
  fontSize:   '18px',
  fontWeight: 700,
  color:      '#1c1c1e',
};

const descStyle: React.CSSProperties = {
  margin:    '4px 0 0',
  fontSize:  '13px',
  color:     '#8e8e93',
};

const closeButtonStyle: React.CSSProperties = {
  background:   'transparent',
  border:       'none',
  cursor:       'pointer',
  padding:      '4px',
  color:        '#8e8e93',
  borderRadius: '6px',
  display:      'flex',
  alignItems:   'center',
};

const bodyStyle: React.CSSProperties = {
  padding:   '20px',
  textAlign: 'center',
};

const timerStyle: React.CSSProperties = {
  fontSize: '13px',
  color:    '#8e8e93',
  margin:   '12px 0 0',
};

const hintStyle: React.CSSProperties = {
  fontSize: '13px',
  color:    '#636366',
  margin:   '8px 0 0',
};

const successStyle: React.CSSProperties = {
  padding: '16px 0',
};

const successIconStyle: React.CSSProperties = {
  fontSize:     '48px',
  marginBottom: '12px',
};

const successTitleStyle: React.CSSProperties = {
  fontSize:   '20px',
  fontWeight: 700,
  color:      '#1c1c1e',
  margin:     '0 0 4px',
};

const successNameStyle: React.CSSProperties = {
  fontSize: '15px',
  color:    '#1c1c1e',
  margin:   '0 0 20px',
};

const primaryButtonStyle: React.CSSProperties = {
  background:   '#2AABEE',
  color:        '#ffffff',
  border:       'none',
  borderRadius: '10px',
  padding:      '12px 28px',
  fontSize:     '15px',
  fontWeight:   600,
  cursor:       'pointer',
  width:        '100%',
};

const errorStyle: React.CSSProperties = {
  padding: '16px 0',
};

const errorIconStyle: React.CSSProperties = {
  fontSize:     '48px',
  marginBottom: '12px',
};

const errorTitleStyle: React.CSSProperties = {
  fontSize:   '18px',
  fontWeight: 700,
  color:      '#1c1c1e',
  margin:     '0 0 8px',
};

const errorMsgStyle: React.CSSProperties = {
  fontSize:     '13px',
  color:        '#ff3b30',
  margin:       '0 0 16px',
};
