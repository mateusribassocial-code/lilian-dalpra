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
}

// ── Filiais / Unidades ────────────────────────────────────────────────────────
// Cada filial pode ter múltiplas contas de Meta e Google Ads.
// Se o cliente não tiver filiais, deixe um único objeto com id: 'geral'.
export const FILIAIS = [
  {
    id: 'geral',
    label: 'Geral',
    metaAccounts: [{ id: '1278399991048623', label: 'Lilian Dalpra' }],
    googleAdsAccounts: [] as { id: string; label: string }[],
    budgetMeta: 0,
    budgetGoogle: 0,
    products: [],
  },
]

export type FilialConfig = typeof FILIAIS[number]
