'use client'

import { useCallback, useEffect, useState } from 'react'
import { KANBAN_CONFIG, type KanbanStage } from '@/lib/client.config'
import type { CrmLead } from '@/lib/sheets'

const STAGE_COLORS: Record<KanbanStage, string> = {
  'Sem Contato':        'border-zinc-600 bg-zinc-800/40',
  'Sondagem':           'border-blue-700 bg-blue-900/20',
  'Escolha do Produto': 'border-indigo-600 bg-indigo-900/20',
  'Visita':             'border-purple-600 bg-purple-900/20',
  'Proposta':           'border-orange-600 bg-orange-900/20',
  'Ganho':              'border-emerald-600 bg-emerald-900/20',
  'Perdido':            'border-red-700 bg-red-900/10',
}

const STAGE_DOT: Record<KanbanStage, string> = {
  'Sem Contato':        'bg-zinc-400',
  'Sondagem':           'bg-blue-400',
  'Escolha do Produto': 'bg-indigo-400',
  'Visita':             'bg-purple-400',
  'Proposta':           'bg-orange-400',
  'Ganho':              'bg-emerald-400',
  'Perdido':            'bg-red-400',
}

function temperatureStyle(temp: string) {
  const t = temp.toLowerCase()
  if (t.includes('quente')) return 'bg-red-900/30 text-red-400'
  if (t.includes('morno')) return 'bg-orange-900/30 text-orange-400'
  if (t.includes('frio')) return 'bg-blue-900/30 text-blue-400'
  return 'bg-zinc-800 text-zinc-400'
}

function formatPhone(phone: string) {
  const n = phone.replace(/\D/g, '')
  if (n.length === 13) return `+${n.slice(0, 2)} (${n.slice(2, 4)}) ${n.slice(4, 9)}-${n.slice(9)}`
  if (n.length === 11) return `(${n.slice(0, 2)}) ${n.slice(2, 7)}-${n.slice(7)}`
  return phone
}

function formatDate(value: string) {
  if (!value) return ''
  if (value.includes('T')) return value.split('T')[0].split('-').reverse().join('/')
  return value
}

function whatsappLink(phone: string) {
  const n = phone.replace(/\D/g, '')
  const withCountryCode = n.length === 11 ? `55${n}` : n
  return `https://wa.me/${withCountryCode}`
}

function LeadCard({ lead, onDragStart, onDragEnd }: {
  lead: CrmLead
  onDragStart: (e: React.DragEvent) => void
  onDragEnd: (e: React.DragEvent) => void
}) {
  const initials = lead.nome.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()
  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      className="bg-zinc-900 border border-zinc-700/50 rounded-lg p-3 hover:border-zinc-600 transition-colors cursor-grab active:cursor-grabbing"
    >
      <div className="flex items-start gap-2.5">
        <div className="w-8 h-8 rounded-full bg-zinc-700 flex items-center justify-center text-xs font-semibold text-zinc-300 shrink-0">
          {initials}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-zinc-100 truncate">{lead.nome}</p>
          <p className="text-xs text-zinc-500 mt-0.5">{formatPhone(lead.telefone)}</p>
        </div>
        {lead.telefone && (
          <a
            href={whatsappLink(lead.telefone)}
            target="_blank"
            rel="noopener noreferrer"
            title="Chamar no WhatsApp"
            draggable={false}
            className="shrink-0 w-7 h-7 rounded-full bg-emerald-900/30 hover:bg-emerald-900/50 flex items-center justify-center text-emerald-400 transition-colors"
          >
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
              <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.48 1.32 5L2 22l5.25-1.38a9.9 9.9 0 004.79 1.22h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0012.04 2zm5.8 14.14c-.24.68-1.4 1.32-1.93 1.4-.5.08-1.12.11-1.8-.11a17 17 0 01-1.71-.63c-2.86-1.24-4.7-4.13-4.85-4.32-.14-.19-1.16-1.54-1.16-2.94s.73-2.08.99-2.36c.26-.29.57-.36.76-.36h.55c.18 0 .42-.07.66.5.24.58.82 2 .89 2.15.07.15.12.32.02.51-.1.19-.15.31-.29.48-.15.17-.31.38-.44.5-.15.15-.3.31-.13.6.17.29.76 1.25 1.63 2.02 1.12.99 2.06 1.3 2.35 1.45.29.15.46.13.63-.08.17-.21.71-.83.9-1.11.19-.29.38-.24.63-.15.26.1 1.64.77 1.92.91.28.14.47.21.54.33.07.12.07.68-.17 1.36z"/>
            </svg>
          </a>
        )}
      </div>
      <div className="mt-2.5 flex items-center justify-between gap-2">
        <span className="text-xs text-zinc-600 truncate">{lead.campanha.replace(/^\[MAT\]\s*/i, '') || 'sem campanha'}</span>
        <span className="text-xs text-zinc-600 shrink-0">{formatDate(lead.dataEntrada)}</span>
      </div>
      {lead.temperatura && (
        <div className="mt-1.5">
          <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${temperatureStyle(lead.temperatura)}`}>
            {lead.temperatura}
          </span>
        </div>
      )}
    </div>
  )
}

export function KanbanBoard() {
  const [board, setBoard] = useState<Record<KanbanStage, CrmLead[]> | null>(null)
  const [loading, setLoading] = useState(true)
  const [dragOverStage, setDragOverStage] = useState<KanbanStage | null>(null)
  const [moveError, setMoveError] = useState<string | null>(null)

  const fetchBoard = useCallback(() => {
    setLoading(true)
    return fetch('/api/kanban')
      .then(r => r.json())
      .then(d => { setBoard(d.board); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  useEffect(() => { fetchBoard() }, [fetchBoard])

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

  if (loading) {
    return (
      <div className="flex gap-3 overflow-x-auto pb-4">
        {KANBAN_CONFIG.stages.map(s => (
          <div key={s} className="shrink-0 w-64">
            <div className="h-8 bg-zinc-800 rounded animate-pulse mb-3" />
            {[1, 2, 3].map(i => <div key={i} className="h-24 bg-zinc-800 rounded-lg animate-pulse mb-2" />)}
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
        <div className="flex items-center gap-3">
          {moveError && <span className="text-xs text-red-400">{moveError}</span>}
          <button onClick={fetchBoard} className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors">
            ↻ Atualizar
          </button>
        </div>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-4">
        {(KANBAN_CONFIG.stages as readonly KanbanStage[]).map(stage => {
          const leads = board[stage] ?? []
          return (
            <div key={stage} className="shrink-0 w-64">
              <div
                onDragOver={e => { e.preventDefault(); setDragOverStage(stage) }}
                onDragLeave={() => setDragOverStage(s => (s === stage ? null : s))}
                onDrop={e => {
                  e.preventDefault()
                  setDragOverStage(null)
                  const rowNumber = Number(e.dataTransfer.getData('text/plain'))
                  if (rowNumber) moveLead(rowNumber, stage)
                }}
                className={`rounded-lg transition-shadow ${dragOverStage === stage ? 'ring-2 ring-blue-500' : ''}`}
              >
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
                    : leads.map(lead => (
                        <LeadCard
                          key={lead.leadId || lead.rowNumber}
                          lead={lead}
                          onDragStart={e => {
                            e.dataTransfer.setData('text/plain', String(lead.rowNumber))
                            e.dataTransfer.effectAllowed = 'move'
                          }}
                          onDragEnd={() => setDragOverStage(null)}
                        />
                      ))
                  }
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
