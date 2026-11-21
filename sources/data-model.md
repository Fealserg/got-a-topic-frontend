# Таблицы и модель данных

Схема сформирована из SQLAlchemy metadata текущего backend. Миграция Alembic 001 описывает те же семь таблиц. [Отрисованная ERD](../assets/erd.svg), [исходник Mermaid](erd.mmd), [архитектура и процесс](architecture.md).

## slots

Общий интервал и точка встречи.

| Поле | Тип | Null | Ключ / связь | Значение |
| --- | --- | --- | --- | --- |
| id | INTEGER | Нет | PK | Идентификатор записи |
| starts_at | INTEGER | Нет | — | Начало, Unix UTC |
| ends_at | INTEGER | Нет | — | Окончание, Unix UTC |
| location | VARCHAR(150) | Нет | — | Точка встречи |
| is_demo | BOOLEAN | Нет | — | Исключение синтетического профиля/слота из реального контекста |

## topics

Справочник профессиональных тем.

| Поле | Тип | Null | Ключ / связь | Значение |
| --- | --- | --- | --- | --- |
| id | INTEGER | Нет | PK | Идентификатор записи |
| name | VARCHAR(100) | Нет | UNIQUE | Имя участника / название темы |

Уникальные ограничения: (name).

## users

Аккаунт и профиль участника или организатора.

| Поле | Тип | Null | Ключ / связь | Значение |
| --- | --- | --- | --- | --- |
| id | INTEGER | Нет | PK | Идентификатор записи |
| username | VARCHAR(32) | Нет | UNIQUE | Уникальный логин |
| password_hash | VARCHAR | Нет | — | Соль и хеш scrypt; не отдаётся API |
| name | VARCHAR(80) | Нет | — | Имя участника / название темы |
| role | VARCHAR(100) | Нет | — | Профессиональная роль; не право доступа |
| company | VARCHAR(100) | Нет | — | Компания, необязательно |
| bio | VARCHAR(500) | Нет | — | Описание опыта и запроса |
| wanted | JSON | Нет | — | JSON-массив ID желаемых тем |
| offered | JSON | Нет | — | JSON-массив ID тем опыта |
| availability | JSON | Нет | — | JSON-массив ID выбранных слотов |
| visible | BOOLEAN | Нет | — | Добровольное участие в подборе |
| is_admin | BOOLEAN | Нет | — | Право организатора |
| is_demo | BOOLEAN | Нет | — | Исключение синтетического профиля/слота из реального контекста |

Уникальные ограничения: (username).

## invitations

Предложение встречи и текущее состояние.

| Поле | Тип | Null | Ключ / связь | Значение |
| --- | --- | --- | --- | --- |
| id | INTEGER | Нет | PK | Идентификатор записи |
| sender_id | INTEGER | Нет | FK → users.id; ON DELETE CASCADE | Отправитель приглашения |
| recipient_id | INTEGER | Нет | FK → users.id; ON DELETE CASCADE | Получатель приглашения |
| slot_id | INTEGER | Нет | FK → slots.id | Интервал встречи |
| topic_id | INTEGER | Нет | FK → topics.id | Тема встречи |
| message | VARCHAR(300) | Нет | — | Необязательное сообщение приглашения |
| status | VARCHAR(20) | Нет | — | pending, accepted, declined, cancelled или conflict |
| created_at | INTEGER | Нет | — | Создание, Unix UTC |
| accepted_at | INTEGER | Да | — | Принятие, Unix UTC; null до принятия |

## sessions

Серверная сессия без исходного токена.

| Поле | Тип | Null | Ключ / связь | Значение |
| --- | --- | --- | --- | --- |
| token_hash | VARCHAR(64) | Нет | PK | SHA-256 случайного токена; исходный токен не хранится |
| user_id | INTEGER | Нет | FK → users.id; ON DELETE CASCADE | Участник / владелец записи |
| expires_at | INTEGER | Нет | — | Срок сессии, Unix UTC |

## bookings

Занятость одного пользователя на одном слоте.

| Поле | Тип | Null | Ключ / связь | Значение |
| --- | --- | --- | --- | --- |
| user_id | INTEGER | Нет | PK; FK → users.id; ON DELETE CASCADE | Участник / владелец записи |
| slot_id | INTEGER | Нет | PK; FK → slots.id | Интервал встречи |
| invitation_id | INTEGER | Нет | FK → invitations.id; ON DELETE CASCADE | Связанное приглашение |

## feedback

Один собственный отзыв участника о встрече.

| Поле | Тип | Null | Ключ / связь | Значение |
| --- | --- | --- | --- | --- |
| id | INTEGER | Нет | PK | Идентификатор записи |
| invitation_id | INTEGER | Нет | FK → invitations.id; ON DELETE CASCADE | Связанное приглашение |
| user_id | INTEGER | Нет | FK → users.id; ON DELETE CASCADE | Участник / владелец записи |
| happened | BOOLEAN | Нет | — | Подтверждение факта одним участником |
| useful | BOOLEAN | Да | — | Личная оценка полезности; null без оценки |

Уникальные ограничения: (invitation_id, user_id).

## Связи и целостность

В ERD две связи users → invitations означают отправителя и получателя. Одна accepted-встреча создаёт ровно две bookings, по одной на участника. Составной PK bookings(user_id, slot_id) не позволяет занять одно время дважды. Отзыв уникален по (invitation_id, user_id). Внешние ключи SQLite включены через PRAGMA foreign_keys=ON.

wanted, offered и availability — JSON, а не таблицы связей. Ссылочная целостность элементов этих массивов обеспечивается серверной валидацией, не FK. Статусы, длительность 900 секунд и непересечение слотов проверяет backend; миграция не создаёт SQL CHECK для этих правил. expired вычисляется при чтении просроченного pending и не хранится как отдельный статус.

Удаление пользователя каскадно удаляет его сессии, связанные приглашения, занятость и отзывы, включая связанные записи другого участника. UI предупреждает об этом. Удаление тем и слотов в MVP не реализовано.

## Хранение

SQLAlchemy работает с SQLite, Alembic управляет схемой, включены WAL и busy_timeout. Один worker и экземпляр, записи через BEGIN IMMEDIATE. Файл production задан как /data/pereryv.db; наличие постоянного тома и сохранность при полном редеплое RelaxDev не подтверждены. Реальная БД и данные участников в комплект не входят.
