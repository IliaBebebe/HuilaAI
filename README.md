# HuilaAI

Экспериментальный агрегатор ИИ-чатов без регистрации и рекламы. Пользователи вводят только имя и общаются с DeepSeek; админ скрыто видит все диалоги, может переключать чаты в ручной режим и отвечать как «ИИ».

## Технологии
- Next.js 15 (App Router, TypeScript, SWR)
- TailwindCSS + Framer Motion
- Prisma + SQLite (готово к миграции на Postgres)

## Локальный запуск
1. Установите зависимости: `npm install`
2. Создайте `.env` (см. `env.example`) и задайте:
   - `DATABASE_URL="file:./dev.db"`
   - `OPENROUTER_API_KEY="ваш_ключ"`
   - `OPENROUTER_MODEL="deepseek/deepseek-chat"` (или любая модель OpenRouter)
   - `ADMIN_PASSWORD="секретный_пароль"`
3. Примените миграции: `npx prisma migrate dev`
4. Запустите dev-сервер: `npm run dev`

## Сборка продакшена
```
npm run build
npm start
```

## Публикация в GitHub
1. Авторизуйтесь в GitHub CLI (`gh auth login`) или подготовьте SSH.
2. Выполните в корне проекта:
   ```
   git init
   git add .
   git commit -m "feat: initial release"
   git branch -M main
   git remote add origin git@github.com:<user>/<repo>.git
   git push -u origin main
   ```
3. Убедитесь, что `.env` и `prisma/dev.db` не попадают в репозиторий (они уже в `.gitignore`).

## Деплой на Render из GitHub
1. На render.com создайте **Web Service**, выбрав ваш репозиторий и ветку `main`.
2. Build Command:
   ```
   npm install && npx prisma migrate deploy && npm run build
   ```
   Start Command: `npm start`
3. Задайте переменные окружения:
   - `DATABASE_URL=file:/var/data/dev.db` (или URL Postgres). Добавьте Persistent Disk `/var/data`, чтобы SQLite переживал рестарты.
   - `OPENROUTER_API_KEY=<ваш ключ>`
   - `OPENROUTER_MODEL=<модель>`
   - `ADMIN_PASSWORD=<секрет>`
4. Нажмите **Deploy**. При каждом push в `main` Render будет собирать новую версию автоматически.

## Перенос на Postgres (опционально)
1. Создайте БД и замените `DATABASE_URL`.
2. Обновите `prisma/schema.prisma` при необходимости и выполните `npx prisma migrate deploy`.

---
Для вопросов или доработок (websocket realtime, многоагрегатор, OAuth) — см. issues/PR.

