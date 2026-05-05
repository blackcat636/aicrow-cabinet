# AIcrow Cabinet Agent Guide

## Project Purpose

This repository contains the AIcrow user cabinet built with Next.js App Router.
Core domains are authentication, profile and integrations, subscription and balance,
and workflow management.

## Tech Stack

- Next.js 15 + React 18 + TypeScript
- `next-intl` for i18n routing and translations
- ESLint + Prettier for code quality
- Vitest for unit tests
- Cloudflare Pages build/deploy scripts

## Repository Map

- `app/`
  - `app/[locale]/...`: localized pages (dashboard, billing, profile, workflows)
  - `app/api/...`: server route handlers
- `components/`
  - `components/ui/`: shared UI primitives
  - feature folders: `auth`, `billing`, `balance`, `workflow`, `profile`, `admin`
- `lib/`
  - auth and token helpers (`auth.ts`, `auth-cookies.ts`)
  - API clients (`apiAuth.ts`, `apiWorkflow.ts`, `apiExternalServices.ts`, etc.)
  - middleware helpers (`middleware-auth-locale.ts`, `security-response-headers.ts`)
- `i18n/`: locale config and navigation wrappers
- `messages/`: translation dictionaries (`en`, `uk`, `es`, `fr`, `ru`)
- `contexts/`: shared React contexts
- `hooks/`: reusable client hooks
- `types/`: domain types
- `test/unit/`: unit tests

## Key Runtime Flows

### Auth and Session

- Token cookies are handled through server/client helpers in `lib/auth.ts` and `lib/auth-cookies.ts`.
- Auth APIs live under `app/api/auth/...` and client wrappers under `lib/apiAuth.ts`.
- Middleware can refresh auth context and applies locale-aware redirects in `middleware.ts`.

### Internationalization

- Routing configuration is centralized in `i18n/routing.ts`.
- Pages are grouped by locale in `app/[locale]/...`.
- All locale JSON files in `messages/` should stay key-synchronized.

### API Access

- Base API and endpoints are declared in `config/api.ts`.
- Feature-specific API helpers live in `lib/api*.ts` files.
- Proxy and auth-aware requests should reuse existing auth and fetch utilities.

## Commands

- `yarn dev` - run local dev with `.env.dev`
- `yarn prod` - run local dev with `.env.prod`
- `yarn test` - run Vitest tests
- `yarn lint:check` - run ESLint in check mode
- `yarn verify:ci` - lint + tests + build
- `yarn build` - production build

## Environment Variables

Keep secrets out of docs and commits. Publicly documented keys:

- `NEXT_PUBLIC_API_URL`
- `API_BASE_URL`

See `env.example` for baseline local setup.

## Agent Working Rules

- Prefer minimal, safe diffs that match existing patterns.
- Reuse existing utilities and avoid introducing duplicate abstractions.
- Do not introduce new dependencies unless necessary.
- Keep TypeScript strict; avoid `any`.
- For UI, prefer existing primitives from `components/ui/`.
- For API changes, keep handlers in `app/api` aligned with existing auth and error behavior.

## Request Template (Token-Efficient)

Use this short task brief to reduce clarification loops:

```text
Task type: UI | API | i18n | test | refactor
Target files/area:
Expected result:
Out of scope:
Validation command:
```

Example:

```text
Task type: API
Target files/area: app/api/auth/me/route.ts, lib/auth.ts
Expected result: return 401 when token is missing, keep response shape unchanged
Out of scope: no middleware changes, no UI changes
Validation command: yarn test
```
