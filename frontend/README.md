# Каркас фронтенда

Копия [betty-rules](https://github.com/kirillchistov/betty-rules) на коммите `8003a2bc416903a2f4b6b3fd3af27c8747c51e0b` (`feat: restore mamtras`, 18.11.2026). Поздние правки betty-rules переносятся сюда вручную.

Сейчас здесь два слоя на устройстве, без сервера и без семьи. Типизированный клиент общего стола лежит в `src/api/` и экранами пока не вызывается: личные записи на API не уходят.

- Подросток: `#/teen/now` — чек-ин, старт и блок, точная просьба, дыхание, карточка, кризисный экран. Чек-ины, блоки, просьбы и карточка лежат в IndexedDB (`adolesson-teen`) и никуда не отправляются.
- «Моё»: `#/teen/moe/...` — затеи, истории, мантры. Данные в `localStorage` под ключом `svoy-kurs`. Выгрузка из старого «Моего курса» загружается в настройках «Моего».

Код «Моего» — копия [betty-rules](https://github.com/kirillchistov/betty-rules) на коммите `8003a2bc416903a2f4b6b3fd3af27c8747c51e0b` (`feat: restore mamtras`, 18.11.2026). Поздние правки betty-rules переносятся сюда вручную.

Адреса — hash. Прототип этапа 0 остаётся в `prototype/` на порту 5173 и на GitHub Pages.

```bash
cd frontend
npm install
npm run dev      # http://127.0.0.1:5174/
npm run build
```

Из корня репозитория: `make -C frontend dev`.
