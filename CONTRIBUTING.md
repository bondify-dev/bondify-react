# Contributing to @bondify/react

Thanks for taking the time to contribute!

## Setup

```bash
git clone https://github.com/bondify-dev/bondify-react.git
cd bondify-react
npm install
```

`next`, `react`, and `react-dom` are dev dependencies so that typechecking
and building work out of the box — they stay optional peer dependencies for
consumers of the published package.

## Development

```bash
npm run dev        # tsup --watch
npm run typecheck   # tsc --noEmit
npm run build       # production build → dist/
```

## Before opening a PR

- [ ] `npm run typecheck` passes with no errors
- [ ] `npm run build` succeeds
- [ ] No `console.log` left over from debugging
- [ ] Public API changes are reflected in `README.md`
- [ ] Breaking changes are called out in `CHANGELOG.md`
- [ ] Components stay framework-agnostic where possible — anything Next.js
      specific belongs in `src/server.ts`, not `src/index.ts`

## Commit messages

Use [Conventional Commits](https://www.conventionalcommits.org/) where
practical (`feat:`, `fix:`, `docs:`, `chore:`, …).

## Reporting security issues

Please **do not** open a public issue for security vulnerabilities. Email
security@bondify.dev instead.

## Code style

- TypeScript, strict mode — keep it that way.
- `'use client'` directives stay on every file that uses hooks or browser APIs.
- No new runtime dependencies without discussion. `qrcode` is optional by
  design — don't make it required.
