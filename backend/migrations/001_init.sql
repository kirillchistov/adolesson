-- Общий стол и заметки родителя.
-- Чек-ины, журнал, блоки, самодиагностика и «Моё» сюда не добавляются.

CREATE TABLE families (
  id uuid PRIMARY KEY,
  name text NOT NULL,
  created_at timestamptz NOT NULL
);

CREATE TABLE members (
  id uuid PRIMARY KEY,
  family_id uuid NOT NULL REFERENCES families (id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('parent', 'teen')),
  display_name text NOT NULL,
  pronouns text NOT NULL CHECK (pronouns IN ('f', 'm', 'neutral')),
  login text NOT NULL UNIQUE,
  secret_hash text NOT NULL,
  created_at timestamptz NOT NULL
);

CREATE TABLE sessions (
  token text PRIMARY KEY,
  member_id uuid NOT NULL REFERENCES members (id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL
);

CREATE TABLE invitations (
  token text PRIMARY KEY,
  family_id uuid NOT NULL REFERENCES families (id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('parent', 'teen')),
  expires_at timestamptz NOT NULL,
  accepted_at timestamptz,
  created_at timestamptz NOT NULL
);

CREATE TABLE agreements (
  id uuid PRIMARY KEY,
  family_id uuid NOT NULL UNIQUE REFERENCES families (id) ON DELETE CASCADE,
  status text NOT NULL CHECK (status IN ('draft', 'active')),
  week_start text NOT NULL,
  priority text NOT NULL,
  result text NOT NULL,
  schedule text NOT NULL,
  min_on_hard_day text NOT NULL,
  parent_help text NOT NULL,
  how_to_say_stuck text NOT NULL,
  parents_dont text NOT NULL,
  review_at timestamptz NOT NULL
);

CREATE TABLE agreement_acceptances (
  agreement_id uuid NOT NULL REFERENCES agreements (id) ON DELETE CASCADE,
  member_id uuid NOT NULL REFERENCES members (id) ON DELETE CASCADE,
  accepted_at timestamptz NOT NULL,
  PRIMARY KEY (agreement_id, member_id)
);

CREATE TABLE signals (
  id uuid PRIMARY KEY,
  family_id uuid NOT NULL REFERENCES families (id) ON DELETE CASCADE,
  member_id uuid NOT NULL UNIQUE REFERENCES members (id) ON DELETE CASCADE,
  color text NOT NULL CHECK (color IN ('green', 'yellow', 'red')),
  at timestamptz NOT NULL
);

CREATE TABLE help_requests (
  id uuid PRIMARY KEY,
  family_id uuid NOT NULL REFERENCES families (id) ON DELETE CASCADE,
  from_id uuid NOT NULL REFERENCES members (id) ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN ('understand', 'signs', 'sit', 'start', 'big', 'own')),
  text text NOT NULL,
  status text NOT NULL CHECK (status IN ('sent', 'seen', 'scheduled', 'done')),
  reply text,
  at timestamptz NOT NULL
);

CREATE TABLE parent_notes (
  id uuid PRIMARY KEY,
  family_id uuid NOT NULL REFERENCES families (id) ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES members (id) ON DELETE CASCADE,
  visibility text NOT NULL CHECK (visibility IN ('self', 'parents')),
  kind text NOT NULL CHECK (kind IN ('observation', 'reaction', 'school')),
  text text NOT NULL,
  at timestamptz NOT NULL
);

CREATE INDEX members_family_idx ON members (family_id);
CREATE INDEX sessions_member_idx ON sessions (member_id);
CREATE INDEX invitations_family_idx ON invitations (family_id);
CREATE INDEX signals_family_idx ON signals (family_id);
CREATE INDEX help_requests_family_idx ON help_requests (family_id);
CREATE INDEX parent_notes_family_idx ON parent_notes (family_id);
