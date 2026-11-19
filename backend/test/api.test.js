import assert from 'node:assert/strict';
import { test } from 'node:test';
import { buildApp } from '../src/app.js';

const sheet = {
  weekStart: '2026-11-16',
  priority: 'алгебра',
  result: 'три задачи',
  schedule: 'пн и ср, 19:00',
  minOnHardDay: 'открыть тетрадь',
  parentHelp: 'посидеть рядом',
  howToSayStuck: 'я застрял на задаче',
  parentsDont: 'не проверять дневник без спроса',
  reviewAt: '2026-11-22T16:00:00.000Z',
};

async function build() {
  return buildApp({ database: 'pglite' });
}

function cookieOf(response) {
  const raw = response.headers['set-cookie'];
  const header = Array.isArray(raw) ? raw.join(';') : String(raw ?? '');
  const match = /session=([^;]+)/.exec(header);
  assert.ok(match, 'cookie session');
  return { session: match[1] };
}

async function createFamily(app, login, name = 'Семья') {
  const response = await app.inject({
    method: 'POST',
    url: '/api/families',
    payload: {
      name,
      displayName: 'Родитель',
      pronouns: 'neutral',
      login,
      secret: '1234',
    },
  });
  assert.equal(response.statusCode, 201);
  return { cookies: cookieOf(response), body: response.json() };
}

async function acceptInvite(app, cookies, role, login) {
  const invitation = await app.inject({
    method: 'POST',
    url: '/api/invitations',
    cookies,
    payload: { role },
  });
  assert.equal(invitation.statusCode, 201);
  const token = invitation.json().token;
  const accepted = await app.inject({
    method: 'POST',
    url: `/api/invitations/${token}/accept`,
    payload: {
      displayName: role === 'teen' ? 'Подросток' : 'Второй взрослый',
      pronouns: 'f',
      login,
      secret: '5678',
    },
  });
  assert.equal(accepted.statusCode, 201);
  return { cookies: cookieOf(accepted), body: accepted.json(), token };
}

test('здоровье сервера не требует входа', async () => {
  const app = await build();
  const response = await app.inject({ method: 'GET', url: '/api/health' });
  assert.equal(response.statusCode, 200);
  assert.equal(response.json().status, 'ok');
  await app.close();
});

test('чужая семья не видит общий стол', async () => {
  const app = await build();
  const first = await createFamily(app, 'parent-a', 'Первая');
  const second = await createFamily(app, 'parent-b', 'Вторая');
  const teen = await acceptInvite(app, first.cookies, 'teen', 'teen-a');

  const saved = await app.inject({
    method: 'PUT',
    url: '/api/agreements/current',
    cookies: first.cookies,
    payload: sheet,
  });
  assert.equal(saved.statusCode, 200);

  await app.inject({
    method: 'PUT',
    url: '/api/signals/me',
    cookies: teen.cookies,
    payload: { color: 'yellow', words: 'слова чек-ина' },
  });
  const help = await app.inject({
    method: 'POST',
    url: '/api/help-requests',
    cookies: teen.cookies,
    payload: { kind: 'sit', text: 'Посиди рядом десять минут' },
  });
  assert.equal(help.statusCode, 201);
  await app.inject({
    method: 'POST',
    url: '/api/notes',
    cookies: first.cookies,
    payload: { visibility: 'parents', kind: 'observation', text: 'Сегодня открыла тетрадь сама' },
  });

  const foreignAgreement = await app.inject({
    method: 'GET',
    url: '/api/agreements/current',
    cookies: second.cookies,
  });
  assert.equal(foreignAgreement.statusCode, 404);

  const foreignSignals = await app.inject({
    method: 'GET',
    url: '/api/signals',
    cookies: second.cookies,
  });
  assert.deepEqual(foreignSignals.json(), []);

  const foreignHelp = await app.inject({
    method: 'GET',
    url: '/api/help-requests',
    cookies: second.cookies,
  });
  assert.deepEqual(foreignHelp.json(), []);

  const foreignMembers = await app.inject({
    method: 'GET',
    url: '/api/members',
    cookies: second.cookies,
  });
  assert.equal(foreignMembers.json().length, 1);
  assert.equal(foreignMembers.json()[0].displayName, 'Родитель');

  const foreignNotes = await app.inject({
    method: 'GET',
    url: '/api/notes',
    cookies: second.cookies,
  });
  assert.deepEqual(foreignNotes.json(), []);

  const foreignPatch = await app.inject({
    method: 'PATCH',
    url: `/api/help-requests/${help.json().id}`,
    cookies: second.cookies,
    payload: { status: 'seen' },
  });
  assert.equal(foreignPatch.statusCode, 404);

  const ownSignals = await app.inject({
    method: 'GET',
    url: '/api/signals',
    cookies: first.cookies,
  });
  assert.equal(ownSignals.json().length, 1);
  assert.equal(ownSignals.json()[0].color, 'yellow');
  assert.equal(ownSignals.json()[0].words, undefined);
  await app.close();
});

test('личный слой подростка не принимается', async () => {
  const app = await build();
  const family = await createFamily(app, 'parent-private');
  const paths = ['/api/check-ins', '/api/journal', '/api/blocks', '/api/diagnostics', '/api/moe'];
  for (const url of paths) {
    const response = await app.inject({
      method: 'POST',
      url,
      cookies: family.cookies,
      payload: { words: 'сегодня тяжело', text: 'личный текст' },
    });
    assert.equal(response.statusCode, 404, url);
    assert.equal(response.json().code, 'not_found');
    assert.equal(JSON.stringify(response.json()).includes('личный текст'), false);
  }

  const signal = await app.inject({
    method: 'PUT',
    url: '/api/signals/me',
    cookies: family.cookies,
    payload: { color: 'green', words: 'устал' },
  });
  assert.equal(signal.statusCode, 200);
  assert.deepEqual(Object.keys(signal.json()).sort(), ['at', 'color', 'id', 'memberId']);

  const dumped = JSON.stringify(
    (
      await app.inject({ method: 'GET', url: '/api/signals', cookies: family.cookies })
    ).json(),
  );
  assert.equal(dumped.includes('устал'), false);
  await app.close();
});

test('подросток не читает заметки родителя и не меняет статус просьбы', async () => {
  const app = await build();
  const parent = await createFamily(app, 'parent-notes');
  const teen = await acceptInvite(app, parent.cookies, 'teen', 'teen-notes');
  const note = await app.inject({
    method: 'POST',
    url: '/api/notes',
    cookies: parent.cookies,
    payload: { visibility: 'self', kind: 'reaction', text: 'хотел сказать «опять» и промолчал' },
  });
  assert.equal(note.statusCode, 201);

  const listed = await app.inject({ method: 'GET', url: '/api/notes', cookies: teen.cookies });
  assert.equal(listed.statusCode, 403);
  assert.equal(JSON.stringify(listed.json()).includes('промолчал'), false);

  const created = await app.inject({
    method: 'POST',
    url: '/api/notes',
    cookies: teen.cookies,
    payload: { visibility: 'parents', kind: 'school', text: 'не должна сохраниться' },
  });
  assert.equal(created.statusCode, 403);

  const help = await app.inject({
    method: 'POST',
    url: '/api/help-requests',
    cookies: teen.cookies,
    payload: { kind: 'start', text: 'Помоги начать с первой строки' },
  });
  const patched = await app.inject({
    method: 'PATCH',
    url: `/api/help-requests/${help.json().id}`,
    cookies: teen.cookies,
    payload: { status: 'done' },
  });
  assert.equal(patched.statusCode, 403);

  const invite = await app.inject({
    method: 'POST',
    url: '/api/invitations',
    cookies: teen.cookies,
    payload: { role: 'parent' },
  });
  assert.equal(invite.statusCode, 403);
  await app.close();
});

test('договорённость вступает в силу, когда приняли родитель и подросток', async () => {
  const app = await build();
  const parent = await createFamily(app, 'parent-agree');
  const teen = await acceptInvite(app, parent.cookies, 'teen', 'teen-agree');

  const draft = await app.inject({
    method: 'PUT',
    url: '/api/agreements/current',
    cookies: teen.cookies,
    payload: sheet,
  });
  assert.equal(draft.json().status, 'draft');
  assert.deepEqual(draft.json().acceptedBy, []);

  const parentOnly = await app.inject({
    method: 'POST',
    url: '/api/agreements/current/accept',
    cookies: parent.cookies,
  });
  assert.equal(parentOnly.json().status, 'draft');

  const again = await app.inject({
    method: 'POST',
    url: '/api/agreements/current/accept',
    cookies: parent.cookies,
  });
  assert.equal(again.json().acceptedBy.length, 1);

  const active = await app.inject({
    method: 'POST',
    url: '/api/agreements/current/accept',
    cookies: teen.cookies,
  });
  assert.equal(active.json().status, 'active');
  assert.equal(active.json().acceptedBy.length, 2);

  const edited = await app.inject({
    method: 'PUT',
    url: '/api/agreements/current',
    cookies: parent.cookies,
    payload: { ...sheet, result: 'две задачи' },
  });
  assert.equal(edited.json().status, 'draft');
  assert.deepEqual(edited.json().acceptedBy, []);
  assert.equal(edited.json().result, 'две задачи');
  await app.close();
});

test('заметку с пометкой «только я» другой родитель не видит', async () => {
  const app = await build();
  const parent = await createFamily(app, 'parent-one');
  const other = await acceptInvite(app, parent.cookies, 'parent', 'parent-two');
  const mine = await app.inject({
    method: 'POST',
    url: '/api/notes',
    cookies: parent.cookies,
    payload: { visibility: 'self', kind: 'observation', text: 'только мой черновик' },
  });
  await app.inject({
    method: 'POST',
    url: '/api/notes',
    cookies: parent.cookies,
    payload: { visibility: 'parents', kind: 'observation', text: 'можно другому взрослому' },
  });

  const visible = await app.inject({ method: 'GET', url: '/api/notes', cookies: other.cookies });
  assert.deepEqual(
    visible.json().map((note) => note.text),
    ['можно другому взрослому'],
  );

  const hidden = await app.inject({
    method: 'PATCH',
    url: `/api/notes/${mine.json().id}`,
    cookies: other.cookies,
    payload: { visibility: 'parents', kind: 'observation', text: 'только мой черновик' },
  });
  assert.equal(hidden.statusCode, 404);
  await app.close();
});

test('приглашение показывается до входа, занятый логин отвечает 409, просроченное не принимается', async () => {
  const app = await build();
  const parent = await createFamily(app, 'parent-invite');
  const invitation = await app.inject({
    method: 'POST',
    url: '/api/invitations',
    cookies: parent.cookies,
    payload: { role: 'teen' },
  });
  const token = invitation.json().token;

  const preview = await app.inject({ method: 'GET', url: `/api/invitations/${token}` });
  assert.equal(preview.statusCode, 200);
  assert.equal(preview.json().familyName, 'Семья');
  assert.equal(preview.json().role, 'teen');

  const duplicate = await app.inject({
    method: 'POST',
    url: '/api/families',
    payload: {
      name: 'Другая',
      displayName: 'Кто-то',
      pronouns: 'm',
      login: 'parent-invite',
      secret: '1234',
    },
  });
  assert.equal(duplicate.statusCode, 409);

  const taken = await app.inject({
    method: 'POST',
    url: `/api/invitations/${token}/accept`,
    payload: {
      displayName: 'Подросток',
      pronouns: 'm',
      login: 'parent-invite',
      secret: '5678',
    },
  });
  assert.equal(taken.statusCode, 409);

  const login = await app.inject({
    method: 'POST',
    url: '/api/session',
    payload: { login: 'parent-invite', secret: '1234' },
  });
  assert.equal(login.statusCode, 200);
  assert.equal(login.json().member.role, 'parent');
  assert.equal(JSON.stringify(login.json()).includes('1234'), false);

  const loggedOut = await app.inject({
    method: 'DELETE',
    url: '/api/session',
    cookies: cookieOf(login),
  });
  assert.equal(loggedOut.statusCode, 204);
  const after = await app.inject({
    method: 'GET',
    url: '/api/session',
    cookies: cookieOf(login),
  });
  assert.equal(after.statusCode, 401);

  await app.db.query(
    `UPDATE invitations SET expires_at = now() - interval '1 minute' WHERE token = $1`,
    [token],
  );
  const expired = await app.inject({
    method: 'POST',
    url: `/api/invitations/${token}/accept`,
    payload: {
      displayName: 'Подросток',
      pronouns: 'm',
      login: 'teen-late',
      secret: '5678',
    },
  });
  assert.equal(expired.statusCode, 404);
  await app.close();
});
