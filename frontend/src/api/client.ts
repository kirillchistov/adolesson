import createClient from 'openapi-fetch';
import type { components, paths } from './schema';

/**
 * Единственная точка обращения к API общего стола.
 * Пути и типы — из `src/api/schema.d.ts` (`npm run api:types`).
 * Экраны общего стола ходят сюда. Чек-ины, блоки, журнал и «Моё» — нет.
 * Dev-сервер проксирует `/api` на http://127.0.0.1:5001,
 * чтобы cookie `session` оставалась на origin фронтенда.
 */
export const api = createClient<paths>({
  baseUrl: '/',
  credentials: 'include',
});

export type { components };
export type Family = components['schemas']['Family'];
export type Member = components['schemas']['Member'];
export type Session = components['schemas']['Session'];
export type Invitation = components['schemas']['Invitation'];
export type InvitationPreview = components['schemas']['InvitationPreview'];
export type Agreement = components['schemas']['Agreement'];
export type AgreementWrite = components['schemas']['AgreementWrite'];
export type Signal = components['schemas']['Signal'];
export type HelpRequest = components['schemas']['HelpRequest'];
export type ParentNote = components['schemas']['ParentNote'];
