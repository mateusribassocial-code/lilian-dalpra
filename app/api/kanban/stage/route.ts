import { NextRequest, NextResponse } from 'next/server'
import { updateLeadStage } from '@/lib/sheets'
import { KANBAN_CONFIG, type KanbanStage } from '@/lib/client.config'

export async function PATCH(req: NextRequest) {
  const { rowNumber, stage } = await req.json()

  if (typeof rowNumber !== 'number' || !(KANBAN_CONFIG.stages as readonly string[]).includes(stage)) {
    return NextResponse.json({ error: 'Parâmetros inválidos' }, { status: 400 })
  }

  try {
    await updateLeadStage(rowNumber, stage as KanbanStage)
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[API] Erro ao atualizar etapa:', err)
    return NextResponse.json({ error: 'Falha ao atualizar planilha' }, { status: 500 })
  }
}
