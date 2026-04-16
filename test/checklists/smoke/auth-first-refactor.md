# Smoke-чекліст: Auth-First рефакторинг

## Посилання на план
- Файл плану: `/Users/monadiform/.cursor/plans/auth-first_refactor_rollout_1ba67f2c.plan.md`
- Скоуп: hardening auth/middleware, API mapping layers, типізація, консистентність Cursor, rollout для workflow.

## Передумови
- Backend auth endpoints доступні.
- Браузер у чистому стані для unauth перевірок (або incognito).
- Є тестовий користувач і (за потреби) SSO тестовий акаунт.

## 1) Неавторизований -> редірект на логін
- Відкрити захищений route (`/dashboard`, `/workflows`, `/billing`) без токенів.
- Перевірити редірект на локалізовану сторінку логіну.
- Перевірити коректний locale prefix/fallback.

## 2) Авторизований -> редірект на dashboard
- Увійти з валідними креденшалами.
- Відкрити `login/signup` routes під авторизованим станом.
- Перевірити редірект на локалізований `dashboard`.

## 3) Успішний refresh flow
- Протермінувати/прибрати `access_token`, залишити валідні `refresh_token` + `device_id`.
- Відкрити `/` і захищений route.
- Перевірити, що middleware робить refresh і сесія залишається активною.
- Перевірити, що встановлено нові `access_token` та `refresh_token`.
- Перевірити, що запити через `/api/proxy/**` автоматично проходять з оновленою сесією після 401+refresh.

## 4) Невдалий refresh flow
- Залишити невалідні/протерміновані `refresh_token` і `device_id`.
- Відкрити захищений route.
- Перевірити редірект на локалізований логін.
- Перевірити очищення auth cookies (`access_token`, `refresh_token`, `device_id`).

## 5) Locale cookie fallback
- Видалити locale cookies і відкрити `/`.
- Перевірити застосування default locale та встановлення cookie.
- Встановити підтримуваний locale cookie і перевірити обробку route.

## 6) Консистентність API error envelope
- Згенерувати auth/profile помилки (401/400/500).
- Перевірити, що API routes повертають читабельний `message` з коректним status.
- Перевірити відсутність silent contract drift для поточних UI-споживачів.

## 7) SSO / impersonation edge cases
- Перевірити коректність SSO initiate/exchange redirects.
- Перевірити, що impersonation start/stop flow працює.
- Перевірити, що stop impersonation повертає очікуваний auth/profile стан.

## 8) Регресії workflow modal (typing rollout)
- Відкрити execute і chain modals.
- Перевірити валідацію required fields.
- Перевірити серіалізацію/сабміт enum/array/social полів.
- Перевірити незмінність submit/cancel поведінки.

## 9) Безпека і cookie policy
- Перевірити уніфікацію cookie attributes у login/refresh/logout/middleware:
  - `path=/`
  - `sameSite=strict`
  - `secure` у production
- Перевірити, що `access_token` і `refresh_token` мають `httpOnly=true` у всіх auth/admin flows.
- Перевірити, що `device_id` лишається доступним для client-side only сценаріїв, але токени недоступні у `document.cookie`.
- Перевірити, що чутливі значення токенів не логуються.

## 11) Admin impersonation hardening
- Запустити impersonation start для admin-користувача.
- Перевірити наявність backup cookies (`admin_access_token`, `admin_refresh_token`, `admin_device_id`) з коректними атрибутами.
- Виконати stop impersonation і перевірити:
  - відновлення admin сесії;
  - повне очищення `impersonation_meta` + admin backup cookies;
  - збереження консистентної cookie policy для очищення.

## 10) Фінальна валідація
- Запустити lint/type checks для змінених файлів.
- Зробити швидкий manual pass критичних route-ів:
  - `/`
  - `/login`
  - `/dashboard`
  - `/api/auth/refresh`
  - `/api/users/profile`

## Нотатки
- Тримати правки мінімальними й локальними; не змінювати публічні API контракти без явного погодження.
- Якщо знайдена регресія, виправляти найменший уражений flow і повторно проганяти релевантний розділ чекліста.
