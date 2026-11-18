# Каркас фронтенда

Копия [betty-rules](https://github.com/kirillchistov/betty-rules) на коммите `8003a2bc416903a2f4b6b3fd3af27c8747c51e0b` (`feat: restore mamtras`, 18.11.2026). Поздние правки betty-rules переносятся сюда вручную.

Сейчас здесь раздел «Моё»: затеи, истории, мантры, настройки. Данные лежат в `localStorage` этого браузера под ключом `svoy-kurs`. Выгрузка из старого «Моего курса» загружается в настройках.

Адреса — hash, с префиксом `#/teen/moe/...`. Прототип этапа 0 остаётся в `prototype/` на порту 5173 и на GitHub Pages.

```bash
cd frontend
npm install
npm run dev      # http://127.0.0.1:5174/
npm run build
```

Из корня репозитория: `make -C frontend dev`.
