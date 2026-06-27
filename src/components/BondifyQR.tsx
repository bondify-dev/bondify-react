// ============================================================
//  @bondify/react — BondifyQR
//  QR code for sign-in (no external dependencies required)
// ============================================================

'use client';

import React, { useEffect, useState } from 'react';
import { useBondifySession, useBondifyStatus } from '../hooks';
import type { BondifyQRProps } from '../types';

// Dynamically load qrcode.js only when a deeplink is available.
// If the package isn't installed, fall back to a deeplink button.
async function generateQRDataUrl(text: string, size: number): Promise<string | null> {
  try {
    // Try to import qrcode (optional dependency)
    const QRCode = await import('qrcode').catch(() => null);
    if (!QRCode) return null;
    return await QRCode.default.toDataURL(text, {
      width:        size,
      margin:       2,
      color: { dark: '#000000', light: '#ffffff' },
      errorCorrectionLevel: 'M',
    });
  } catch {
    return null;
  }
}

export function BondifyQR({ size = 200, showLink = true, className }: BondifyQRProps) {
  const { deeplink }        = useBondifySession();
  const status              = useBondifyStatus();
  const [qrDataUrl, setQr]  = useState<string | null>(null);
  const [loading, setLoad]  = useState(false);

  useEffect(() => {
    if (!deeplink) return;
    setLoad(true);
    generateQRDataUrl(deeplink, size).then(url => {
      setQr(url);
      setLoad(false);
    });
  }, [deeplink, size]);

  if (!deeplink) {
    return (
      <div style={placeholderStyle(size)} className={className}>
        <span style={{ color: '#8e8e93', fontSize: '13px' }}>
          {status === 'idle' ? 'Start sign-in to continue' : 'Creating session…'}
        </span>
      </div>
    );
  }

  return (
    <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }} className={className}>
      {loading ? (
        <div style={placeholderStyle(size)}>
          <QRLoadingSpinner size={size} />
        </div>
      ) : qrDataUrl ? (
        <a
          href={deeplink}
          target="_blank"
          rel="noopener noreferrer"
          title="Open in Telegram"
          style={{ display: 'block', lineHeight: 0 }}
        >
          <img
            src={qrDataUrl}
            alt="QR code to sign in with Telegram"
            width={size}
            height={size}
            style={{ borderRadius: '8px', display: 'block' }}
          />
        </a>
      ) : (
        // Fallback: a nice button when qrcode isn't installed
        <TelegramFallbackButton deeplink={deeplink} size={size} />
      )}

      {showLink && (
        <a
          href={deeplink}
          target="_blank"
          rel="noopener noreferrer"
          style={linkStyle}
        >
          Open in Telegram →
        </a>
      )}
    </div>
  );
}

// ─── Fallback button (used when qrcode isn't installed) ──────────────────────
function TelegramFallbackButton({ deeplink, size }: { deeplink: string; size: number }) {
  return (
    <a
      href={deeplink}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        display:         'flex',
        alignItems:      'center',
        justifyContent:  'center',
        width:           size,
        height:          size,
        background:      '#2AABEE',
        borderRadius:    '12px',
        color:           '#ffffff',
        textDecoration:  'none',
        flexDirection:   'column',
        gap:             '10px',
        fontSize:        '14px',
        fontWeight:      600,
      }}
    >
      <TelegramLogo size={48} />
      <span>Open Telegram</span>
    </a>
  );
}

function TelegramLogo({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="white">
      <path d="M11.944 0A12 12 0 1 0 24 12 12 12 0 0 0 11.944 0Zm5.48 7.22-2.36 11.12c-.18.82-.66 1.02-1.34.64l-3.6-2.65-1.74 1.68c-.2.2-.36.36-.72.36l.26-3.6 6.6-5.96c.28-.26-.06-.4-.44-.14l-8.16 5.14-3.52-1.1c-.76-.24-.78-.76.16-1.12L17.1 6.18c.64-.22 1.2.16.98 1.04Z" />
    </svg>
  );
}

function QRLoadingSpinner({ size }: { size: number }) {
  return (
    <svg
      width={size * 0.3}
      height={size * 0.3}
      viewBox="0 0 24 24"
      fill="none"
      stroke="#2AABEE"
      strokeWidth={2}
      style={{ animation: 'bondify-spin 0.8s linear infinite' }}
    >
      <style>{`@keyframes bondify-spin { to { transform: rotate(360deg); } }`}</style>
      <circle cx="12" cy="12" r="10" strokeOpacity={0.25} />
      <path d="M12 2a10 10 0 0 1 10 10" />
    </svg>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────────
const placeholderStyle = (size: number): React.CSSProperties => ({
  width:           size,
  height:          size,
  background:      '#f2f2f7',
  borderRadius:    '8px',
  display:         'flex',
  alignItems:      'center',
  justifyContent:  'center',
});

const linkStyle: React.CSSProperties = {
  fontSize:       '13px',
  color:          '#2AABEE',
  textDecoration: 'none',
  fontWeight:     500,
};
