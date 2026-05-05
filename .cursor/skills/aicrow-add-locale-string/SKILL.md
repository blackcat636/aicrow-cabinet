---
name: aicrow-add-locale-string
description: Adds and wires localized message keys across all AIcrow locale dictionaries and usage points. Use when introducing or updating user-facing text in pages or components.
disable-model-invocation: true
---

# Add Locale String

## When to Use

Use this skill when adding new UI text that should be translated.

## Steps

1. Identify current key namespace near the target component or page.
2. Add the new key to `messages/en.json`.
3. Mirror the same key path in `messages/uk.json`, `messages/es.json`, `messages/fr.json`, and `messages/ru.json`.
4. Keep key names stable and descriptive; avoid cryptic short keys.
5. Replace hardcoded UI text with translation lookups used in the current file.

## Guardrails

- Do not remove existing keys without confirming they are unused.
- Keep message shape synchronized across locale files.
- If exact translation is unknown, leave a clear placeholder that preserves meaning and mark it for follow-up.

## Validation

1. Check JSON validity in all edited message files.
2. Verify no broken key paths in updated components/pages.
3. Run relevant tests if translation-driven rendering logic is covered.
