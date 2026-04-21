# Smoke-чекліст: Auth-First рефакторинг

## Посилання на план
- У репозиторії: `.cursor/plans/plan-6.md` (документація та smoke-checklists після рефакторингу).
- Скоуп: `middleware`, auth cookies/locale, i18n (`next-intl`, `localePrefix: as-needed`), клієнтський `/api/proxy`, workflow-модалки (детальніше про типізацію workflow — зміни в коді за `.cursor/plans/plan-5.md`, якщо застосовується).

## Передумови
- Backend auth endpoints доступні.
- Браузер у чистому стані для unauth перевірок (або incognito).
- Є тестовий користувач і (за потреби) SSO тестовий акаунт.
- Узгоджені маршрути «auth» у `middleware.ts`: `/login`, `/signup`, `/auth/callback`, `/sso/initiate`, `/auth/sso/initiate` (SSO initiate не редіректиться на dashboard під валідною сесією, на відміну від звичайного login/signup).

## 1) Неавторизований -> редірект на логін
- Відкрити захищений route (`/dashboard`, `/workflows`, `/billing` тощо) без токенів.
- Перевірити редірект на сторінку логіну з урахуванням локалі.
- **Префікс URL:** `localePrefix: as-needed`, `defaultLocale: en` (`i18n/routing.ts`) — для англійської логін може бути `/login` без `/en`; для інших підтримуваних локалей (`uk`, `fr`, `es`, `ru`) очікуйте `/{locale}/login` або редірект/rewrite згідно з поточним `middleware`.

## 2) Авторизований -> редірект на dashboard
- Увійти з валідними креденшалами.
- Відкрити під авторизованим станом маршрути на кшталт `/login`, `/signup` (не плутати з `/auth/callback` і initiate-URL для SSO — вони обробляються окремо).
- Перевірити редірект на `dashboard` з тією ж правилом префікса локалі, що й у п.1.

## 3) Успішний refresh flow
- Протермінувати/прибрати `access_token`, залишити валідні `refresh_token` + `device_id`.
- Відкрити `/` і окремо захищений route (наприклад `/dashboard`): middleware викликає refresh там, де передбачено логікою, оновлює cookies і зберігає сесію.
- На `/` при успішному refresh очікуйте редірект на локалізований `dashboard` і встановлення нових `access_token` / `refresh_token` (див. `applyRefreshedAuthCookies` у `lib/middleware-auth-locale.ts`).
- Перевірити, що клієнтські запити до бекенду через префікс `/api/proxy/...` (`lib/auth.ts`) працюють з оновленою сесією (у т.ч. після сценарію 401 + refresh на клієнті, якщо застосовно до вашого flow).

## 4) Невдалий refresh flow
- Залишити невалідні/протерміновані `refresh_token` і `device_id`.
- **Основний сценарій (очищення cookies):** відкрити **захищений** route (наприклад `/dashboard`), не лише `/`. Перевірити редірект на локалізований логін і виклик `applyClearedAuthCookies`: порожні `access_token`, `refresh_token`, `device_id`.
- **Edge:** для `pathname === '/'` при невдалому refresh у `middleware.ts` можливий редірект на логін **без** очищення cookies — зафіксуйте фактичну поведінку в DevTools; не трактуйте її як той самий контракт, що для `/dashboard`.

## 5) Locale cookie fallback
- Джерела пріоритету (як у `readRawLocaleCookie`): `NEXT_LOCALE`, далі `locale`, далі `next-intl-locale`.
- Видалити ці locale cookies і відкрити `/`: якщо «сира» locale cookie відсутня, middleware може встановити дефолт через `appendDefaultLocaleCookieIfMissing` (`NEXT_LOCALE` = `defaultLocale`).
- Встановити підтримувану locale cookie зі списку локалей роутингу і перевірити редіректи/URL без суперечностей.

## 6) Консистентність API error envelope
- Згенерувати auth/profile помилки (401/400/500).
- Перевірити, що API routes повертають читабельний `message` з коректним status.
- Перевірити відсутність silent contract drift для поточних UI-споживачів.

## 7) SSO / impersonation edge cases
- Перевірити коректність SSO initiate/exchange redirects (для `/auth/sso/exchange` у `middleware.ts` є ранній `NextResponse.next()` — обхід решти auth-логіки middleware).
- Перевірити, що impersonation start/stop flow працює.
- Перевірити, що stop impersonation повертає очікуваний auth/profile стан.

## 8) Регресії workflow modal (typing rollout)
- Відкрити execute і chain modals.
- Перевірити валідацію required fields.
- Перевірити серіалізацію/сабміт enum/array/social полів.
- Перевірити незмінність submit/cancel поведінки.

## 9) Безпека і cookie policy
- **Auth і admin токени / device_id** (`lib/auth-cookies.ts`, login/refresh/logout/middleware): `path=/`, `sameSite=strict`, `secure` у production; `access_token` і `refresh_token` — `httpOnly=true`; `device_id` без `httpOnly` (доступний для client-side сценаріїв), токени не читаються з `document.cookie`.
- **Bootstrap locale cookie:** коли немає «сирих» locale cookies, встановлення дефолтного `NEXT_LOCALE` у `appendDefaultLocaleCookieIfMissing` використовує `sameSite=lax` (відмінно від auth cookies) — це очікувано, не змішувати з вимогами до session cookies.
- Перевірити, що чутливі значення токенів не логуються.

## 10) Admin impersonation hardening
- Запустити impersonation start для admin-користувача.
- Перевірити наявність backup cookies (`admin_access_token`, `admin_refresh_token`, `admin_device_id`) з коректними атрибутами.
- Виконати stop impersonation і перевірити:
  - відновлення admin сесії;
  - повне очищення `impersonation_meta` + admin backup cookies (звірити з `app/api/auth/admin/stop-impersonate/route.ts` та клієнтським `lib/auth.ts` для meta);
  - збереження консистентної cookie policy для очищення.

## 11) Фінальна валідація
- Запустити lint/type checks для змінених файлів.
- Зробити швидкий manual pass критичних route-ів:
  - `/`
  - `/login`
  - `/dashboard`
  - `/api/auth/refresh`
  - `/api/users/profile` (або еквівалент через proxy, якщо так налаштовано клієнт)

## 12) Ризики та післядеплой
- **Різні шляхи middleware:** невдалий refresh на `/` vs на захищених шляхах (див. п.4); кореневий `/` також розводить unauth/auth/refresh без проходження повного intl-ланцюга інших URL.
- **next-intl / unprefixed paths:** якщо `next-intl` відповідає 307 на непрефіксований path, middleware має fallback на rewrite для default locale — регресії тут дають хибний `[locale]`; після деплою швидко перевірити непрефіксовані сторінки (наприклад `/billing`).
- **Impersonation:** `impersonation_meta` частково на клієнті (`lib/auth.ts`); після деплою перевірити banner start/stop і відсутність залишкових cookies.
- **Після деплою (коротко):** пройти п.1–2, один refresh-сценарій, один proxy-запит; у DevTools — атрибути session cookies vs `NEXT_LOCALE`.

## Нотатки
- Тримати правки мінімальними й локальними; не змінювати публічні API контракти без явного погодження.
- Якщо знайдена регресія, виправляти найменший уражений flow і повторно проганяти релевантний розділ чекліста.
- Якщо поведінка в коді змінилася — спочатку оновити цей чекліст або виправити код окремим PR, щоб QA-док і реалізація не розходились.
