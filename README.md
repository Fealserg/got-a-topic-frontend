# Есть тема · Frontend

Самостоятельный репозиторий Next.js + TypeScript + Tailwind CSS. Компонент Button использует подход shadcn/ui: локальный код, Radix Slot и cva. Отдельный FastAPI backend подключается через HTTP; сервер Next.js проксирует `/api/*`, бизнес-логики встреч здесь нет.

## Запуск

Node.js 22 LTS:

```sh
npm ci
API_BASE_URL=http://localhost:8000 npm run dev
```

Откройте http://127.0.0.1:3000. Backend должен быть запущен отдельно. При другом origin добавьте адрес фронтенда в его `FRONTEND_URL`.

```sh
npm run typecheck
npm run build
API_BASE_URL=http://localhost:8000 npm start
```

`API_BASE_URL` — окружение серверного процесса. В production параметр обязателен; разрешён только HTTP(S) origin без пути и учётных данных. Прокси `app/api/[...path]/route.ts` берёт origin из окружения при каждом запросе; не содержит клиентских секретов. Сессия — HttpOnly cookie. Все изменяющие запросы передают `X-Requested-With: pereryv`.

## RelaxDev

Свой Dockerfile, корень этого репозитория. Два независимых сервиса: сначала backend, затем этот frontend. Задайте `API_BASE_URL=https://<backend-domain>` при запуске. `PORT` выдаётся платформой; standalone-сервер слушает 0.0.0.0. Для демонстрации и приёмки Swagger доступен на `/api/docs`, OpenAPI — `/api/openapi.json`. Проверяйте, что адрес API применяется и в production.

В проекте используется standalone Next.js, а не статический export из примера организаторов. Это сохраняет серверное проксирование и отдельный FastAPI-сервис. Docker CLI в исходном окружении разработки отсутствует; сборку образа следует проверить на платформе или локально при наличии Docker.

## Сценарии

Лендинг, регистрация/вход, профиль, объяснимый подбор, фильтры по темам и имени, приглашения, принятие/отказ/отмена, обратная связь после встречи, агрегированная панель организатора и создание слотов. На мобильном экране навигация находится сверху. Демо-профили и время явно обозначены.

## Автоматические проверки

```sh
npm test
npm run typecheck
npm run build
```

`npm test` проверяет реальный серверный proxy без TCP: runtime origin, cookie, тело запроса, статус и безопасный ответ при сбое backend. Для браузерного E2E нужны отдельно запущенные frontend/backend и будущие интервалы:

```sh
npx playwright install chromium webkit
npm run test:e2e
```

E2E написаны для desktop и mobile, создают и удаляют только свои тестовые профили. В исходном окружении не запускались из-за запрета открытия локального порта EPERM. Подробное ТЗ — `docs/specification.md`.

CI `.github/workflows/checks.yml` использует публичный репозиторий `Fealserg/got-a-topic-backend`, проверяет контракт, типы, сборку, Playwright и контейнерный прокси. Сначала нужно опубликовать backend. Пока workflow не запущен, это подготовленные проверки, а не доказательство прохождения E2E.

## Подтверждённая проверка GitHub Actions

Успешный запуск: https://github.com/Fealserg/got-a-topic-frontend/actions/runs/44759224844. Проверенные commit и результаты шагов: `docs/ci-verification.json`. GitHub CI подтвердил контейнерные проверки; для frontend также пройдены браузерные сценарии. Размещение в RelaxDev пока не подтверждено.
