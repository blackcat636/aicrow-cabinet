---
name: aicrow-architecture
description: Documents AIcrow cabinet architecture, auth and locale flows, and where to place new feature code. Use when planning or implementing cross-cutting changes in app routes, API handlers, middleware, or API client libraries.
---

# AIcrow Architecture

## Purpose

Use this skill when a task touches multiple layers and you need consistent placement of code.

## Core Map

- `app/[locale]/...`: localized pages and layouts.
- `app/api/...`: route handlers for server-side API and auth flows.
- `components/`: UI and feature components.
- `lib/`: shared business logic, API wrappers, auth utilities, middleware helpers.
- `i18n/` and `messages/`: locale routing and translations.
- `test/unit/`: unit tests for middleware, routes, and helpers.

## Auth and Session Guidelines

1. Reuse cookie and token handling in `lib/auth.ts` and `lib/auth-cookies.ts`.
2. Keep middleware behavior aligned with `middleware.ts` and `lib/middleware-auth-locale.ts`.
3. Avoid introducing parallel auth state stores unless explicitly requested.

## API Integration Guidelines

1. Reuse endpoint constants from `config/api.ts`.
2. Prefer extending existing `lib/api*.ts` modules over creating duplicated clients.
3. Keep response/error shapes consistent with neighboring handlers.

## i18n Guidelines

1. Preserve locale routing contract from `i18n/routing.ts`.
2. Keep localized routes in `app/[locale]/...`.
3. Update all relevant `messages/*.json` files when introducing new UI keys.

## Workflow for New Features

1. Locate nearest feature area (`components/<feature>`, `app/[locale]/<feature>`, `lib/api<Feature>.ts`).
2. Implement the smallest coherent change across UI, API helpers, and types.
3. Add or update unit tests in `test/unit/` if behavior changes.
4. Run `yarn lint:check` and `yarn test` before finalizing.
