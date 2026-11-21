# Архитектура и процесс

Два отдельных Git-репозитория и сервиса. Представление — Next.js, бизнес-логика — FastAPI, данные — SQLite/SQLAlchemy. Браузер обращается к `/api/*` домена frontend; Next.js пересылает запросы самостоятельному backend. Серверный маршрут proxy транспортный, бизнес-правил не содержит. Внутри backend данные доступны через ORM.

## ERD

```mermaid
erDiagram
  USERS ||--o{ SESSIONS : authenticates
  USERS ||--o{ INVITATIONS : sends
  USERS ||--o{ INVITATIONS : receives
  SLOTS ||--o{ INVITATIONS : schedules
  TOPICS ||--o{ INVITATIONS : discusses
  USERS ||--o{ BOOKINGS : occupies
  SLOTS ||--o{ BOOKINGS : reserves
  INVITATIONS ||--o{ BOOKINGS : confirms
  USERS ||--o{ FEEDBACK : submits
  INVITATIONS ||--o{ FEEDBACK : evaluates
  USERS {
    int id PK
    string username UK
    string password_hash
    string name
    string role
    string company
    string bio
    json wanted
    json offered
    json availability
    bool visible
    bool is_admin
    bool is_demo
  }
  SESSIONS {
    string token_hash PK
    int user_id FK
    int expires_at
  }
  TOPICS {
    int id PK
    string name UK
  }
  SLOTS {
    int id PK
    int starts_at
    int ends_at
    string location
    bool is_demo
  }
  INVITATIONS {
    int id PK
    int sender_id FK
    int recipient_id FK
    int slot_id FK
    int topic_id FK
    string message
    string status
    int created_at
    int accepted_at
  }
  BOOKINGS {
    int user_id PK,FK
    int slot_id PK,FK
    int invitation_id FK
  }
  FEEDBACK {
    int id PK
    int invitation_id FK
    int user_id FK
    bool happened
    bool useful
  }
```

Списки тем/доступности профиля хранятся JSON и ссылаются логически на TOPICS/SLOTS; валидируются сервером, не внешним ключом внутри JSON. Уникальны username, название темы, занятость `(user_id,slot_id)` и оценка `(invitation_id,user_id)`. Внешние ключи включены через PRAGMA. Удаление пользователя каскадное. Удаления справочников в MVP нет. Миграция не задаёт SQLite AUTOINCREMENT; устойчивость идентификаторов при будущем удалении справочников потребует отдельного решения.

## Sequence: принятие приглашения

```mermaid
sequenceDiagram
  actor A as Отправитель
  actor B as Получатель
  participant UI as Next.js
  participant API as FastAPI
  participant DB as SQLite
  A->>UI: Пригласить: тема и свободный слот
  UI->>API: POST /api/invitations + cookie + CSRF header
  API->>DB: Проверить профили/тему/доступность, сохранить pending
  API-->>UI: 201 pending
  B->>UI: Открыть входящие и принять
  UI->>API: POST /api/invitations/id/action
  API->>DB: BEGIN IMMEDIATE
  API->>DB: Проверить владельца, статус, время и занятость
  alt Оба свободны
    API->>DB: Создать 2 bookings, accepted, конфликтующие pending → conflict
    API->>DB: COMMIT
    API-->>UI: 200 accepted
    UI-->>B: Время, место и тема встречи
  else Конфликт или приглашение недействительно
    API->>DB: ROLLBACK
    API-->>UI: 409 + понятная ошибка (права: 403, чужое: 404)
  end
```

## Состояния

`pending → accepted / declined / cancelled / conflict`. После начала pending отображается expired, принятие запрещено. `accepted → cancelled` только до начала; отмена освобождает bookings. Конфликтные приглашения не восстанавливаются автоматически. Оценка доступна после ends_at, только участникам accepted. «Состоялась» требует двух положительных подтверждений.
