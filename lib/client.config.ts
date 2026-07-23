// ─────────────────────────────────────────────────────────────────────────────
// CONFIGURAÇÃO DO CLIENTE
// Edite este arquivo ao clonar o template para um novo cliente.
// ─────────────────────────────────────────────────────────────────────────────

export const CLIENT = {
  name: 'LilianDalpra',
  website: 'liliandalpra.com.br',
}

// ── Feature flags ─────────────────────────────────────────────────────────────
// Ligue/desligue conforme as fontes de dados do cliente.
export const FEATURES = {
  meta: true,
  googleAds: false,
  ga4: false,
  crm: false as 'c2s' | 'datacrazy' | 'sheets' | false,
  kanban: true,
}

export const KANBAN_CONFIG = {
  spreadsheetId: '1VrUIKh2h1DQg7zx2w_gAtDZ4qWhwklgY9OvYMDRJVT8',
  sheetName: 'Página1',
  // Ordem exata das colunas na planilha CRM (mesmo padrão usado no dashboard da Jessica).
  columns: [
    'dataEntrada',    // A
    'nome',           // B
    'email',          // C
    'telefone',       // D
    'imovel',         // E
    'valor',          // F
    'etapaFunil',     // G
    'temperatura',    // H
    'ultimaAtualizacao', // I
    'agenda',         // J
    'tarefa',         // K
    'observacao',     // L
    'investidor',     // M
    'leadId',         // N
    'campanha',       // O
    'publico',        // P
    'dataVisita',     // Q
    'horaVisita',     // R
    'eventoAgendaId', // S — ID do evento no Google Agenda (ver scripts/apps-script/agenda-sync.gs)
  ] as const,
  stages: ['Sem Contato', 'Sondagem', 'Escolha do Produto', 'Visita', 'Proposta', 'Ganho', 'Perdido'] as const,
}

// ── Filiais / Unidades ────────────────────────────────────────────────────────
// Cada filial pode ter múltiplas contas de Meta e Google Ads.
// Se o cliente não tiver filiais, deixe um único objeto com id: 'geral'.
export const FILIAIS = [
  {
    id: 'geral',
    label: 'Geral',
    metaAccounts: [{ id: '1278399991048623', label: 'Corretora Lilian Dalpra' }],
    googleAdsAccounts: [] as { id: string; label: string }[],
    budgetMeta: 0,
    budgetGoogle: 0,
    products: [],
  },
]

export type FilialConfig = typeof FILIAIS[number]
export type KanbanStage = typeof KANBAN_CONFIG.stages[number]
