---
name: aicrow-task-brief
description: Normalizes user tasks into a compact implementation brief for AIcrow workflows. Use when the task is ambiguous or when reducing clarification questions and token usage is important.
disable-model-invocation: true
---

# AIcrow Task Brief

## Purpose

Use this skill to transform a raw request into a short, execution-ready brief before coding.

## Brief Format

```text
Task type: UI | API | i18n | test | refactor
Target files/area:
Expected result:
Out of scope:
Validation command:
```

## Rules

1. Keep each field to one short line.
2. Do not invent file paths; infer from repository structure or ask one focused question.
3. Preserve current public APIs unless explicitly requested to change them.
4. Prefer minimal diffs and existing utilities.
5. Confirm validation command from existing scripts (`yarn test`, `yarn lint:check`, `yarn verify:ci`).

## Task Type Hints

- `UI`: point to `components/**` and `app/[locale]/**` entry points.
- `API`: point to `app/api/**` handlers and `lib/api*.ts` clients.
- `i18n`: include `messages/*.json` and relevant page/component usage.
- `test`: include `test/unit/**` and affected source files.
- `refactor`: state explicit boundaries and no-behavior-change expectation.
