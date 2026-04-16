# Build/Deploy guardrails

## Ціль

Уніфікувати локальний, CI та серверний build flow, щоб уникати падінь на встановленні залежностей та під час `next build`.

## Базові правила середовища

- Node: `20.18.2` (див. `.nvmrc` і `package.json -> engines.node`).
- Yarn: `1.22.22` (див. `package.json -> engines.yarn` і `packageManager`).
- Install команда в CI повинна збігатися з серверною:
  - `yarn --pure-lockfile --no-progress --emoji false`.

## Dependency compatibility checklist

- Перед оновленням test/build tooling (`vitest`, `vite`, `jsdom`):
  - перевірити `engines.node` у пакетів;
  - звірити сумісність з `node 20.18.2`.
- Якщо пакет вимагає новіший Node:
  - або зафіксувати сумісну версію пакета;
  - або окремо погодити підняття Node у всіх середовищах.

## Build перед пушем

1. `npm run lint:check`
2. `npm test`
3. `npm run build`

Або одним кроком:

- `npm run verify:ci`

## Якщо впав `yarn install` у CI/сервері

- Перевірити `engines` у логу (часто причина — `vite/jsdom`).
- Перевірити, чи не змінились версії в `package.json` без сумісної корекції.
- Перевірити, що в CI використовується той самий package manager/команда install.

## Якщо впав `next build`

- Відрізнити:
  - TypeScript помилки (потребують типобезпечного фіксу);
  - ESLint помилки (контролюються окремо через `lint:check`/CI).
- Якщо потрібно терміново зібрати артефакт:
  - дозволено `eslint.ignoreDuringBuilds: true` у `next.config.mjs`,
  - але `lint:check` в CI лишається обов'язковим.
