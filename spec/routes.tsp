import "@typespec/http";
import "./models.tsp";

using Http;

namespace Adolesson;

/** Cookie-сессия участника семьи. */
alias SessionAuth = ApiKeyAuth<ApiKeyLocation.cookie, "session">;

@tag("Session")
@route("/api/session")
namespace SessionRoutes {
  /** Вход по логину и секрету. Ставит cookie `session`. */
  @post
  op login(@body credentials: SessionCreate): Session | UnauthorizedError | ValidationError;

  /** Кто сейчас вошёл. */
  @useAuth(SessionAuth)
  @get
  op current(): Session | UnauthorizedError;

  /** Выход. Снимает cookie. */
  @useAuth(SessionAuth)
  @delete
  op logout(): {
    @statusCode statusCode: 204;
  } | UnauthorizedError;
}

@tag("Family")
@route("/api/families")
namespace FamilyRoutes {
  /**
   * Родитель создаёт семью и сразу становится её участником.
   * 409 — логин уже занят.
   */
  @post
  op create(@body body: FamilyCreate): {
    @statusCode statusCode: 201;
    @body session: Session;
  } | ConflictError | ValidationError;
}

@tag("Invitations")
@route("/api/invitations")
namespace InvitationRoutes {
  /**
   * Родитель приглашает второго взрослого или подростка.
   * Один и тот же механизм, роль задаётся в теле. Подросток приглашение не создаёт.
   */
  @useAuth(SessionAuth)
  @post
  op create(@body body: InvitationCreate): {
    @statusCode statusCode: 201;
    @body invitation: Invitation;
  } | UnauthorizedError | ForbiddenError | ValidationError;

  /** Превью приглашения до регистрации. Сессия не нужна. */
  @get
  @route("/{token}")
  op preview(@path token: string): InvitationPreview | NotFoundError;

  /**
   * Принять приглашение: свой логин и секрет, своя сессия.
   * 404 — токен неизвестен, просрочен или уже использован.
   * 409 — логин занят.
   */
  @post
  @route("/{token}/accept")
  op accept(@path token: string, @body body: InvitationAccept): {
    @statusCode statusCode: 201;
    @body session: Session;
  } | NotFoundError | ConflictError | ValidationError;
}

@tag("Members")
@route("/api/members")
namespace MemberRoutes {
  /** Участники своей семьи: имя и роль, без секретов. */
  @useAuth(SessionAuth)
  @get
  op list(): Member[] | UnauthorizedError;

  /** Своё имя и форма рода. Роль приглашением не меняется. */
  @useAuth(SessionAuth)
  @patch
  @route("/me")
  op updateMe(@body body: MemberUpdate): Member | UnauthorizedError | ValidationError;
}

@tag("Agreements")
@route("/api/agreements/current")
namespace AgreementRoutes {
  /** Текущая договорённость семьи. 404 — ещё не начинали. */
  @useAuth(SessionAuth)
  @get
  op get(): Agreement | UnauthorizedError | NotFoundError;

  /**
   * Создать или заменить черновик. Может любой участник.
   * Принятия сбрасываются: после правки оба подтверждают заново.
   */
  @useAuth(SessionAuth)
  @put
  op save(@body body: AgreementWrite): Agreement | UnauthorizedError | ValidationError;

  /**
   * Текущий участник принимает договорённость.
   * Повторное нажатие ничего не меняет.
   * Статус становится active, когда среди принявших есть подросток и родитель.
   */
  @useAuth(SessionAuth)
  @post
  @route("/accept")
  op accept(): Agreement | UnauthorizedError | NotFoundError;
}

@tag("Signals")
@route("/api/signals")
namespace SignalRoutes {
  /** По одному текущему цвету на участника. Истории цветов нет. */
  @useAuth(SessionAuth)
  @get
  op list(): Signal[] | UnauthorizedError;

  /** Поставить свой цвет. Предыдущий свой цвет заменяется. */
  @useAuth(SessionAuth)
  @put
  @route("/me")
  op putMine(@body body: SignalWrite): Signal | UnauthorizedError | ValidationError;
}

@tag("Help requests")
@route("/api/help-requests")
namespace HelpRequestRoutes {
  /** Просьбы семьи. Содержимого личного журнала здесь нет. */
  @useAuth(SessionAuth)
  @get
  op list(): HelpRequest[] | UnauthorizedError;

  /** Автор — текущий участник. На стол попадает уже просмотренный им текст. */
  @useAuth(SessionAuth)
  @post
  op create(@body body: HelpRequestCreate): {
    @statusCode statusCode: 201;
    @body request: HelpRequest;
  } | UnauthorizedError | ValidationError;

  /**
   * Ответ родителя: вижу, договорились о времени, готово.
   * Подросток статус чужой или своей просьбы через этот метод не меняет.
   */
  @useAuth(SessionAuth)
  @patch
  @route("/{id}")
  op update(@path id: string, @body body: HelpRequestUpdate): HelpRequest | UnauthorizedError | ForbiddenError | NotFoundError | ValidationError;
}

@tag("Table notes")
@route("/api/table-notes")
namespace TableNoteRoutes {
  /** Фразы, которые участники сами положили на стол. Личной карты здесь нет. */
  @useAuth(SessionAuth)
  @get
  op list(): TableNote[] | UnauthorizedError;

  /**
   * Заменить свою фразу этого вида.
   * barrier и factor принимает только подросток, seen — только родитель.
   */
  @useAuth(SessionAuth)
  @put
  @route("/me")
  op putMine(@body body: TableNoteWrite): TableNote | UnauthorizedError | ForbiddenError | ValidationError;

  /** Убрать свою фразу. Чужую не видно: 404. */
  @useAuth(SessionAuth)
  @delete
  @route("/me/{kind}")
  op remove(@path kind: TableNoteKind): {
    @statusCode statusCode: 204;
  } | UnauthorizedError | ForbiddenError | NotFoundError;
}

@tag("Parent notes")
@route("/api/notes")
namespace ParentNoteRoutes {
  /**
   * Заметки, которые видит текущий родитель: свои и чужие с visibility `parents`.
   * Подростку — 403. Заметок подростка этот ресурс не хранит.
   */
  @useAuth(SessionAuth)
  @get
  op list(): ParentNote[] | UnauthorizedError | ForbiddenError;

  @useAuth(SessionAuth)
  @post
  op create(@body body: ParentNoteWrite): {
    @statusCode statusCode: 201;
    @body note: ParentNote;
  } | UnauthorizedError | ForbiddenError | ValidationError;

  /** Правит только автор. Чужая или невидимая заметка — 404. */
  @useAuth(SessionAuth)
  @patch
  @route("/{id}")
  op update(@path id: string, @body body: ParentNoteWrite): ParentNote | UnauthorizedError | ForbiddenError | NotFoundError | ValidationError;

  @useAuth(SessionAuth)
  @delete
  @route("/{id}")
  op remove(@path id: string): {
    @statusCode statusCode: 204;
  } | UnauthorizedError | ForbiddenError | NotFoundError;
}
