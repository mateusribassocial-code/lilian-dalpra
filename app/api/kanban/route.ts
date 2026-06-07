import { NextResponse } from 'next/server'
import { fetchKanbanLeads, groupByStage } from '@/lib/kanban'

export async function GET() {
  const leads = await fetchKanbanLeads()
  const board = groupByStage(leads)
  return NextResponse.json({ board, total: leads.length })
}
