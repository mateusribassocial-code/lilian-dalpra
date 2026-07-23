import { google } from 'googleapis'
import { KANBAN_CONFIG, type KanbanStage } from './client.config'

export interface CrmLead {
  dataEntrada: string
  nome: string
  email: string
  telefone: string
  imovel: string
  valor: string
  etapaFunil: string
  temperatura: string
  ultimaAtualizacao: string
  agenda: string
  tarefa: string
  observacao: string
  investidor: string
  leadId: string
  campanha: string
  publico: string
  dataVisita: string
  horaVisita: string
  eventoAgendaId: string
  rowNumber: number
}

function getAuth() {
  const email = process.env.SHEETS_CLIENT_EMAIL
  const key = (process.env.SHEETS_PRIVATE_KEY ?? '').replace(/\\n/g, '\n')
  if (!email || !key) return null

  return new google.auth.JWT({
    email,
    key,
    // Escrita (não só leitura) é necessária pro drag-and-drop do Kanban atualizar a Etapa de Funil.
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  })
}

function columnLetter(index: number): string {
  let n = index + 1
  let letter = ''
  while (n > 0) {
    const rem = (n - 1) % 26
    letter = String.fromCharCode(65 + rem) + letter
    n = Math.floor((n - 1) / 26)
  }
  return letter
}

export async function fetchCrmLeads(): Promise<CrmLead[]> {
  const auth = getAuth()
  if (!auth) return []

  const { spreadsheetId, sheetName, columns } = KANBAN_CONFIG

  try {
    const sheets = google.sheets({ version: 'v4', auth })
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${sheetName}!A2:S`,
    })

    const rows = res.data.values ?? []

    return rows
      .map((row, i) => {
        const lead = {} as Record<string, string>
        columns.forEach((col, idx) => { lead[col] = (row[idx] ?? '').toString().trim() })
        return { ...lead, rowNumber: i + 2 } as CrmLead
      })
      .filter(lead => lead.nome)
  } catch (err) {
    console.error('[Sheets] Erro ao ler CRM:', err)
    return []
  }
}

export async function updateLeadStage(rowNumber: number, stage: KanbanStage): Promise<void> {
  const auth = getAuth()
  if (!auth) throw new Error('Credenciais do Google Sheets não configuradas')

  const { spreadsheetId, sheetName, columns } = KANBAN_CONFIG
  const colIndex = columns.indexOf('etapaFunil')
  if (colIndex === -1) throw new Error('Coluna etapaFunil não encontrada em KANBAN_CONFIG.columns')
  const col = columnLetter(colIndex)

  const sheets = google.sheets({ version: 'v4', auth })
  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `${sheetName}!${col}${rowNumber}`,
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: [[stage]] },
  })
}
