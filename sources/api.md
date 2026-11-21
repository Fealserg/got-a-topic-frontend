# Контракт API и Swagger

Версия API: 1.0.0. Контракт содержит 15 операций на 12 путях. Полная машиночитаемая схема — [openapi.json](../openapi.json). Экспорт совпал с контрактом размещённого backend 21 ноября 2026 года.

## Адреса

- Backend origin: https://got-a-topic-api.isodomain.tech
- Через сайт: https://got-a-topic-frontend.isodomain.tech
- [Swagger backend](https://got-a-topic-api.isodomain.tech/api/docs)
- [Swagger через frontend](https://got-a-topic-frontend.isodomain.tech/api/docs)
- [Живой OpenAPI](https://got-a-topic-api.isodomain.tech/api/openapi.json)

Все пути ниже уже содержат /api. Swagger настроен на /api/docs; стандартный /docs не является адресом документации этого приложения.

## Доступ и транспорт

Сессия передаётся cookie pereryv_session: HttpOnly, SameSite=Strict, Secure в production, TTL 7 дней. После входа не нужно передавать токен в JSON. На изменяющих методах нужен заголовок `X-Requested-With: pereryv`; Origin, если присутствует, должен входить в разрешённые. GET не требует этого заголовка, хотя общий APIKeyHeader отображается в OpenAPI всех операций. В Swagger Authorize задаёт значение pereryv; для приватных запросов дополнительно нужна сессия входа на том же домене. Пароль или токен организатора не включены в пакет.

Браузер обращается к /api/* своего frontend-домена; Next.js передаёт тело, cookie и код ответа в отдельный FastAPI. Время — Unix UTC в секундах, интерфейс — Europe/Moscow.

## Операции

| Метод и путь | Назначение | Доступ | Успешный ответ |
| --- | --- | --- | --- |
| GET /api/health | Проверка сервиса и БД | Без входа | `200: HealthResponse` |
| GET /api/config | Темы, интервалы и режим демо | Без входа | `200: ConfigResponse` |
| POST /api/auth/register | Создать скрытый профиль и сессию | Без входа | `201: PrivateProfile` |
| POST /api/auth/login | Создать новую сессию | Без входа | `200: PrivateProfile` |
| POST /api/auth/logout | Удалить текущую сессию и cookie | Текущая сессия, при наличии | `200: OkResponse` |
| GET /api/me | Получить собственный профиль | Сессия | `200: PrivateProfile` |
| PUT /api/me | Сохранить собственный профиль | Сессия | `200: PrivateProfile` |
| DELETE /api/me | Удалить профиль и связанные данные | Сессия | `200: OkResponse` |
| GET /api/recommendations | Получить до 30 объяснимых совпадений | Сессия; скрытый профиль получает пустой список | `200: array<RecommendationResponse>` |
| GET /api/invitations | Собственные входящие/исходящие и собственная оценка | Сессия | `200: array<InvitationResponse>` |
| POST /api/invitations | Отправить приглашение | Сессия; опубликованные совместимые профили | `201: InvitationCreated` |
| POST /api/invitations/{invitation_id}/action | Принять, отклонить или отменить | Сессия участника; accept/decline только получатель | `200: InvitationActionResponse` |
| PUT /api/invitations/{invitation_id}/feedback | Создать или заменить собственную оценку | Сессия участника; accepted после окончания | `200: OkResponse` |
| POST /api/admin/slots | Создать будущий 15-минутный интервал | Сессия организатора | `201: SlotCreated` |
| GET /api/admin/stats | Агрегаты без демо-участников | Сессия организатора | `200: StatsResponse` |

## Входные данные по операциям

### GET /api/health

Параметров пути и query нет.

JSON body не требуется.

### GET /api/config

Параметров пути и query нет.

JSON body не требуется.

### POST /api/auth/register

Параметров пути и query нет.

JSON body: Register. Поля и ограничения перечислены ниже.

### POST /api/auth/login

Параметров пути и query нет.

JSON body: Credentials. Поля и ограничения перечислены ниже.

### POST /api/auth/logout

Параметров пути и query нет.

JSON body не требуется.

### GET /api/me

Параметров пути и query нет.

JSON body не требуется.

### PUT /api/me

Параметров пути и query нет.

JSON body: Profile. Поля и ограничения перечислены ниже.

### DELETE /api/me

Параметров пути и query нет.

JSON body не требуется.

### GET /api/recommendations

Параметров пути и query нет.

JSON body не требуется.

### GET /api/invitations

Параметров пути и query нет.

JSON body не требуется.

### POST /api/invitations

Параметров пути и query нет.

JSON body: InviteInput. Поля и ограничения перечислены ниже.

### POST /api/invitations/{invitation_id}/action

path: invitation_id (integer, обязательно)

JSON body: Action. Поля и ограничения перечислены ниже.

### PUT /api/invitations/{invitation_id}/feedback

path: invitation_id (integer, обязательно)

JSON body: FeedbackInput. Поля и ограничения перечислены ниже.

### POST /api/admin/slots

Параметров пути и query нет.

JSON body: SlotInput. Поля и ограничения перечислены ниже.

### GET /api/admin/stats

Параметров пути и query нет.

JSON body не требуется.

## Схемы запросов и ответов

Имена схем совпадают с OpenAPI. Знак null означает допустимое пустое значение; отсутствие обязательности означает, что поле можно не передавать. Дополнительные бизнес-проверки приведены после таблиц.

### Action

| Поле | Тип | Обязательно | Ограничения |
| --- | --- | --- | --- |
| action | `string` | Да | pattern: "^(accept\|decline\|cancel)$" |

### ConfigResponse

| Поле | Тип | Обязательно | Ограничения |
| --- | --- | --- | --- |
| topics | `array<TopicResponse>` | Да | — |
| slots | `array<SlotResponse>` | Да | — |
| demo_enabled | `boolean` | Да | — |

### Credentials

| Поле | Тип | Обязательно | Ограничения |
| --- | --- | --- | --- |
| username | `string` | Да | minLength: 3; maxLength: 32; pattern: "^[a-zA-Z0-9_.-]+$" |
| password | `string` | Да | minLength: 10; maxLength: 128 |

### ErrorDetail

| Поле | Тип | Обязательно | Ограничения |
| --- | --- | --- | --- |
| code | `integer` | Да | — |
| message | `string` | Да | — |
| fields | `array<FieldError> / null` | Нет | — |

### ErrorResponse

| Поле | Тип | Обязательно | Ограничения |
| --- | --- | --- | --- |
| error | `ErrorDetail` | Да | — |

### FeedbackInput

| Поле | Тип | Обязательно | Ограничения |
| --- | --- | --- | --- |
| happened | `boolean` | Да | — |
| useful | `boolean / null` | Нет | — |

### FeedbackResponse

| Поле | Тип | Обязательно | Ограничения |
| --- | --- | --- | --- |
| happened | `boolean` | Да | — |
| useful | `boolean / null` | Да | — |

### FieldError

| Поле | Тип | Обязательно | Ограничения |
| --- | --- | --- | --- |
| field | `string` | Да | — |
| message | `string` | Да | — |

### HealthResponse

| Поле | Тип | Обязательно | Ограничения |
| --- | --- | --- | --- |
| status | `string` | Да | — |

### InvitationActionResponse

| Поле | Тип | Обязательно | Ограничения |
| --- | --- | --- | --- |
| status | `string` | Да | enum: ["accepted","declined","cancelled"] |

### InvitationCreated

| Поле | Тип | Обязательно | Ограничения |
| --- | --- | --- | --- |
| id | `integer` | Да | — |
| status | `string` | Да | — |

### InvitationResponse

| Поле | Тип | Обязательно | Ограничения |
| --- | --- | --- | --- |
| id | `integer` | Да | — |
| incoming | `boolean` | Да | — |
| other | `PublicProfile` | Да | — |
| slot_id | `integer` | Да | — |
| topic_id | `integer` | Да | — |
| message | `string` | Да | — |
| status | `string` | Да | enum: ["pending","accepted","declined","cancelled","conflict","expired"] |
| feedback | `FeedbackResponse / null` | Да | — |

### InviteInput

| Поле | Тип | Обязательно | Ограничения |
| --- | --- | --- | --- |
| recipient_id | `integer` | Да | — |
| slot_id | `integer` | Да | — |
| topic_id | `integer` | Да | — |
| message | `string` | Нет | maxLength: 300; default: "" |

### OkResponse

| Поле | Тип | Обязательно | Ограничения |
| --- | --- | --- | --- |
| ok | `boolean` | Да | — |

### PrivateProfile

| Поле | Тип | Обязательно | Ограничения |
| --- | --- | --- | --- |
| id | `integer` | Да | — |
| name | `string` | Да | — |
| role | `string` | Да | — |
| company | `string` | Да | — |
| bio | `string` | Да | — |
| wanted | `array<integer>` | Да | — |
| offered | `array<integer>` | Да | — |
| availability | `array<integer>` | Да | — |
| visible | `boolean` | Да | — |
| is_demo | `boolean` | Да | — |
| username | `string` | Да | — |
| is_admin | `boolean` | Да | — |

### Profile

| Поле | Тип | Обязательно | Ограничения |
| --- | --- | --- | --- |
| name | `string` | Да | minLength: 1; maxLength: 80 |
| role | `string` | Нет | maxLength: 100; default: "" |
| company | `string` | Нет | maxLength: 100; default: "" |
| bio | `string` | Нет | maxLength: 500; default: "" |
| wanted | `array<integer>` | Да | maxItems: 5 |
| offered | `array<integer>` | Да | maxItems: 5 |
| availability | `array<integer>` | Да | maxItems: 20 |
| visible | `boolean` | Да | — |

### PublicProfile

| Поле | Тип | Обязательно | Ограничения |
| --- | --- | --- | --- |
| id | `integer` | Да | — |
| name | `string` | Да | — |
| role | `string` | Да | — |
| company | `string` | Да | — |
| bio | `string` | Да | — |
| wanted | `array<integer>` | Да | — |
| offered | `array<integer>` | Да | — |
| availability | `array<integer>` | Да | — |
| visible | `boolean` | Да | — |
| is_demo | `boolean` | Да | — |

### RecommendationResponse

| Поле | Тип | Обязательно | Ограничения |
| --- | --- | --- | --- |
| user | `PublicProfile` | Да | — |
| score | `integer` | Да | — |
| learn_topics | `array<integer>` | Да | — |
| share_topics | `array<integer>` | Да | — |
| common_topics | `array<integer>` | Да | — |
| slot_ids | `array<integer>` | Да | — |

### Register

| Поле | Тип | Обязательно | Ограничения |
| --- | --- | --- | --- |
| username | `string` | Да | minLength: 3; maxLength: 32; pattern: "^[a-zA-Z0-9_.-]+$" |
| password | `string` | Да | minLength: 10; maxLength: 128 |
| name | `string` | Да | minLength: 1; maxLength: 80 |

### SlotCreated

| Поле | Тип | Обязательно | Ограничения |
| --- | --- | --- | --- |
| id | `integer` | Да | — |

### SlotInput

| Поле | Тип | Обязательно | Ограничения |
| --- | --- | --- | --- |
| starts_at | `integer` | Да | — |
| ends_at | `integer` | Да | — |
| location | `string` | Да | minLength: 1; maxLength: 150 |

### SlotResponse

| Поле | Тип | Обязательно | Ограничения |
| --- | --- | --- | --- |
| id | `integer` | Да | — |
| starts_at | `integer` | Да | — |
| ends_at | `integer` | Да | — |
| location | `string` | Да | — |
| is_demo | `boolean` | Да | — |

### StatsResponse

| Поле | Тип | Обязательно | Ограничения |
| --- | --- | --- | --- |
| profiles | `integer` | Да | — |
| active_profiles | `integer` | Да | — |
| participants_with_meeting | `integer` | Да | — |
| invitations | `integer` | Да | — |
| ever_accepted | `integer` | Да | — |
| cancelled_after_accept | `integer` | Да | — |
| confirmed_meetings | `integer` | Да | — |
| positive_ratings | `integer` | Да | — |
| ratings | `integer` | Да | — |
| feedback_responses | `integer` | Да | — |
| demo_excluded | `boolean` | Да | — |
| topics | `array<TopicStats>` | Да | — |

### TopicResponse

| Поле | Тип | Обязательно | Ограничения |
| --- | --- | --- | --- |
| id | `integer` | Да | — |
| name | `string` | Да | — |

### TopicStats

| Поле | Тип | Обязательно | Ограничения |
| --- | --- | --- | --- |
| name | `string` | Да | — |
| participants | `integer` | Да | — |

## Бизнес-проверки

- Публикация требует непустую тему запроса или опыта и будущую доступность. Списки тем до 5, доступность до 20; неизвестные ID и прошлые слоты отклоняются.
- Приглашение требует двух видимых профилей, совместимой темы и общего будущего незанятого слота; себе приглашать нельзя. Повтор той же пары ограничен часом.
- Только получатель принимает/отклоняет. Принятие резервирует оба времени в одной транзакции. Участники отменяют до начала. Повтор уже выполненного действия возвращает текущий желаемый статус.
- Отзыв разрешён после ends_at для accepted; при happened=false useful должен быть null.
- Слот длится ровно 900 секунд, начинается в будущем и не пересекается с существующими.

## Ошибки и ограничения частоты

Общий конверт: `{"error":{"code":409,"message":"Приглашение больше недействительно."}}`. Для 422 дополнительно fields с именами полей и сообщениями без исходных значений.

| Код | Значение |
| --- | --- |
| 401 | Нет действующей сессии |
| 403 | Недопустимый Origin/CSRF-заголовок, роль или действие отправителя |
| 404 | Объект не найден или приглашение чужое |
| 409 | Конфликт времени, состояния, повтор приглашения или логина |
| 422 | Ошибка входных данных или бизнес-валидации |
| 429 | Превышение частоты; Retry-After в секундах |
| 500 | Безопасное сообщение без внутренних подробностей |
| 502 | Ошибка frontend-proxy при недоступном backend или неверном API_BASE_URL |

Вход: 10/минуту на адрес+логин; регистрация: 30/минуту на адрес; приглашения: 10/минуту на адрес+аккаунт. Лимиты хранятся в памяти одного worker; за proxy общий адрес может объединять пользователей.

## Примеры JSON

Примеры используют условные ID, а не гарантируют существование этих объектов в production. Сначала нужно получить актуальные темы и интервалы из GET /api/config.

Публикация профиля — PUT /api/me:

```json
{"name":"Участник A","role":"Аналитик","company":"","bio":"Хочу обменяться опытом","wanted":[1],"offered":[2],"availability":[1],"visible":true}
```

Приглашение — POST /api/invitations; успешный ответ 201:

```json
{"recipient_id":2,"slot_id":1,"topic_id":1,"message":"Обсудим опыт внедрения?"}
```

```json
{"id":1,"status":"pending"}
```

Принятие — POST /api/invitations/1/action; успешный ответ 200:

```json
{"action":"accept"}
```

```json
{"status":"accepted"}
```

После конца встречи — PUT /api/invitations/1/feedback:

```json
{"happened":true,"useful":true}
```

[Процесс и состояния](architecture.md), [ТЗ Backend](backend-spec.md), [проверка сценария](acceptance.md).
