import { KANBAN_CONFIG, KanbanStage } from './client.config'
import { CrmLead } from './sheets'

const FALLBACK_STAGE: KanbanStage = 'Sem Contato'

function normalizeStage(value: string): KanbanStage {
  const v = value.trim()
  if ((KANBAN_CONFIG.stages as readonly string[]).includes(v)) return v as KanbanStage
  return FALLBACK_STAGE
}

export function groupByStage(leads: CrmLead[]): Record<KanbanStage, CrmLead[]> {
  const board = Object.fromEntries(
    KANBAN_CONFIG.stages.map(s => [s, [] as CrmLead[]])
  ) as Record<KanbanStage, CrmLead[]>

  for (const lead of leads) {
    const stage = normalizeStage(lead.etapaFunil)
    board[stage].push(lead)
  }
  return board
}
