'use client'

import { useEffect, useState } from 'react'
import { KANBAN_CONFIG, type KanbanStage } from '@/lib/client.config'
import type { KanbanLead } from '@/lib/kanban'

const STAGE_COLORS: Record<string, string> = {
  'Novo Lead':             'border-zinc-600 bg-zinc-800/40',
  'Tentativa de Contato':  'border-blue-700 bg-blue-900/20',
  'Em atendimento':        'border-indigo-600 bg-indigo-900/20',
  'Visita':                'border-purple-600 bg-purple-900/20',
  'Proposta':              'border-orange-600 bg-orange-900/20',
  'Fechado':               'border-emerald-600 bg-emerald-900/20',
}

const STAGE_DOT: Record<string, string> = {
  'Novo Lead':             'bg-zinc-400',
  'Tentativa de Contato':  'bg-blue-400',
  'Em atendimento':        'bg-indigo-400',
  'Visita':                'bg-purple-400',
  'Proposta':              'bg-orange-400',
  'Fechado':               'bg-emerald-400',
}

function formatPhone(phone: string) {
  const n = phone.replace(/\D/g, '')
  if (n.length === 13) return `+${n.slice(0,2)} (${n.slice(2,4)}) ${n.slice(4,9)}-${n.slice(9)}`
  if (n.length === 11) return `(${n.slice(0,2)}) ${n.slice(2,7)}-${n.slice(7)}`
  return phone
}

function formatDate(iso: string) {
  if (!iso) return ''
  return iso.split('T')[0].split('-').reverse().join('/')
}

function LeadCard({ lead }: { lead: KanbanLead }) {
  const initials = lead.name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()
  return (
    <div className="bg-zinc-900 border border-zinc-700/50 rounded-lg p-3 hover:border-zinc-600 transition-colors">
      <div className="flex items-start gap-2.5">
        <div className="w-8 h-8 rounded-full bg-zinc-700 flex items-center justify-center text-xs font-semibold text-zinc-300 shrink-0">
          {initials}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-zinc-100 truncate">{lead.name}</p>
          <p className="text-xs text-zinc-500 mt-0.5">{formatPhone(lead.phone)}</p>
        </div>
      </div>
      <div className="mt-2.5 flex items-center justify-between gap-2">
        <span className="text-xs text-zinc-600 truncate">{lead.campaign.replace(/^\[MAT\]\s*/i, '')}</span>
        <span className="text-xs text-zinc-600 shrink-0">{formatDate(lead.createdAt)}</span>
      </div>
      {lead.platform && (
        <div className="mt-1.5">
          <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${lead.platform === 'ig' ? 'bg-pink-900/30 text-pink-400' : 'bg-blue-900/30 text-blue-400'}`}>
            {lead.platform === 'ig' ? 'Instagram' : 'Facebook'}
          </span>
        </div>
      )}
    </div>
  )
}

export function KanbanBoard() {
  const [board, setBoard] = useState<Record<string, KanbanLead[]> | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/kanban')
      .then(r => r.json())
      .then(d => { setBoard(d.board); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex gap-3 overflow-x-auto pb-4">
        {KANBAN_CONFIG.stages.map(s => (
          <div key={s} className="shrink-0 w-64">
            <div className="h-8 bg-zinc-800 rounded animate-pulse mb-3" />
            {[1,2,3].map(i => <div key={i} className="h-24 bg-zinc-800 rounded-lg animate-pulse mb-2" />)}
          </div>
        ))}
      </div>
    )
  }

  if (!board) return <p className="text-zinc-500 text-sm text-center py-8">Erro ao carregar Kanban</p>

  const total = Object.values(board).reduce((s, l) => s + l.length, 0)

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs text-zinc-500">{total} leads no funil</p>
        <button
          onClick={() => { setLoading(true); fetch('/api/kanban').then(r => r.json()).then(d => { setBoard(d.board); setLoading(false) }) }}
          className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
        >
          ↻ Atualizar
        </button>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-4">
        {(KANBAN_CONFIG.stages as readonly string[]).map(stage => {
          const leads = board[stage] ?? []
          return (
            <div key={stage} className="shrink-0 w-64">
              <div className={`flex items-center justify-between px-3 py-2 rounded-t-lg border-t border-x ${STAGE_COLORS[stage]}`}>
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${STAGE_DOT[stage]}`} />
                  <span className="text-xs font-semibold text-zinc-200">{stage}</span>
                </div>
                <span className="text-xs font-bold text-zinc-400 bg-zinc-800 rounded-full px-2 py-0.5">{leads.length}</span>
              </div>
              <div className={`rounded-b-lg border-b border-x p-2 space-y-2 min-h-24 ${STAGE_COLORS[stage]}`}>
                {leads.length === 0
                  ? <p className="text-xs text-zinc-600 text-center py-4">Vazio</p>
                  : leads.map(lead => <LeadCard key={lead.id} lead={lead} />)
                }
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
