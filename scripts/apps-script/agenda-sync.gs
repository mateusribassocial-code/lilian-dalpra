// Cria/atualiza evento no Google Agenda da corretora quando as colunas
// "Data Visita" e "Hora Visita" estiverem preenchidas na mesma linha da
// planilha CRM. Ver README.md -> "Automação (Agenda)" para o passo a passo
// de instalação (colar aqui dentro de Extensões > Apps Script da planilha,
// preencher CALENDAR_ID, e criar o acionador instalável de onEdit).

const CALENDAR_ID = 'PREENCHER_EMAIL_DA_AGENDA_DA_CORRETORA_AQUI'
const SHEET_NAME = 'Página1'

// Índice de coluna (1 = A, 2 = B, ...), seguindo a ordem real da planilha.
const COL = {
  NOME: 2,
  TELEFONE: 4,
  IMOVEL: 5,
  OBSERVACAO: 12,
  DATA_VISITA: 17,   // Q
  HORA_VISITA: 18,   // R
  EVENTO_ID: 19,     // S — guarda o ID do evento criado, pra atualizar em vez de duplicar
}

function onEditCreateVisitEvent(e) {
  const sheet = e.range.getSheet()
  if (sheet.getName() !== SHEET_NAME) return

  const editedCol = e.range.getColumn()
  if (editedCol !== COL.DATA_VISITA && editedCol !== COL.HORA_VISITA) return

  const row = e.range.getRow()
  if (row < 2) return

  const values = sheet.getRange(row, 1, 1, COL.EVENTO_ID).getValues()[0]

  const nome = values[COL.NOME - 1]
  const telefone = values[COL.TELEFONE - 1]
  const imovel = values[COL.IMOVEL - 1]
  const observacao = values[COL.OBSERVACAO - 1]
  const dataVisita = values[COL.DATA_VISITA - 1]
  const horaVisita = values[COL.HORA_VISITA - 1]
  const eventoId = values[COL.EVENTO_ID - 1]

  if (!dataVisita || !horaVisita || !nome) return

  const start = combineDateAndTime_(dataVisita, horaVisita)
  if (!start) return
  const end = new Date(start.getTime() + 60 * 60 * 1000) // 1h de duração

  const title = `Visita - ${nome} - ${imovel || 'Imóvel'}`
  const description = [
    telefone ? `Telefone: ${telefone}` : '',
    observacao ? `Observação: ${observacao}` : '',
  ].filter(Boolean).join('\n')

  const calendar = CalendarApp.getCalendarById(CALENDAR_ID)
  if (!calendar) throw new Error('Agenda não encontrada ou sem permissão: ' + CALENDAR_ID)

  if (eventoId) {
    const existing = calendar.getEventById(eventoId)
    if (existing) {
      existing.setTitle(title)
      existing.setDescription(description)
      existing.setTime(start, end)
      return
    }
  }

  const newEvent = calendar.createEvent(title, start, end, { description })
  sheet.getRange(row, COL.EVENTO_ID).setValue(newEvent.getId())
}

function combineDateAndTime_(dateValue, timeValue) {
  const date = dateValue instanceof Date ? dateValue : new Date(dateValue)
  const time = timeValue instanceof Date ? timeValue : new Date(timeValue)
  if (isNaN(date.getTime()) || isNaN(time.getTime())) return null

  return new Date(
    date.getFullYear(), date.getMonth(), date.getDate(),
    time.getHours(), time.getMinutes(), 0
  )
}
