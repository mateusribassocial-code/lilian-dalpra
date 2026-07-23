import { NextRequest, NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { fetchMetaInsights } from '@/lib/meta'
import { META_CONFIG } from '@/lib/client.config'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const dateFrom = searchParams.get('from') ?? getDefaultFrom()
  const dateTo = searchParams.get('to') ?? getDefaultTo()

  const campaigns = await fetchMetaInsights(META_CONFIG.accountId, dateFrom, dateTo)
  return NextResponse.json({ campaigns })
}

function getDefaultFrom() {
  const d = new Date()
  d.setDate(1)
  return d.toISOString().split('T')[0]
}

function getDefaultTo() {
  return new Date().toISOString().split('T')[0]
}
