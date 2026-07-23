'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { KpiCard } from '@/components/KpiCard'
import { KanbanBoard } from '@/components/KanbanBoard'
import { CLIENT, KANBAN_CONFIG, type KanbanStage } from '@/lib/client.config'
import type { CrmLead } from '@/lib/sheets'
import type { CampaignStageBreakdown } from '@/lib/kanban'
import type { Campaign } from '@/lib/types'

const brl2 = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2, maximumFractionDigits: 2 })
const num = (v: number) => v.toLocaleString('pt-BR')

const PERIOD_OPTIONS = [
  { label: 'Mês atual', value: 'current-month' },
  { label: 'Últimos 7 dias', value: '7d' },
  { label: 'Últimos 30 dias', value: '30d' },
  { label: 'Mês anterior', value: 'last-month' },
]

function getPeriodDates(period: string) {
  const now = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  const f = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
  if (period === 'current-month') return { from: f(new Date(now.getFullYear(), now.getMonth(), 1)), to: f(now) }
  if (period === '7d') { const d = new Date(now); d.setDate(d.getDate() - 7); return { from: f(d), to: f(now) } }
  if (period === '30d') { const d = new Date(now); d.setDate(d.getDate() - 30); return { from: f(d), to: f(now) } }
  if (period === 'last-month') return { from: f(new Date(now.getFullYear(), now.getMonth() - 1, 1)), to: f(new Date(now.getFullYear(), now.getMonth(), 0)) }
  return { from: f(new Date(now.getFullYear(), now.getMonth(), 1)), to: f(now) }
}

function Section({ title, icon, children, right }: { title: string; icon: string; children: React.ReactNode; right?: React.ReactNode }) {
  return (
    <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden shadow-sm">
      <div className="flex items-center justify-between gap-2 px-5 py-3 border-b border-zinc-200">
        <div className="flex items-center gap-2">
          <span>{icon}</span>
          <h3 className="text-sm font-semibold text-zinc-800">{title}</h3>
        </div>
        {right}
      </div>
      <div className="p-5">{children}</div>
    </div>
  )
}

export default function ClientDashboard() {
  const [leads, setLeads] = useState<CrmLead[]>([])
  const [board, setBoard] = useState<Record<KanbanStage, CrmLead[]> | null>(null)
  const [campaigns, setCampaigns] = useState<string[]>([])
  const [byCampaign, setByCampaign] = useState<CampaignStageBreakdown[]>([])
  const [loadingKanban, setLoadingKanban] = useState(true)
  const [selectedCampaign, setSelectedCampaign] = useState('all')
  const [moveError, setMoveError] = useState<string | null>(null)

  const [metaCampaigns, setMetaCampaigns] = useState<Campaign[]>([])
  const [loadingMeta, setLoadingMeta] = useState(true)
  const [period, setPeriod] = useState('current-month')

  const fetchKanban = useCallback(async () => {
    setLoadingKanban(true)
    try {
      const res = await fetch('/api/kanban')
      const data = await res.json()
      const all = Object.values(data.board as Record<KanbanStage, CrmLead[]>).flat()
      setLeads(all)
      setBoard(data.board)
      setCampaigns(data.campaigns ?? [])
      setByCampaign(data.byCampaign ?? [])
    } finally {
      setLoadingKanban(false)
    }
  }, [])

  useEffect(() => { fetchKanban() }, [fetchKanban])

  const moveLead = useCallback(async (rowNumber: number, toStage: KanbanStage) => {
    if (!board) return

    let fromStage: KanbanStage | undefined
    let moved: CrmLead | undefined
    for (const stage of KANBAN_CONFIG.stages) {
      const found = board[stage].find(l => l.rowNumber === rowNumber)
      if (found) { moved = found; fromStage = stage; break }
    }
    if (!moved || !fromStage || fromStage === toStage) return

    const prevBoard = board
    setBoard({
      ...board,
      [fromStage]: board[fromStage].filter(l => l.rowNumber !== rowNumber),
      [toStage]: [...board[toStage], { ...moved, etapaFunil: toStage }],
    })

    try {
      const res = await fetch('/api/kanban/stage', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rowNumber, stage: toStage }),
      })
      if (!res.ok) throw new Error('Falha ao salvar')
    } catch {
      setBoard(prevBoard)
      setMoveError('Não foi possível mover o lead — tente novamente.')
      setTimeout(() => setMoveError(null), 4000)
    }
  }, [board])

  useEffect(() => {
    const { from, to } = getPeriodDates(period)
    setLoadingMeta(true)
    fetch(`/api/meta?from=${from}&to=${to}`).then(r => r.json()).then(d => {
      setMetaCampaigns(d.campaigns ?? [])
      setLoadingMeta(false)
    }).catch(() => setLoadingMeta(false))
  }, [period])

  const filteredBoard = useMemo(() => {
    if (!board) return null
    if (selectedCampaign === 'all') return board
    const result = {} as Record<KanbanStage, CrmLead[]>
    for (const stage of KANBAN_CONFIG.stages) {
      result[stage] = (board[stage] ?? []).filter(l => l.campanha === selectedCampaign)
    }
    return result
  }, [board, selectedCampaign])

  const totalLeads = leads.length
  const totalSpend = metaCampaigns.reduce((s, c) => s + c.spend, 0)
  const totalMetaLeads = metaCampaigns.reduce((s, c) => s + c.leads, 0)
  const cpl = totalMetaLeads > 0 ? totalSpend / totalMetaLeads : 0

  const mergedCampaigns = useMemo(() => {
    return metaCampaigns.map(c => ({
      ...c,
      crm: byCampaign.find(b => b.campanha === c.name),
    })).sort((a, b) => b.spend - a.spend)
  }, [metaCampaigns, byCampaign])

  async function handleLogout() {
    await fetch('/api/auth', { method: 'DELETE' })
    window.location.href = '/login'
  }

  return (
    <div className="min-h-screen bg-[#EFEFEF]">
      <header className="border-b border-zinc-200 bg-white/70 backdrop-blur sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center text-white text-sm font-bold">
              {CLIENT.name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()}
            </div>
            <div>
              <h1 className="text-sm font-semibold text-[#2A2A28]">{CLIENT.name}</h1>
              <p className="text-xs text-zinc-500">CRM e Campanhas</p>
            </div>
          </div>
          <button onClick={handleLogout} className="text-zinc-500 hover:text-zinc-700 text-xs px-3 py-1.5 rounded-lg hover:bg-zinc-100 transition-colors">Sair</button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-5">
        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <KpiCard label="Leads no CRM" value={loadingKanban ? '—' : num(totalLeads)} loading={loadingKanban} color="blue" />
          <KpiCard label="Leads (Meta ADS)" value={loadingMeta ? '—' : num(totalMetaLeads)} loading={loadingMeta} color="purple" />
          <KpiCard label="Investimento" value={loadingMeta ? '—' : brl2(totalSpend)} loading={loadingMeta} color="orange" />
          <KpiCard label="CPL Médio" value={loadingMeta ? '—' : (cpl > 0 ? brl2(cpl) : '—')} loading={loadingMeta} color="green" />
        </div>

        {/* Kanban */}
        <Section
          title="Funil de Leads"
          icon="🗂️"
          right={
            <div className="flex items-center gap-2">
              {moveError && <span className="text-xs text-red-600">{moveError}</span>}
              <select
                value={selectedCampaign}
                onChange={e => setSelectedCampaign(e.target.value)}
                className="bg-white border border-zinc-300 text-zinc-700 text-xs rounded-lg px-3 py-1.5 focus:outline-none focus:border-blue-500 max-w-[240px]"
              >
                <option value="all">Todas as campanhas</option>
                {campaigns.map(c => <option key={c} value={c}>{c.replace(/^\[MAT\]\s*/i, '')}</option>)}
              </select>
              <button onClick={fetchKanban} className="text-xs text-zinc-500 hover:text-zinc-700 transition-colors px-2">↻</button>
            </div>
          }
        >
          {loadingKanban || !filteredBoard ? (
            <div className="flex gap-3 overflow-x-auto pb-4">
              {KANBAN_CONFIG.stages.map(s => (
                <div key={s} className="shrink-0 w-64">
                  <div className="h-8 bg-zinc-200 rounded animate-pulse mb-3" />
                  {[1, 2].map(i => <div key={i} className="h-24 bg-zinc-200 rounded-lg animate-pulse mb-2" />)}
                </div>
              ))}
            </div>
          ) : (
            <KanbanBoard board={filteredBoard} onMoveLead={moveLead} />
          )}
        </Section>

        {/* Campanhas: Ads + CRM */}
        <Section
          title="Campanhas — Investimento x Funil"
          icon="📊"
          right={
            <select value={period} onChange={e => setPeriod(e.target.value)} className="bg-white border border-zinc-300 text-zinc-700 text-xs rounded-lg px-3 py-1.5 focus:outline-none focus:border-blue-500">
              {PERIOD_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          }
        >
          {loadingMeta ? (
            <div className="space-y-2">{[1, 2, 3].map(i => <div key={i} className="h-10 bg-zinc-200 rounded animate-pulse" />)}</div>
          ) : mergedCampaigns.length === 0 ? (
            <p className="text-zinc-500 text-sm text-center py-6">Nenhuma campanha com dados no período</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-200">
                    {['Campanha', 'Gasto', 'Leads (Meta)', 'CPL', 'Leads no CRM', 'Ganho', 'Perdido'].map(h => (
                      <th key={h} className={`py-2 px-3 text-zinc-500 font-normal text-xs ${h === 'Campanha' ? 'text-left' : 'text-right'}`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {mergedCampaigns.map(c => (
                    <tr key={c.id} className="border-b border-zinc-100 hover:bg-zinc-50">
                      <td className="py-2.5 px-3 text-zinc-800 text-xs max-w-xs truncate">{c.name.replace(/^\[MAT\]\s*/i, '')}</td>
                      <td className="py-2.5 px-3 text-right text-orange-600">{brl2(c.spend)}</td>
                      <td className="py-2.5 px-3 text-right text-purple-600 font-semibold">{c.leads}</td>
                      <td className="py-2.5 px-3 text-right text-zinc-600">{c.leads > 0 ? brl2(c.spend / c.leads) : '—'}</td>
                      <td className="py-2.5 px-3 text-right text-blue-600 font-semibold">{c.crm?.total ?? 0}</td>
                      <td className="py-2.5 px-3 text-right text-emerald-600">{c.crm?.porEtapa['Ganho'] ?? 0}</td>
                      <td className="py-2.5 px-3 text-right text-red-600">{c.crm?.porEtapa['Perdido'] ?? 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Section>
      </main>
    </div>
  )
}
