# AIcrow Cabinet

User cabinet application built with Next.js App Router, TypeScript, and `next-intl`.

## Quick Start (2 minutes)

### Prerequisites

- Node.js `20.18.x`
- Yarn `1.22.x`

### Install

```bash
yarn
```

### Environment

Use one of these options:

- `.env.dev` for local development via `yarn dev`
- `.env.prod` for local production-like run via `yarn prod`

Public baseline keys are documented in `env.example`:

- `NEXT_PUBLIC_API_URL`
- `API_BASE_URL`

### Run

```bash
yarn dev
```

Open [http://localhost:3000](http://localhost:3000).

## Common Commands

- `yarn dev` - run local dev with `.env.dev`
- `yarn prod` - run local dev with `.env.prod`
- `yarn test` - run unit tests (Vitest)
- `yarn lint:check` - run ESLint checks
- `yarn verify:ci` - lint + tests + build
- `yarn build` - production build

## Project Structure

- `app/[locale]/...` - localized pages
- `app/api/...` - route handlers
- `components/` - feature and UI components
- `lib/` - auth, API clients, shared helpers
- `messages/` - locale dictionaries
- `test/unit/` - unit tests

## Notes

- Keep translation keys synchronized across all locale files in `messages/`.
- Prefer reusing existing `lib/api*.ts` clients and `components/ui` primitives.
