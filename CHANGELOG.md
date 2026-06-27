# Changelog

All notable changes to `@bondify/react` will be documented in this file.

## 2.1.0 — Node.js > 14 & Next.js 16+ support

- **Next.js 16 support: peer `next` widened to
  `^14.2.0 || ^15.0.0 || ^16.0.0`.**
- **React 19 ready (shipped by Next 16):** peer `react`/`react-dom` stay
  `>=18.0.0` (already allow 19). The SDK uses no APIs removed in React 19 — no
  `forwardRef`-only patterns, `defaultProps` on function components,
  `propTypes`, string refs, or `ReactDOM.render`; every `useRef` already passes
  an initial value; server helpers already `await cookies()` (required since
  Next 15). No source changes were required for React 19 / Next 16.
- **`engines.node` set to `>=18`.**
- Bumped `@bondify/node` peer/dev dependency to `^2.1.0`.

### Migration

- Reinstall after upgrading Next.js: `npm i @bondify/react@^2.1.0 @bondify/node@^2.1.0`.
- No code changes are needed in your app.

## 2.0.0

- Initial public release: `BondifyProvider`, `BondifyButton`, `BondifyModal`,
  `BondifyQR`, the `useBondify*` hooks, and `@bondify/react/server` helpers
  for the Next.js App Router.
