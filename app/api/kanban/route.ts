import { NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { fetchCrmLeads } from '@/lib/sheets'
import { groupByStage, distinctCampaigns, breakdownByCampaign } from '@/lib/kanban'

export async function GET() {
  const leads = await fetchCrmLeads()
  const board = groupByStage(leads)
  const campaigns = distinctCampaigns(leads)
  const byCampaign = breakdownByCampaign(leads)

  return NextResponse.json({ board, total: leads.length, campaigns, byCampaign })
}
