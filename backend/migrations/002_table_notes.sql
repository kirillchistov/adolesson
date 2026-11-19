-- Фразы, которые автор сам положил на общий стол.
-- Баллы карты барьеров, ответы модуля B и личный слой сюда не пишутся.

CREATE TABLE table_notes (
  id uuid PRIMARY KEY,
  family_id uuid NOT NULL REFERENCES families (id) ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES members (id) ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN ('barrier', 'factor', 'seen')),
  text text NOT NULL,
  at timestamptz NOT NULL,
  UNIQUE (author_id, kind)
);
