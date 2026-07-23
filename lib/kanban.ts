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

export function distinctCampaigns(leads: CrmLead[]): string[] {
  const set = new Set(leads.map(l => l.campanha).filter(Boolean))
  return Array.from(set).sort()
}

export interface CampaignStageBreakdown {
  campanha: string
  total: number
  porEtapa: Record<KanbanStage, number>
}

export function breakdownByCampaign(leads: CrmLead[]): CampaignStageBreakdown[] {
  const map = new Map<string, CampaignStageBreakdown>()

  for (const lead of leads) {
    const campanha = lead.campanha || '(sem campanha)'
    const stage = normalizeStage(lead.etapaFunil)

    if (!map.has(campanha)) {
      map.set(campanha, {
        campanha,
        total: 0,
        porEtapa: Object.fromEntries(KANBAN_CONFIG.stages.map(s => [s, 0])) as Record<KanbanStage, number>,
      })
    }

    const entry = map.get(campanha)!
    entry.total++
    entry.porEtapa[stage]++
  }

  return Array.from(map.values()).sort((a, b) => b.total - a.total)
}
