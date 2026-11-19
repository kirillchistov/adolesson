import "@typespec/http";

using Http;

namespace Adolesson;

enum Role {
  parent,
  teen,
}

enum Pronouns {
  f,
  m,
  neutral,
}

enum SignalColor {
  green,
  yellow,
  red,
}

/** Просьба на общем столе. «Давай завтра» — это ответ в reply, статус seen или scheduled. */
enum HelpStatus {
  sent,
  seen,
  scheduled,
  done,
}

enum HelpKind {
  understand,
  signs,
  sit,
  start,
  big,
  own,
}

enum NoteVisibility {
  /** Только автор */
  self,
  /** Автор и другие родители семьи. Подросток не видит заметки. */
  parents,
}

enum NoteKind {
  observation,
  reaction,
  school,
}

enum AgreementStatus {
  /** Черновик: текст можно менять, принятия сброшены */
  draft,
  /** В силе: приняли подросток и хотя бы один родитель */
  active,
}

scalar Login extends string;

/** Семья. Создаёт родитель. */
model Family {
  @format("uuid")
  id: string;

  @minLength(1)
  @maxLength(80)
  name: string;

  createdAt: utcDateTime;
}

/** Участник семьи. Пароль и PIN в ответах не возвращаются. */
model Member {
  @format("uuid")
  id: string;

  role: Role;

  @minLength(1)
  @maxLength(80)
  displayName: string;

  pronouns: Pronouns;
}

model FamilyCreate {
  @minLength(1)
  @maxLength(80)
  name: string;

  @minLength(1)
  @maxLength(80)
  displayName: string;

  pronouns: Pronouns;

  /** Логин для входа. Латиница, цифры и дефис, 2–32 символа. */
  @pattern("^[a-z0-9]([a-z0-9-]{0,30}[a-z0-9])?$")
  login: Login;

  /** Пароль или PIN. На сервере хранится только в виде секрета, в ответах нет. */
  @minLength(4)
  @maxLength(64)
  secret: string;
}

model SessionCreate {
  @pattern("^[a-z0-9]([a-z0-9-]{0,30}[a-z0-9])?$")
  login: Login;

  @minLength(1)
  @maxLength(64)
  secret: string;
}

/** Текущая сессия. Cookie `session` выставляет сервер. */
model Session {
  member: Member;
  family: Family;
}

model MemberUpdate {
  @minLength(1)
  @maxLength(80)
  displayName?: string;

  pronouns?: Pronouns;
}

/** Приглашение по ссылке. Токен показывается создателю один раз. */
model Invitation {
  token: string;
  role: Role;
  expiresAt: utcDateTime;
}

/** То, что можно показать до принятия приглашения, без секретов семьи. */
model InvitationPreview {
  familyName: string;
  role: Role;
  expiresAt: utcDateTime;
}

model InvitationCreate {
  role: Role;
}

model InvitationAccept {
  @minLength(1)
  @maxLength(80)
  displayName: string;

  pronouns: Pronouns;

  @pattern("^[a-z0-9]([a-z0-9-]{0,30}[a-z0-9])?$")
  login: Login;

  @minLength(4)
  @maxLength(64)
  secret: string;
}

/**
 * Договорённость недели. Поле «чего родители не делают» обязательно.
 * Черновик может начать любой участник. В силу вступает, когда приняли
 * подросток и хотя бы один родитель.
 */
model Agreement {
  @format("uuid")
  id: string;

  status: AgreementStatus;

  weekStart: plainDate;

  @maxLength(500)
  priority: string;

  @maxLength(500)
  result: string;

  @maxLength(500)
  schedule: string;

  @maxLength(500)
  minOnHardDay: string;

  @maxLength(500)
  parentHelp: string;

  @maxLength(500)
  howToSayStuck: string;

  @minLength(1)
  @maxLength(500)
  parentsDont: string;

  reviewAt: utcDateTime;

  /** Идентификаторы участников, которые нажали «согласен». */
  acceptedBy: string[];
}

model AgreementWrite {
  weekStart: plainDate;

  @maxLength(500)
  priority: string;

  @maxLength(500)
  result: string;

  @maxLength(500)
  schedule: string;

  @maxLength(500)
  minOnHardDay: string;

  @maxLength(500)
  parentHelp: string;

  @maxLength(500)
  howToSayStuck: string;

  @minLength(1)
  @maxLength(500)
  parentsDont: string;

  reviewAt: utcDateTime;
}

/** Текущий цвет участника. Слов чек-ина здесь нет. */
model Signal {
  @format("uuid")
  id: string;

  @format("uuid")
  memberId: string;

  color: SignalColor;
  at: utcDateTime;
}

model SignalWrite {
  color: SignalColor;
}

model HelpRequest {
  @format("uuid")
  id: string;

  @format("uuid")
  fromId: string;

  kind: HelpKind;

  @minLength(1)
  @maxLength(1000)
  text: string;

  status: HelpStatus;

  @maxLength(500)
  reply?: string;

  at: utcDateTime;
}

model HelpRequestCreate {
  kind: HelpKind;

  @minLength(1)
  @maxLength(1000)
  text: string;
}

model HelpRequestUpdate {
  status: HelpStatus;

  @maxLength(500)
  reply?: string;
}

/**
 * Личная заметка родителя. Подросток эти записи не читает.
 * visibility `parents` открывает заметку другим родителям семьи, не подростку.
 */
model ParentNote {
  @format("uuid")
  id: string;

  @format("uuid")
  authorId: string;

  visibility: NoteVisibility;
  kind: NoteKind;

  @minLength(1)
  @maxLength(4000)
  text: string;

  at: utcDateTime;
}

model ParentNoteWrite {
  visibility: NoteVisibility;
  kind: NoteKind;

  @minLength(1)
  @maxLength(4000)
  text: string;
}

model FieldError {
  field: string;
  message: string;
}

@error
model UnauthorizedError {
  @statusCode statusCode: 401;
  code: "unauthorized";
  message: string;
}

@error
model ForbiddenError {
  @statusCode statusCode: 403;
  code: "forbidden";
  message: string;
}

@error
model NotFoundError {
  @statusCode statusCode: 404;
  code: "not_found";
  message: string;
}

@error
model ConflictError {
  @statusCode statusCode: 409;
  code: "conflict";
  message: string;
}

@error
model ValidationError {
  @statusCode statusCode: 422;
  code: "validation_error";
  message: string;
  errors?: FieldError[];
}
