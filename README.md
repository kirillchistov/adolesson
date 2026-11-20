# adolesson

Адаптивное веб-приложение для семьи: отдельные входы для родителей и подростка,
8-недельный маршрут поддержки учёбы без давления и ярлыков.

Это семейный инструмент, а не медицинская диагностика.

## Документы

- [Концепция приложения](docs/app-concept.md) — роли, приватность, мини-диагностика, экраны, техника, этапы.
- [Черновой план поддержки](docs/support-concept.md) — содержательная основа: маршрут, чек-листы, практики.
- [Источники](docs/sources.md) — проверенные ссылки (UNICEF, ВОЗ, NICE, исследования).
- [Дорожная карта](docs/project-roadmap.md) — порядок сборки и критерии выхода из этапов.
- [Выкладка пилота](docs/cloud-deploy.md) — Vercel и существующий Supabase, схема `adolesson`.
- [Выкладка в Yandex Cloud](docs/cloud-deploy-ru.md) — когда на сервере появятся данные реальной семьи.

## Прототип

Кликабельный прототип этапа 0 на React с мок-данными — в [prototype/](prototype/README.md).
`package.json` лежит там, не в корне: из корня репозитория ставят зависимости и запускают через Makefile.

```bash
make install
make dev       # http://127.0.0.1:5173/
```

С телефона в той же сети подойдёт сетевой адрес из вывода Vite. Сборка: `make build`, просмотр собранного сайта: `make preview`.

Каркас приложения, скопированный из betty-rules, — в [frontend/](frontend/README.md). Он запускается отдельно: `make -C frontend dev` на http://127.0.0.1:5174/ .

Контракт общего стола — TypeSpec в `spec/`. Из корня: `npm install && npm run spec:build` (или `make spec`). Собранный файл `docs/api/openapi.yaml` руками не правят. Типы клиента: `cd frontend && npm run api:types`.

Локальный API — в [backend/](backend/). `make db` поднимает PostgreSQL, затем `cd backend && cp .env.example .env && npm install && npm run dev` (http://127.0.0.1:5001). Проверки доступа: `cd backend && npm test`.

## GitHub Pages

Сайт статический, адреса относительные, экраны открываются через `#`. После выкладки страница доступна по ссылке:

`https://<логин>.github.io/<репозиторий>/`

1. Залить проект на GitHub, ветка `main`.
2. Settings → Pages → Build and deployment → Source: **GitHub Actions**.
3. Пуш в `main` запускает [`.github/workflows/pages.yml`](.github/workflows/pages.yml): он собирает `prototype/dist` и публикует его.

Записи прототипа остаются в браузере устройства, это не общая база.

## Для разработчиков и агентов

Правила репозитория, формат коммитов и проверки — в [AGENTS.md](AGENTS.md).
