# Деплой на Layero (фронт + API)

Нужны **два проекта** в Layero из **одного репозитория**.

## 1. API (json-server)

Создайте проект, например `chat-bot-market-api` → домен `chat-bot-market-api.layero.app`.

Тип: **NODE.JS-БЭКЕНД** → подойдёт **Express** (или любой Node-контейнер с командой запуска).

| Поле | Значение |
|------|----------|
| Команда установки | `npm ci --no-audit --no-fund` |
| Команда сборки | *(пусто или `echo skip`)* |
| Команда запуска | `npm start` |
| Каталог результата | *(не используется)* |

`npm start` → `node server.cjs`, данные в `db.json`.

Проверка:

```bash
curl https://chat-bot-market-api.layero.app/users
```

Должен вернуться JSON, не HTML.

## 2. Фронт (Vite)

Проект `chat-bot-market` → `chat-bot-market.layero.app`.

| Поле | Значение |
|------|----------|
| Фреймворк | Vite |
| Команда установки | `npm ci --no-audit --no-fund --ignore-scripts` |
| Команда сборки | `npm run build` |
| Каталог результата | `dist` |

**Переменные окружения при сборке:**

```env
VITE_API_URL=https://chat-bot-market-api.layero.app
```

(уже в `.env.production`, если URL API совпадает)

После смены URL — **пересобрать** фронт.

## Локально

```bash
npm run dev
```

Фронт `:5173`, API `:8080` (`.env.development`).

## Важно

- На фронтовом домене `/users`, `/bots` — это SPA, не API.
- `db.json` на API-сервере; без volume данные могут сброситься при редеплое.
