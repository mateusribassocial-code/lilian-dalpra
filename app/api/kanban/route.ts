import { NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { fetchCrmLeads } from '@/lib/sheets'
import { groupByStage } from '@/lib/kanban'

export async function GET() {
  const leads = await fetchCrmLeads()
  const board = groupByStage(leads)
  return NextResponse.json({ board, total: leads.length })
}
