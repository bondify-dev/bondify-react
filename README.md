# @bondify/react — Telegram Login SDK for React & Next.js

[![npm version](https://img.shields.io/npm/v/@bondify/react.svg)](https://www.npmjs.com/package/@bondify/react)
[![license](https://img.shields.io/npm/l/@bondify/react.svg)](./LICENSE)

A **Telegram authentication (Telegram Login / Telegram OAuth) SDK** for
React and Next.js — by [Bondify](https://bondify.dev). Drop-in components,
hooks, and Next.js App Router helpers: no SMS, no passwords, your users tap
a button and confirm in Telegram.

- `<BondifyProvider>` — global context + polling, Clerk-style
- `<BondifyButton>`, `<BondifyModal>`, `<BondifyQR>` — drop-in UI
- `useBondifyAuth`, `useBondifyUser`, `useBondifyStatus`, `useBondifySession`, `useIsAuthenticated`
- Next.js Server Components / Server Actions support (`@bondify/react/server`)
- Works in plain React (Vite, CRA) and Next.js 14/15/16

---

## Installation

```bash
npm install @bondify/react
# optional, for a real QR code instead of the fallback button:
npm install qrcode
```

## Quick start

### 1. Wrap your app

```tsx
// app/layout.tsx
import { BondifyProvider } from '@bondify/react';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html>
      <body>
        <BondifyProvider
          config={{
            projectId: 'proj_xxxxxxxxxxxxxx',
            apiUrl: 'https://api.bondify.dev',
            pollingInterval: 1500,
            onSuccess: (user) => console.log('Signed in:', user.telegramName),
            onError: (err) => console.error('Auth error:', err.message),
          }}
        >
          {children}
        </BondifyProvider>
      </body>
    </html>
  );
}
```

### 2. Drop in a component

```tsx
import { BondifyButton, BondifyModal, BondifyQR } from '@bondify/react';

<BondifyButton label="Login with Telegram" theme="telegram" />

<BondifyModal title="Sign in" description="Scan the QR code or open Telegram" />

<BondifyQR size={200} showLink />
```

### 3. Or use the hooks directly

```tsx
import { useBondifyAuth } from '@bondify/react';

function LoginPage() {
  const { startAuth, status, user, deeplink, secondsLeft, error } = useBondifyAuth();

  return (
    <div>
      <button onClick={startAuth} disabled={status === 'polling'}>
        {status === 'polling' ? `Waiting… (${secondsLeft}s)` : 'Login'}
      </button>

      {status === 'polling' && deeplink && <a href={deeplink}>Open Telegram</a>}
      {status === 'confirmed' && <p>Welcome, {user!.telegramName}!</p>}
      {status === 'error' && <p style={{ color: 'red' }}>{error!.message}</p>}
    </div>
  );
}
```

---

## Next.js Server Components (SSR)

```tsx
// app/dashboard/page.tsx — Server Component
import { requireAuth } from '@bondify/react/server';

export default async function DashboardPage() {
  const user = await requireAuth('/login'); // redirects automatically if unauthenticated
  return <h1>Welcome, {user.telegramName}!</h1>;
}
```

```tsx
// app/login/page.tsx — Client Component
'use client';
import { BondifyButton } from '@bondify/react';
import { saveProofCookie } from '@bondify/react/server';

export default function LoginPage() {
  return (
    <BondifyButton
      onSuccess={async (user) => {
        await saveProofCookie(user.proof); // Server Action
        router.push('/dashboard');
      }}
    />
  );
}
```

`getServerUser` / `requireAuth` verify the proof locally using `@bondify/node`
(install it alongside this package for server-side verification — see below).

---

## API reference

### `<BondifyProvider config={...}>`

| Config field      | Type                          | Default                       | Description                                  |
| ------------------ | ------------------------------ | ------------------------------ | --------------------------------------------- |
| `projectId`         | `string`                       | —                               | Your Bondify project ID (required).            |
| `apiUrl`            | `string`                       | `https://api.bondify.dev`      | Bondify API base URL.                          |
| `mode`              | `'redirect' \| 'inline'`       | `'redirect'`                   | `redirect` opens Telegram in a new tab on `startAuth()`. |
| `pollingInterval`   | `number` (ms)                  | `1500`                         | How often to poll for confirmation.            |
| `pollingTimeout`    | `number` (ms)                  | `120000`                       | Give up after this long.                       |
| `onSuccess`         | `(user: BondifyUser) => void`  | —                               | Called once the user confirms in Telegram.     |
| `onError`           | `(error: BondifyError) => void`| —                               | Called on any auth error.                      |
| `onCancel`          | `() => void`                   | —                               | Called if the user cancels in the bot.         |

### Hooks

| Hook                  | Returns                                                          |
| ---------------------- | ------------------------------------------------------------------ |
| `useBondifyAuth()`      | Full state + actions (`status`, `user`, `error`, `startAuth`, …).   |
| `useBondifyUser()`      | `BondifyUser \| null`.                                              |
| `useBondifyStatus()`    | `AuthStatus` only — avoids re-renders on unrelated state changes.   |
| `useBondifyError()`     | `BondifyError \| null`.                                             |
| `useBondifySession()`   | `{ deeplink, sessionToken, expiresAt, secondsLeft }`.                |
| `useBondifyActions()`   | `{ startAuth, reset, checkStatus }` only — no state subscription.    |
| `useIsAuthenticated()`  | `boolean`.                                                          |

### Components

| Component         | Key props                                                  |
| ------------------- | ------------------------------------------------------------- |
| `<BondifyButton>`   | `label`, `showIcon`, `size` (`sm`/`md`/`lg`), `theme` (`telegram`/`dark`/`light`/`custom`) |
| `<BondifyModal>`    | `open`, `onOpenChange`, `title`, `description`                |
| `<BondifyQR>`       | `size`, `showLink` — renders a real QR if `qrcode` is installed, otherwise a styled fallback button |

### `@bondify/react/server`

| Export                 | Description                                                         |
| ------------------------ | ----------------------------------------------------------------------- |
| `saveProofCookie(proof)`  | Server Action — stores the proof in an `httpOnly` cookie.                |
| `clearProofCookie()`      | Server Action — clears it (logout).                                      |
| `getProofFromCookie()`    | Reads the raw proof from the cookie.                                     |
| `getServerUser(options?)` | Verifies the cookie's proof and returns `BondifyUser \| null`.            |
| `requireAuth(redirectTo?, jwtSecret?)` | Like `getServerUser`, but redirects (and never returns `null`).  |

`getServerUser` / `requireAuth` read the secret from `BONDIFY_WEBHOOK_SECRET`,
falling back to `BONDIFY_JWT_SECRET`, then `SERVER_SECRET`, in that order — or
pass `jwtSecret` explicitly.

---

## Environment variables

```env
# .env.local
NEXT_PUBLIC_BONDIFY_PROJECT_ID=proj_xxxxxxxxxxxxxx
BONDIFY_WEBHOOK_SECRET=whsec_...    # from your Bondify dashboard, used by @bondify/react/server
```

---

## Requirements

- React `>=18` (React 19 / Next.js 16 ready — no source changes needed)
- Next.js `^14.2.0 || ^15.0.0 || ^16.0.0` (optional — only needed for `@bondify/react/server`)
- `@bondify/node` `^2.1.0` (optional — only needed for `@bondify/react/server`)
- `qrcode` (optional — only needed for `<BondifyQR>` to render a real QR code instead of the fallback button)

## Related packages

- [`@bondify/node`](https://github.com/bondify-dev/bondify-node) — Node.js / Express / Next.js backend SDK
- [`bondify_flutter`](https://github.com/bondify-dev/bondify-flutter) — Flutter SDK

## Why Bondify?

If you're searching for *"Telegram login for React"*, *"Telegram login
button Next.js"*, or *"Telegram OAuth alternative"* — this is it. Bondify
replaces the classic Telegram Login Widget with a QR/deeplink flow that
works the same in plain React and in the Next.js App Router, with a typed
SDK instead of a `<script>` tag and manual hash verification.

## Contributing

Issues and pull requests are welcome — see [CONTRIBUTING.md](./CONTRIBUTING.md).

## License

MIT © Bondify
