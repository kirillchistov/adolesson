import { api, type Agreement, type HelpRequest, type Member, type Signal } from '../api/client'

export type TableData = {
  agreement: Agreement | null
  signals: Signal[]
  requests: HelpRequest[]
  members: Member[]
}

export async function loadTable(): Promise<TableData> {
  const [agreementRes, signalsRes, helpRes, membersRes] = await Promise.all([
    api.GET('/api/agreements/current'),
    api.GET('/api/signals'),
    api.GET('/api/help-requests'),
    api.GET('/api/members'),
  ])
  if (signalsRes.response.status === 401) {
    throw new Error('Нужно войти')
  }
  if (!signalsRes.response.ok || !helpRes.response.ok || !membersRes.response.ok) {
    throw new Error('Стол сейчас не открывается')
  }
  return {
    agreement: agreementRes.response.status === 404 ? null : (agreementRes.data ?? null),
    signals: signalsRes.data ?? [],
    requests: helpRes.data ?? [],
    members: membersRes.data ?? [],
  }
}

export function memberName(members: Member[], id: string) {
  return members.find((member) => member.id === id)?.displayName ?? 'Участник'
}
