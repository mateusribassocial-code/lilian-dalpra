# Dashboard de Performance — Template

Dashboard Next.js para clientes de mídia paga. Integra Meta ADS, Google ADS, Google Analytics GA4 e CRM (Contact 2 Sales, Datacrazy ou Google Sheets).

---

## Setup para novo cliente

### 1. Editar `lib/client.config.ts`

```ts
export const CLIENT = {
  name: 'Nome do Cliente',
  website: 'sitedocliente.com.br',
}

export const FEATURES = {
  meta: true,         // Meta ADS ativo?
  googleAds: false,   // Google ADS ativo?
  ga4: true,          // GA4 ativo?
  crm: 'c2s',        // 'c2s' | 'datacrazy' | 'sheets' | false
}

export const FILIAIS = [
  {
    id: 'geral',                    // slug único, sem acento
    label: 'Geral',                 // nome exibido na aba
    metaAccounts: [
      { id: '123456789', label: 'Conta Principal' },
    ],
    googleAdsAccounts: [],          // vazio se googleAds: false
    budgetMeta: 5000,
    budgetGoogle: 0,
    products: ['Produto A', 'Produto B'],
  },
]
```

### 2. Criar `.env.local`

```bash
cp .env.example .env.local
# Preencha os valores conforme as fontes ativas
```

### 3. Rodar localmente

```bash
npm install
npm run dev
# Acesse http://localhost:3000/dashboard
```

### 4. Criar repositório no GitHub

```bash
git init
git add .
git commit -m "feat: setup [nome do cliente]"
git remote add origin https://github.com/seu-usuario/dashboard-[cliente].git
git push -u origin main
```

### 5. Deploy no Vercel

1. Importar o repositório em vercel.com
2. Em **Settings → Environment Variables**, adicionar todas as variáveis do `.env.local`
3. Redeploy

---

## Fontes de dados

| Feature flag | Env vars necessárias |
|---|---|
| `meta: true` | `META_ACCESS_TOKEN`, `META_APP_ID`, `META_APP_SECRET` |
| `googleAds: true` | `GOOGLE_ADS_*` (4 vars) |
| `ga4: true` | `GA4_PROPERTY_ID`, `GA4_CLIENT_ID`, `GA4_CLIENT_SECRET`, `GA4_REFRESH_TOKEN` |
| `crm: 'c2s'` | `C2S_API_TOKEN` |
| `crm: 'datacrazy'` | `DATACRAZY_API_KEY`, `DATACRAZY_ACCOUNT_ID` |
| `crm: 'sheets'` | `SHEETS_SPREADSHEET_ID`, `SHEETS_CLIENT_EMAIL`, `SHEETS_PRIVATE_KEY` |

---

## Kanban CRM (aba "Kanban") — Google Sheets com escrita

O Kanban lê e **escreve** na planilha `KANBAN_CONFIG.spreadsheetId` (`lib/client.config.ts`) via Service Account do Google Cloud (`lib/sheets.ts`), mesmo padrão usado no dashboard da Jessica Corrêa (`Dashboard Individual`). Os cards podem ser arrastados entre colunas — isso grava a nova Etapa de Funil direto na planilha (`PATCH /api/kanban/stage`). Cada card tem um botão de WhatsApp (`wa.me/<telefone>`).

**Setup:**
1. No Google Cloud Console, use a mesma Service Account já criada para outros clientes (ou crie uma nova) e compartilhe a planilha CRM da corretora com o `client_email` dela, permissão de **Editor** (não só Leitor — o Kanban escreve, não só lê).
2. No `.env.local`/Vercel, preencha `SHEETS_CLIENT_EMAIL` e `SHEETS_PRIVATE_KEY` (mesmas variáveis usadas no template da Jessica).
3. Se a escrita falhar (ex: permissão insuficiente), o card volta pro lugar no drag-and-drop e mostra um aviso — não é erro silencioso.

### Automação (Agenda) — Data Visita → Google Agenda

Se a planilha tiver as colunas `Data Visita` / `Hora Visita` / (ID Evento Agenda), um Google Apps Script amarrado na própria planilha pode criar/atualizar eventos na Agenda da corretora automaticamente. Fonte: [`scripts/apps-script/agenda-sync.gs`](scripts/apps-script/agenda-sync.gs). Passo a passo completo (compartilhar agenda, colar script, criar acionador instalável) está documentado no README do template original (`Dashboard Individual/README.md`, seção "Automação (Agenda)") — ainda não configurado para este cliente.

## Renovação do token Meta

O token Meta expira em ~60 dias. Para renovar:

1. Acessar [Graph API Explorer](https://developers.facebook.com/tools/explorer/)
2. Selecionar o app e gerar novo token com permissões `ads_read`
3. Trocar por token de longa duração via `/oauth/access_token?grant_type=fb_exchange_token`
4. Atualizar `META_ACCESS_TOKEN` no Vercel e fazer redeploy
