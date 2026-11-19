import crypto from 'node:crypto';
import { hashSecret, verifySecret } from './passwords.js';

const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export class StoreError extends Error {
  constructor(code, message) {
    super(message);
    this.code = code;
  }
}

function isUniqueViolation(error) {
  return error?.code === '23505' || /unique/i.test(error?.message ?? '');
}

function iso(value) {
  return new Date(value).toISOString();
}

function memberView(row) {
  return {
    id: String(row.id),
    role: row.role,
    displayName: row.display_name,
    pronouns: row.pronouns,
  };
}

function familyView(row) {
  return {
    id: String(row.family_id ?? row.id),
    name: row.family_name ?? row.name,
    createdAt: iso(row.family_created_at ?? row.created_at),
  };
}

function sessionView(row) {
  return { member: memberView(row), family: familyView(row) };
}

export function createStore(db) {
  async function agreementView(query, row) {
    const accepted = await query(
      `SELECT member_id FROM agreement_acceptances
       WHERE agreement_id = $1 ORDER BY accepted_at, member_id`,
      [row.id],
    );
    return {
      id: String(row.id),
      status: row.status,
      weekStart: String(row.week_start),
      priority: row.priority,
      result: row.result,
      schedule: row.schedule,
      minOnHardDay: row.min_on_hard_day,
      parentHelp: row.parent_help,
      howToSayStuck: row.how_to_say_stuck,
      parentsDont: row.parents_dont,
      reviewAt: iso(row.review_at),
      acceptedBy: accepted.rows.map((item) => String(item.member_id)),
    };
  }

  async function loadAgreement(query, familyId) {
    const found = await query('SELECT * FROM agreements WHERE family_id = $1', [familyId]);
    if (!found.rows[0]) return null;
    return agreementView(query, found.rows[0]);
  }

  return {
    close: () => db.close(),

    async createFamily({ name, displayName, pronouns, login, secret }) {
      const familyId = crypto.randomUUID();
      const memberId = crypto.randomUUID();
      const now = new Date().toISOString();
      try {
        await db.transaction(async (query) => {
          await query('INSERT INTO families (id, name, created_at) VALUES ($1, $2, $3)', [
            familyId,
            name,
            now,
          ]);
          await query(
            `INSERT INTO members
              (id, family_id, role, display_name, pronouns, login, secret_hash, created_at)
             VALUES ($1, $2, 'parent', $3, $4, $5, $6, $7)`,
            [memberId, familyId, displayName, pronouns, login, hashSecret(secret), now],
          );
        });
      } catch (error) {
        if (isUniqueViolation(error)) {
          throw new StoreError('conflict', 'Такой логин уже занят');
        }
        throw error;
      }
      return this.createSession(memberId);
    },

    async createSession(memberId) {
      const token = crypto.randomBytes(32).toString('hex');
      await db.query(
        'INSERT INTO sessions (token, member_id, created_at) VALUES ($1, $2, $3)',
        [token, memberId, new Date().toISOString()],
      );
      const session = await this.sessionByToken(token);
      return { token, session };
    },

    async sessionByToken(token) {
      if (!token) return null;
      const found = await db.query(
        `SELECT m.id, m.role, m.display_name, m.pronouns,
                f.id AS family_id, f.name AS family_name, f.created_at AS family_created_at
         FROM sessions s
         JOIN members m ON m.id = s.member_id
         JOIN families f ON f.id = m.family_id
         WHERE s.token = $1`,
        [token],
      );
      return found.rows[0] ? sessionView(found.rows[0]) : null;
    },

    async deleteSession(token) {
      await db.query('DELETE FROM sessions WHERE token = $1', [token]);
    },

    async login(login, secret) {
      const found = await db.query(
        'SELECT id, secret_hash FROM members WHERE login = $1',
        [login],
      );
      const row = found.rows[0];
      if (!row || !verifySecret(secret, row.secret_hash)) return null;
      return this.createSession(row.id);
    },

    async createInvitation(familyId, role) {
      const token = crypto.randomBytes(24).toString('base64url');
      const now = new Date();
      const expiresAt = new Date(now.getTime() + INVITE_TTL_MS);
      await db.query(
        `INSERT INTO invitations (token, family_id, role, expires_at, created_at)
         VALUES ($1, $2, $3, $4, $5)`,
        [token, familyId, role, expiresAt.toISOString(), now.toISOString()],
      );
      return { token, role, expiresAt: expiresAt.toISOString() };
    },

    async invitationPreview(token) {
      const found = await db.query(
        `SELECT i.role, i.expires_at, i.accepted_at, f.name AS family_name
         FROM invitations i
         JOIN families f ON f.id = i.family_id
         WHERE i.token = $1`,
        [token],
      );
      const row = found.rows[0];
      if (!row || row.accepted_at || new Date(row.expires_at).getTime() <= Date.now()) return null;
      return {
        familyName: row.family_name,
        role: row.role,
        expiresAt: iso(row.expires_at),
      };
    },

    async acceptInvitation(token, { displayName, pronouns, login, secret }) {
      const found = await db.query(
        'SELECT family_id, role, expires_at, accepted_at FROM invitations WHERE token = $1',
        [token],
      );
      const invite = found.rows[0];
      if (!invite || invite.accepted_at || new Date(invite.expires_at).getTime() <= Date.now()) {
        return null;
      }
      const memberId = crypto.randomUUID();
      const now = new Date().toISOString();
      try {
        await db.transaction(async (query) => {
          const current = await query(
            `SELECT accepted_at, expires_at FROM invitations WHERE token = $1 FOR UPDATE`,
            [token],
          );
          const fresh = current.rows[0];
          if (!fresh || fresh.accepted_at || new Date(fresh.expires_at).getTime() <= Date.now()) {
            throw new StoreError('not_found', 'Приглашение недействительно');
          }
          await query(
            `INSERT INTO members
              (id, family_id, role, display_name, pronouns, login, secret_hash, created_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
            [
              memberId,
              invite.family_id,
              invite.role,
              displayName,
              pronouns,
              login,
              hashSecret(secret),
              now,
            ],
          );
          await query('UPDATE invitations SET accepted_at = $2 WHERE token = $1', [token, now]);
        });
      } catch (error) {
        if (error instanceof StoreError) return null;
        if (isUniqueViolation(error)) throw new StoreError('conflict', 'Такой логин уже занят');
        throw error;
      }
      return this.createSession(memberId);
    },

    async listMembers(familyId) {
      const found = await db.query(
        `SELECT id, role, display_name, pronouns FROM members
         WHERE family_id = $1 ORDER BY created_at, id`,
        [familyId],
      );
      return found.rows.map(memberView);
    },

    async updateMember(memberId, patch) {
      const sets = [];
      const params = [];
      if (patch.displayName !== undefined) {
        params.push(patch.displayName);
        sets.push(`display_name = $${params.length}`);
      }
      if (patch.pronouns !== undefined) {
        params.push(patch.pronouns);
        sets.push(`pronouns = $${params.length}`);
      }
      params.push(memberId);
      if (sets.length > 0) {
        await db.query(`UPDATE members SET ${sets.join(', ')} WHERE id = $${params.length}`, params);
      }
      const found = await db.query(
        'SELECT id, role, display_name, pronouns FROM members WHERE id = $1',
        [memberId],
      );
      return memberView(found.rows[0]);
    },

    getAgreement(familyId) {
      return loadAgreement(db.query, familyId);
    },

    async saveAgreement(familyId, body) {
      return db.transaction(async (query) => {
        const existing = await query('SELECT id FROM agreements WHERE family_id = $1', [familyId]);
        const values = [
          body.weekStart,
          body.priority,
          body.result,
          body.schedule,
          body.minOnHardDay,
          body.parentHelp,
          body.howToSayStuck,
          body.parentsDont,
          body.reviewAt,
        ];
        let agreementId = existing.rows[0]?.id;
        if (!agreementId) {
          agreementId = crypto.randomUUID();
          await query(
            `INSERT INTO agreements (
              id, family_id, status, week_start, priority, result, schedule,
              min_on_hard_day, parent_help, how_to_say_stuck, parents_dont, review_at
            ) VALUES ($1, $2, 'draft', $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
            [agreementId, familyId, ...values],
          );
        } else {
          await query(
            `UPDATE agreements SET
              status = 'draft', week_start = $2, priority = $3, result = $4, schedule = $5,
              min_on_hard_day = $6, parent_help = $7, how_to_say_stuck = $8,
              parents_dont = $9, review_at = $10
             WHERE id = $1`,
            [agreementId, ...values],
          );
          await query('DELETE FROM agreement_acceptances WHERE agreement_id = $1', [agreementId]);
        }
        return loadAgreement(query, familyId);
      });
    },

    async acceptAgreement(familyId, memberId) {
      return db.transaction(async (query) => {
        const existing = await query('SELECT id FROM agreements WHERE family_id = $1', [familyId]);
        if (!existing.rows[0]) return null;
        const agreementId = existing.rows[0].id;
        await query(
          `INSERT INTO agreement_acceptances (agreement_id, member_id, accepted_at)
           VALUES ($1, $2, $3) ON CONFLICT DO NOTHING`,
          [agreementId, memberId, new Date().toISOString()],
        );
        const roles = await query(
          `SELECT m.role FROM agreement_acceptances a
           JOIN members m ON m.id = a.member_id
           WHERE a.agreement_id = $1`,
          [agreementId],
        );
        const status =
          roles.rows.some((row) => row.role === 'parent') &&
          roles.rows.some((row) => row.role === 'teen')
            ? 'active'
            : 'draft';
        await query('UPDATE agreements SET status = $2 WHERE id = $1', [agreementId, status]);
        return loadAgreement(query, familyId);
      });
    },

    async listSignals(familyId) {
      const found = await db.query(
        `SELECT id, member_id, color, at FROM signals
         WHERE family_id = $1 ORDER BY at, member_id`,
        [familyId],
      );
      return found.rows.map(signalView);
    },

    async putSignal(familyId, memberId, color) {
      const now = new Date().toISOString();
      const existing = await db.query('SELECT id FROM signals WHERE member_id = $1', [memberId]);
      if (existing.rows[0]) {
        await db.query('UPDATE signals SET color = $2, at = $3 WHERE member_id = $1', [
          memberId,
          color,
          now,
        ]);
      } else {
        await db.query(
          `INSERT INTO signals (id, family_id, member_id, color, at)
           VALUES ($1, $2, $3, $4, $5)`,
          [crypto.randomUUID(), familyId, memberId, color, now],
        );
      }
      const found = await db.query(
        'SELECT id, member_id, color, at FROM signals WHERE member_id = $1',
        [memberId],
      );
      return signalView(found.rows[0]);
    },

    async listHelpRequests(familyId) {
      const found = await db.query(
        `SELECT id, from_id, kind, text, status, reply, at FROM help_requests
         WHERE family_id = $1 ORDER BY at DESC, id`,
        [familyId],
      );
      return found.rows.map(helpView);
    },

    async createHelpRequest(familyId, fromId, { kind, text }) {
      const id = crypto.randomUUID();
      const now = new Date().toISOString();
      await db.query(
        `INSERT INTO help_requests (id, family_id, from_id, kind, text, status, at)
         VALUES ($1, $2, $3, $4, $5, 'sent', $6)`,
        [id, familyId, fromId, kind, text, now],
      );
      const found = await db.query(
        'SELECT id, from_id, kind, text, status, reply, at FROM help_requests WHERE id = $1',
        [id],
      );
      return helpView(found.rows[0]);
    },

    async updateHelpRequest(familyId, id, { status, reply }) {
      if (!UUID_RE.test(String(id))) return null;
      const params = [status, id, familyId];
      let replySql = '';
      if (reply !== undefined) {
        params.push(reply);
        replySql = `, reply = $${params.length}`;
      }
      const updated = await db.query(
        `UPDATE help_requests SET status = $1${replySql}
         WHERE id = $2 AND family_id = $3
         RETURNING id, from_id, kind, text, status, reply, at`,
        params,
      );
      return updated.rows[0] ? helpView(updated.rows[0]) : null;
    },

    async listNotes(familyId, authorId) {
      const found = await db.query(
        `SELECT id, author_id, visibility, kind, text, at FROM parent_notes
         WHERE family_id = $1 AND (author_id = $2 OR visibility = 'parents')
         ORDER BY at DESC, id`,
        [familyId, authorId],
      );
      return found.rows.map(noteView);
    },

    async createNote(familyId, authorId, body) {
      const id = crypto.randomUUID();
      const now = new Date().toISOString();
      await db.query(
        `INSERT INTO parent_notes (id, family_id, author_id, visibility, kind, text, at)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [id, familyId, authorId, body.visibility, body.kind, body.text, now],
      );
      return noteView({
        id,
        author_id: authorId,
        visibility: body.visibility,
        kind: body.kind,
        text: body.text,
        at: now,
      });
    },

    async updateNote(familyId, authorId, id, body) {
      if (!UUID_RE.test(String(id))) return null;
      const updated = await db.query(
        `UPDATE parent_notes
         SET visibility = $4, kind = $5, text = $6
         WHERE id = $1 AND family_id = $2 AND author_id = $3
         RETURNING id, author_id, visibility, kind, text, at`,
        [id, familyId, authorId, body.visibility, body.kind, body.text],
      );
      return updated.rows[0] ? noteView(updated.rows[0]) : null;
    },

    async deleteNote(familyId, authorId, id) {
      if (!UUID_RE.test(String(id))) return false;
      const removed = await db.query(
        'DELETE FROM parent_notes WHERE id = $1 AND family_id = $2 AND author_id = $3 RETURNING id',
        [id, familyId, authorId],
      );
      return removed.rows.length > 0;
    },
  };
}

function signalView(row) {
  return {
    id: String(row.id),
    memberId: String(row.member_id),
    color: row.color,
    at: iso(row.at),
  };
}

function helpView(row) {
  const view = {
    id: String(row.id),
    fromId: String(row.from_id),
    kind: row.kind,
    text: row.text,
    status: row.status,
    at: iso(row.at),
  };
  if (row.reply != null) view.reply = row.reply;
  return view;
}

function noteView(row) {
  return {
    id: String(row.id),
    authorId: String(row.author_id),
    visibility: row.visibility,
    kind: row.kind,
    text: row.text,
    at: iso(row.at),
  };
}
