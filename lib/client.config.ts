// ─────────────────────────────────────────────────────────────────────────────
// CONFIGURAÇÃO DO CLIENTE
// Único arquivo que precisa mudar ao clonar este template para uma nova corretora.
// Ver README.md → "Clonar para uma nova corretora".
// ─────────────────────────────────────────────────────────────────────────────

export const CLIENT = {
  name: 'Lilian Dalpra',
}

export const FEATURES = {
  meta: true,
  kanban: true,
}

export const META_CONFIG = {
  accountId: '1278399991048623',
  accountLabel: 'Corretora Lilian Dalpra',
}

export const KANBAN_CONFIG = {
  spreadsheetId: '1VrUIKh2h1DQg7zx2w_gAtDZ4qWhwklgY9OvYMDRJVT8',
  sheetName: 'Página1',
  // Ordem exata das colunas na planilha CRM desta corretora (A, B, C... na ordem do array).
  // Se a corretora nova tiver colunas em ordem diferente, ajuste aqui — não precisa mexer no resto do código.
  columns: [
    'dataEntrada',   // A
    'nome',          // B
    'email',         // C
    'telefone',      // D
    'imovel',        // E
    'valor',         // F
    'etapaFunil',    // G
    'temperatura',   // H
    'ultimaAtualizacao', // I
    'agenda',        // J
    'tarefa',        // K
    'observacao',    // L
    'investidor',    // M
    'leadId',        // N
    'campanha',      // O
    'publico',       // P
    'dataVisita',    // Q
    'horaVisita',    // R
    'eventoAgendaId', // S — ID do evento no Google Agenda, preenchido pelo Apps Script (ver scripts/apps-script/agenda-sync.gs)
  ] as const,
  // Etapas do funil, na ordem em que aparecem no Kanban (da esquerda pra direita).
  // Ao mudar esta lista para uma nova corretora, o TypeScript vai apontar onde
  // atualizar as cores em components/KanbanBoard.tsx (STAGE_COLORS / STAGE_DOT).
  stages: [
    'Sem Contato',
    'Sondagem',
    'Escolha do Produto',
    'Visita',
    'Proposta',
    'Ganho',
    'Perdido',
  ] as const,
}

export type KanbanStage = typeof KANBAN_CONFIG.stages[number]
