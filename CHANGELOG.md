# Changelog

All notable changes to `@bondify/react` will be documented in this file.

## 3.0.1 — Fewer re-renders, correct error codes, `mode` doc fix

**Fixed:**

- **`useBondifyActions()` now actually doesn't re-render on state changes.**
  Previously all hooks (`useBondifyUser`, `useBondifyStatus`,
  `useBondifyActions`, etc.) read from a single combined context, so *any*
  state update — including the once-a-second countdown tick during polling —
  re-rendered every consumer, regardless of which hook it called. The
  provider now exposes two separate contexts internally (state and actions);
  `useBondifyActions()` subscribes only to the actions one, which keeps a
  stable identity across the whole auth flow (implemented via a ref-based
  read of the latest status/session inside `startAuth`/`checkStatus`,
  instead of listing them as dependencies). `useBondifyAuth()` is unaffected
  — it still exposes both state and actions and re-renders as before. No
  public API changes.
- **The API client now reads the backend's machine-readable `code` field
  from error responses** instead of guessing the error code purely from the
  HTTP status. Several distinct failures share the same HTTP status (e.g.
  403 covers both `PUBLIC_ACCESS_DISABLED` and `PROJECT_INACTIVE` — see the
  REST API reference's Errors section), so status-only mapping could report
  the wrong `error.code` to `onError`. The status-based mapping is kept as a
  fallback for the rare response that omits `code`.
- **Fixed a stale doc comment on `BondifyConfig.mode`.** It described the
  non-default value as `"popup"`, but the actual type (and behavior) is
  `'redirect' | 'inline'` — there is no `'popup'` value. The comment now
  describes what `'inline'` actually does.
- **Polling no longer silently swallows definitive backend errors.**
  Previously, *any* error during a polling tick (network failure, project
  not found, project inactive, public access disabled, rate limited, …) was
  caught and just logged with `console.warn`, and polling continued
  indefinitely. Now only actual `NETWORK_ERROR`s are retried silently — any
  other error code (which means the backend gave a definitive answer, not a
  transient connectivity blip) stops polling and calls `onError`, so your
  app can actually react to it instead of the sign-in flow hanging forever
  with no feedback.

**Added:**

- **`getServerUser()` (`@bondify/react/server`) now returns the real
  `telegramPhone`** instead of hardcoding it to `null`. This requires
  `@bondify/node@^3.0.2`, which is where `verifyProof()` started returning
  this field — client-side (`useBondifyUser()`) and server-side
  (`getServerUser()`) `BondifyUser` shapes are now consistent for
  Pro/Business one-tap phone sign-ins.

## 3.0.0-patch — Fixed misleading `saveProofCookie` example

**Fixed:**

- **The JSDoc example for `saveProofCookie` showed an incorrect usage
  pattern.** It imported and called `saveProofCookie` directly inside a file
  labeled `'use client'`. Since `@bondify/react/server` enforces its
  server-only requirement at build time (via the `server-only` package,
  shipped in 3.0.0), a Client Component that imports anything from this
  module fails the build. The example now correctly shows wrapping
  `saveProofCookie` in its own Server Action module (`'use server'`, no
  `'use client'` anywhere in the import chain) and calling that module from
  the Client Component instead. No source behavior changed — this is a
  documentation-only fix to the in-code example.

## 3.0.0 — server-only guard, @bondify/node v3 peer

**Breaking changes:**

- **Peer/dev dependency `@bondify/node` bumped to `^3.0.0`.** `@bondify/node`
  v3 makes `verifyProof()` async and renames its returned fields to camelCase
  (see that package's changelog). `getServerUser()` and `requireAuth()` in
  this package have been updated internally to match — no change needed in
  your app code, since `BondifyUser` here was already camelCase.

**Fixes / hardening:**

- **`@bondify/react/server` now imports the `server-only` package as a real
  build-time guard**, not just a code comment. Previously, importing
  `saveProofCookie` / `requireAuth` / `getServerUser` from a Client Component
  produced a confusing runtime error from `next/headers`
  ("headers was called outside a request scope") deep in the render tree.
  Now Next.js fails the build immediately with a clear message pointing at
  the offending import. This was the most common cause of "the server helpers
  don't work" reports — they were being imported into Client Components.

### Migration

```bash
npm i @bondify/react@^3.0.0 @bondify/node@^3.0.0
```

No code changes are required in your app. If your build now fails with an
error mentioning `server-only`, it means `@bondify/react/server` was being
imported from a Client Component (a file with `'use client'`, or a module
only reachable from one) — move that import into a Server Component, Route
Handler, or Server Action.

### A note on 1.x and 2.x

`@bondify/react@1.x` is deprecated and unsupported. Upgrade straight to `3.x`.

---

> **The entries below (`2.x`, `1.x`) are kept as a historical record.
> All 1.x and 2.x releases are deprecated — install `@bondify/react@^3.0.0`.**

## 2.1.1 *(deprecated)*

- Internal release. No public API changes.

## 2.1.0 — Node.js ≥ 18 & Next.js 16+ support *(deprecated)*

- **Next.js 16 support: peer `next` widened to
  `^14.2.0 || ^15.0.0 || ^16.0.0`.**
- **React 19 ready (shipped by Next 16):** peer `react`/`react-dom` stay
  `>=18.0.0` (already allow 19). The SDK uses no APIs removed in React 19 — no
  `forwardRef`-only patterns, `defaultProps` on function components,
  `propTypes`, string refs, or `ReactDOM.render`; every `useRef` already passes
  an initial value; server helpers already `await cookies()` (required since
  Next 15). No source changes were required for React 19 / Next 16.
- **`engines.node` set to `>=18`.**

## 2.0.0 *(deprecated)*

- Initial public release: `BondifyProvider`, `BondifyButton`, `BondifyModal`,
  `BondifyQR`, the `useBondifyAuth` hooks, and `@bondify/react/server` helpers
  for the Next.js App Router.
