---
name: aicrow-cloudflare-pages
description: Guides build and deployment workflows for AIcrow on Cloudflare Pages using existing scripts and tooling. Use when tasks involve pages build output, local pages preview, or deployment command updates.
disable-model-invocation: true
---

# Cloudflare Pages Workflow

## Use Cases

- Updating build and deploy scripts.
- Investigating `pages:build`, `preview`, or `deploy` behavior.
- Verifying Next.js output compatibility for Pages.

## Existing Commands

- Build Pages output: `yarn pages:build`
- Local preview: `yarn preview`
- Deploy: `yarn deploy`

## Working Rules

1. Reuse existing script names from `package.json`; avoid introducing parallel scripts unless necessary.
2. Keep Cloudflare-specific changes isolated from unrelated app logic.
3. Confirm Node and package manager versions remain aligned with repository settings.

## Verification

1. Run `yarn pages:build` after build-related changes.
2. If deploy behavior changes, test locally with `yarn preview` when possible.
3. Keep CI-friendly commands reproducible from a clean environment.
