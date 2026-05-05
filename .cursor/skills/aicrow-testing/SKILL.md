---
name: aicrow-testing
description: Standardizes how to add and run unit tests in AIcrow using Vitest and existing test setup. Use when changing middleware, API handlers, or shared lib utilities.
disable-model-invocation: true
---

# AIcrow Testing Workflow

## Test Stack

- Test runner config: `vitest.config.ts`
- Setup file: `test/setup/vitest.setup.ts`
- Unit test location: `test/unit/**/*.test.ts`

## When Tests Are Required

- Behavior changes in `middleware.ts` or middleware helpers.
- API handler changes under `app/api/**`.
- Logic changes in shared utilities under `lib/**`.

## Steps

1. Place tests under `test/unit/` following neighboring naming style.
2. Reuse existing test helpers and mocking patterns.
3. Cover success and failure paths for API or auth-sensitive logic.
4. Keep tests deterministic; avoid dependence on network or clock unless mocked.

## Commands

- Run all unit tests: `yarn test`
- Run checks + tests + build: `yarn verify:ci`

## Quality Guardrails

- Update tests alongside behavior changes in the same task.
- Avoid over-mocking when pure function-level assertions are sufficient.
- Keep fixtures and stubs minimal and readable.
