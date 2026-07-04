# Changelog

All notable changes to `@bondify/react` will be documented in this file.

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
