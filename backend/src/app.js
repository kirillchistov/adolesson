import Fastify from 'fastify';
import cookie from '@fastify/cookie';
import addFormats from 'ajv-formats';
import { componentSchemas, ref } from './contract.js';
import { openDatabase } from './db.js';
import { createStore, StoreError } from './store.js';

const SESSION_COOKIE = 'session';

function notFound(reply, message = 'Не найдено') {
  return reply.code(404).send({ code: 'not_found', message });
}

function forbidden(reply, message) {
  return reply.code(403).send({ code: 'forbidden', message });
}

function unauthorized(reply) {
  return reply.code(401).send({ code: 'unauthorized', message: 'Нужно войти' });
}

/**
 * @param {{ logger?: boolean | object, database?: string }} [options]
 * database: `pglite` или строка подключения. По умолчанию DATABASE_URL.
 */
export async function buildApp({ logger = false, database } = {}) {
  const app = Fastify({
    logger,
    ajv: {
      customOptions: {
        removeAdditional: true,
        coerceTypes: false,
      },
      plugins: [addFormats],
    },
  });

  await app.register(cookie);

  const db = await openDatabase(database);
  const store = createStore(db);
  app.decorate('store', store);
  app.decorate('db', db);
  app.addHook('onClose', async () => {
    await store.close();
  });

  for (const schema of componentSchemas()) {
    app.addSchema(schema);
  }

  app.setErrorHandler((error, request, reply) => {
    if (error.validation) {
      reply.code(422).send({
        code: 'validation_error',
        message: 'Некорректные данные запроса',
        errors: error.validation.map((item) => ({
          field: item.instancePath.replace(/^\//, '') || String(item.params?.missingProperty ?? ''),
          message: item.message ?? 'invalid',
        })),
      });
      return;
    }
    if (error instanceof StoreError && error.code === 'conflict') {
      reply.code(409).send({ code: 'conflict', message: error.message });
      return;
    }
    request.log?.error?.(error);
    reply.code(500).send({ code: 'internal_error', message: 'Внутренняя ошибка сервера' });
  });

  app.setNotFoundHandler((request, reply) => {
    notFound(reply, 'Маршрут не найден');
  });

  app.get('/api/health', async () => ({ status: 'ok' }));

  const requireMember = async (request, reply) => {
    const session = await store.sessionByToken(request.cookies[SESSION_COOKIE]);
    if (!session) {
      unauthorized(reply);
      return;
    }
    request.session = session;
  };

  const setSessionCookie = (reply, token) => {
    reply.setCookie(SESSION_COOKIE, token, {
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
    });
  };

  const clearSessionCookie = (reply) => {
    reply.clearCookie(SESSION_COOKIE, { path: '/' });
  };

  app.post('/api/families', { schema: { body: ref('FamilyCreate') } }, async (request, reply) => {
    const { token, session } = await store.createFamily(request.body);
    setSessionCookie(reply, token);
    return reply.code(201).send(session);
  });

  app.post('/api/session', { schema: { body: ref('SessionCreate') } }, async (request, reply) => {
    const result = await store.login(request.body.login, request.body.secret);
    if (!result) {
      return unauthorized(reply);
    }
    setSessionCookie(reply, result.token);
    return result.session;
  });

  app.get('/api/session', { preHandler: requireMember }, async (request) => request.session);

  app.delete('/api/session', { preHandler: requireMember }, async (request, reply) => {
    await store.deleteSession(request.cookies[SESSION_COOKIE]);
    clearSessionCookie(reply);
    return reply.code(204).send();
  });

  app.post(
    '/api/invitations',
    { schema: { body: ref('InvitationCreate') }, preHandler: requireMember },
    async (request, reply) => {
      if (request.session.member.role !== 'parent') {
        return forbidden(reply, 'Приглашение создаёт родитель');
      }
      const invitation = await store.createInvitation(
        request.session.family.id,
        request.body.role,
      );
      return reply.code(201).send(invitation);
    },
  );

  app.get('/api/invitations/:token', async (request, reply) => {
    const preview = await store.invitationPreview(request.params.token);
    if (!preview) return notFound(reply, 'Приглашение недействительно');
    return preview;
  });

  app.post(
    '/api/invitations/:token/accept',
    { schema: { body: ref('InvitationAccept') } },
    async (request, reply) => {
      const result = await store.acceptInvitation(request.params.token, request.body);
      if (!result) return notFound(reply, 'Приглашение недействительно');
      setSessionCookie(reply, result.token);
      return reply.code(201).send(result.session);
    },
  );

  app.get('/api/members', { preHandler: requireMember }, async (request) =>
    store.listMembers(request.session.family.id),
  );

  app.patch(
    '/api/members/me',
    { schema: { body: ref('MemberUpdate') }, preHandler: requireMember },
    async (request) => store.updateMember(request.session.member.id, request.body),
  );

  app.get('/api/agreements/current', { preHandler: requireMember }, async (request, reply) => {
    const agreement = await store.getAgreement(request.session.family.id);
    if (!agreement) return notFound(reply, 'Договорённости ещё нет');
    return agreement;
  });

  app.put(
    '/api/agreements/current',
    { schema: { body: ref('AgreementWrite') }, preHandler: requireMember },
    async (request) => store.saveAgreement(request.session.family.id, request.body),
  );

  app.post(
    '/api/agreements/current/accept',
    { preHandler: requireMember },
    async (request, reply) => {
      const agreement = await store.acceptAgreement(
        request.session.family.id,
        request.session.member.id,
      );
      if (!agreement) return notFound(reply, 'Договорённости ещё нет');
      return agreement;
    },
  );

  app.get('/api/signals', { preHandler: requireMember }, async (request) =>
    store.listSignals(request.session.family.id),
  );

  app.put(
    '/api/signals/me',
    { schema: { body: ref('SignalWrite') }, preHandler: requireMember },
    async (request) =>
      store.putSignal(request.session.family.id, request.session.member.id, request.body.color),
  );

  app.get('/api/help-requests', { preHandler: requireMember }, async (request) =>
    store.listHelpRequests(request.session.family.id),
  );

  app.post(
    '/api/help-requests',
    { schema: { body: ref('HelpRequestCreate') }, preHandler: requireMember },
    async (request, reply) => {
      const created = await store.createHelpRequest(
        request.session.family.id,
        request.session.member.id,
        request.body,
      );
      return reply.code(201).send(created);
    },
  );

  app.patch(
    '/api/help-requests/:id',
    { schema: { body: ref('HelpRequestUpdate') }, preHandler: requireMember },
    async (request, reply) => {
      if (request.session.member.role !== 'parent') {
        return forbidden(reply, 'Статус просьбы меняет родитель');
      }
      const updated = await store.updateHelpRequest(
        request.session.family.id,
        request.params.id,
        request.body,
      );
      if (!updated) return notFound(reply, 'Просьба не найдена');
      return updated;
    },
  );

  app.get('/api/notes', { preHandler: requireMember }, async (request, reply) => {
    if (request.session.member.role !== 'parent') {
      return forbidden(reply, 'Заметки родителя подростку не показываются');
    }
    return store.listNotes(request.session.family.id, request.session.member.id);
  });

  app.post(
    '/api/notes',
    { schema: { body: ref('ParentNoteWrite') }, preHandler: requireMember },
    async (request, reply) => {
      if (request.session.member.role !== 'parent') {
        return forbidden(reply, 'Заметки родителя подростку не показываются');
      }
      const note = await store.createNote(
        request.session.family.id,
        request.session.member.id,
        request.body,
      );
      return reply.code(201).send(note);
    },
  );

  app.patch(
    '/api/notes/:id',
    { schema: { body: ref('ParentNoteWrite') }, preHandler: requireMember },
    async (request, reply) => {
      if (request.session.member.role !== 'parent') {
        return forbidden(reply, 'Заметки родителя подростку не показываются');
      }
      const note = await store.updateNote(
        request.session.family.id,
        request.session.member.id,
        request.params.id,
        request.body,
      );
      if (!note) return notFound(reply, 'Заметка не найдена');
      return note;
    },
  );

  app.delete('/api/notes/:id', { preHandler: requireMember }, async (request, reply) => {
    if (request.session.member.role !== 'parent') {
      return forbidden(reply, 'Заметки родителя подростку не показываются');
    }
    const removed = await store.deleteNote(
      request.session.family.id,
      request.session.member.id,
      request.params.id,
    );
    if (!removed) return notFound(reply, 'Заметка не найдена');
    return reply.code(204).send();
  });

  return app;
}
