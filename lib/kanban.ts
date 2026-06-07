import { KANBAN_CONFIG } from './client.config'

export type KanbanStage = typeof KANBAN_CONFIG.stages[number]

export interface KanbanLead {
  id: string
  name: string
  phone: string
  campaign: string
  platform: string
  createdAt: string
  stage: KanbanStage
}

function parseCSVLine(line: string): string[] {
  const fields: string[] = []
  let current = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') { current += '"'; i++ }
      else inQuotes = !inQuotes
    } else if (char === ',' && !inQuotes) {
      fields.push(current.trim())
      current = ''
    } else {
      current += char
    }
  }
  fields.push(current.trim())
  return fields
}

function normalizeStage(value: string): KanbanStage {
  const v = value.trim()
  if ((KANBAN_CONFIG.stages as readonly string[]).includes(v)) return v as KanbanStage
  return 'Novo Lead'
}

export async function fetchKanbanLeads(): Promise<KanbanLead[]> {
  const { spreadsheetId } = KANBAN_CONFIG
  const url = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=csv`

  const res = await fetch(url, { next: { revalidate: 120 } })
  if (!res.ok) return []

  const text = await res.text()
  const lines = text.split('\n').filter(l => l.trim())
  if (lines.length < 2) return []

  // Linha 0 = cabeçalho, detecta índices dinamicamente
  const headers = parseCSVLine(lines[0]).map(h => h.toLowerCase().trim())
  const idx = {
    id: headers.findIndex(h => h === 'id'),
    createdAt: headers.findIndex(h => h === 'created_time'),
    campaign: headers.findIndex(h => h === 'campaign_name'),
    platform: headers.findIndex(h => h === 'platform'),
    name: headers.findIndex(h => h === 'nome_completo'),
    phone: headers.findIndex(h => h === 'telefone'),
    stage: headers.findIndex(h => h.includes('acompanhamento')),
  }

  return lines.slice(1)
    .map(line => parseCSVLine(line))
    .filter(cols => cols[idx.id]?.startsWith('l:'))
    .map(cols => ({
      id: cols[idx.id] ?? '',
      createdAt: cols[idx.createdAt]?.substring(0, 10) ?? '',
      campaign: cols[idx.campaign] ?? '',
      platform: cols[idx.platform] ?? '',
      name: cols[idx.name] ?? '',
      phone: (cols[idx.phone] ?? '').replace(/^p:/, ''),
      stage: normalizeStage(cols[idx.stage] ?? ''),
    }))
    .filter(l => l.id && l.name)
}

export function groupByStage(leads: KanbanLead[]): Record<KanbanStage, KanbanLead[]> {
  const result = Object.fromEntries(
    KANBAN_CONFIG.stages.map(s => [s, [] as KanbanLead[]])
  ) as Record<KanbanStage, KanbanLead[]>
  for (const lead of leads) result[lead.stage].push(lead)
  return result
}
