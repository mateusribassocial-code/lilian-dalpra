# Dashboard Individual — Template

Dashboard Next.js por corretora: Kanban de CRM (Google Sheets) cruzado com investimento/leads do Meta Ads.

Esta pasta roda hoje como o painel real da **Lilian Dalpra**. Em 2026-07-23 ela foi migrada do dashboard antigo (multi-aba: Ads por filial, Google Ads, GA4, CRM via Contact2Sales) para este modelo mais simples, página única, mesmo padrão usado no painel da **Jessica Corrêa** (`Dashboard Individual`) — a pedido do cliente, que preferiu simplicidade a manter recursos que não estavam em uso (Google Ads e GA4 já estavam desligados).

**Atenção — como a planilha CRM da Lilian é alimentada:** diferente da Jessica (onde o Make escreve os leads via `google-sheets:addRow`), a planilha dela recebe leads pela **sincronização nativa do Meta Ads Manager** (Lead Ads → Google Sheets, direto no Gerenciador de Anúncios). Se o Kanban aparecer vazio mesmo com campanhas ativas, confirmar que essa sincronização nativa está apontando pra planilha certa (`KANBAN_CONFIG.spreadsheetId` abaixo) — isso é configurado dentro do Meta Business Suite, não neste código.

## Clonar para uma nova corretora

1. Copie esta pasta inteira para o local da nova corretora (ex: `Jessica Correa/dashboard` vira `Jessica/dashboard`, ou onde fizer sentido).
2. Edite **apenas** `lib/client.config.ts`:
   - `CLIENT.name` — nome exibido no painel.
   - `META_CONFIG.accountId` — conta de anúncios Meta da nova corretora.
   - `KANBAN_CONFIG.spreadsheetId` / `sheetName` — planilha CRM da nova corretora.
   - `KANBAN_CONFIG.columns` — ordem das colunas na planilha dela (se for diferente).
   - `KANBAN_CONFIG.stages` — etapas do funil dela, na ordem do Kanban. Ao mudar, o TypeScript vai apontar onde atualizar as cores em `components/KanbanBoard.tsx` (`STAGE_COLORS` / `STAGE_DOT`) — só seguir os erros de build.
3. Crie um `.env.local` próprio (veja "Setup" abaixo) — cada deploy tem suas próprias credenciais, nada é compartilhado entre corretoras.
4. Confirme como a planilha CRM dela vai ser alimentada — Make (`Facebook Lead Ads` → `Z-API` → `Google Sheets addRow`, igual à Jessica Corrêa, scenario id `4825026`) ou sincronização nativa do Meta (igual à Lilian) — **não presumir que é sempre Make**, cada corretora pode ter um fluxo diferente.
5. `git init` novo (não faz sentido herdar o histórico), deploy no Vercel.

## Setup

### 1. Service Account do Google (leitura e escrita da planilha)

1. No [Google Cloud Console](https://console.cloud.google.com/), crie ou selecione um projeto.
2. Ative a **Google Sheets API**.
3. Crie uma **Service Account** (IAM & Admin → Service Accounts → Create).
4. Gere uma chave JSON para ela (Keys → Add Key → JSON).
5. Abra a planilha CRM da corretora e compartilhe com o `client_email` da service account com permissão de **Editor** (não só Leitor — o Kanban escreve a Etapa de Funil na planilha ao arrastar um lead entre colunas). **Sem esse passo o painel autentica normalmente mas a leitura/escrita falha com "The caller does not have permission"** — não é bug, é só falta de compartilhamento.
6. No `.env.local`, preencha `SHEETS_CLIENT_EMAIL` (o `client_email` do JSON) e `SHEETS_PRIVATE_KEY` (o `private_key` do JSON, mantendo as quebras de linha como `\n`).

### 2. Meta Ads

Token de longa duração (~60 dias, Graph API Explorer) ou, melhor, um **System User Token** do Business Manager (não expira) com permissão `ads_read` na conta de anúncios da corretora.

### 3. Rodar localmente

```bash
cp .env.example .env.local
# preencha DASHBOARD_PASSWORD, META_ACCESS_TOKEN, SHEETS_CLIENT_EMAIL, SHEETS_PRIVATE_KEY
npm install
npm run dev
# http://localhost:3000
```

`.env.example` é só o molde (não é lido pelo Next.js) — os valores reais sempre vão em `.env.local`, que já está no `.gitignore`.

## O que o painel mostra

- **Kanban de leads** por Etapa do Funil, com Temperatura da Lead em cada card. Os cards podem ser **arrastados entre colunas** — isso atualiza a coluna Etapa de Funil direto na planilha (`PATCH /api/kanban/stage`, via `lib/sheets.ts#updateLeadStage`). Se a escrita falhar (ex: Service Account sem permissão de Editor), o card volta pro lugar e mostra um aviso.
- **Botão de WhatsApp** em cada card, abre `wa.me/<telefone>` numa nova aba.
- **Filtro por campanha** sobre o próprio Kanban.
- **Tabela Campanhas — Investimento x Funil**: gasto e leads reportados pelo Meta Ads cruzados com quantos leads dessa campanha estão em cada etapa do funil (Ganho / Perdido em destaque).

## Automação (Agenda) — Data Visita → Google Agenda

Quando a corretora preenche **Data Visita** (coluna Q) e **Hora Visita** (coluna R) numa linha, um evento pode ser criado automaticamente na Google Agenda dela. Isso roda via **Google Apps Script amarrado na própria planilha** (não no Make) — dispara na hora do edit, sem polling. Fonte do script: [`scripts/apps-script/agenda-sync.gs`](scripts/apps-script/agenda-sync.gs). **Ainda não configurado/ativado para esta corretora** — só o arquivo está pronto.

Colunas usadas (já existem na planilha desta corretora):

| Coluna | Nome | Preenchida por |
|---|---|---|
| Q | Data Visita | Corretora (manual) |
| R | Hora Visita | Corretora (manual) |
| S | (ID do evento) | Script (automático — não mexer) |

### Setup (uma vez por corretora)

1. A corretora compartilha a agenda dela (Configurações → Compartilhar com pessoas específicas) com a conta que vai autorizar o script (hoje `mateusribas.social@gmail.com`), permissão **"Fazer alterações em eventos"**.
2. Abra a planilha CRM dela → **Extensões → Apps Script**.
3. Cole o conteúdo de `scripts/apps-script/agenda-sync.gs`.
4. Preencha a constante `CALENDAR_ID` no topo do script com o e-mail da agenda da corretora (o mesmo endereço usado no compartilhamento do passo 1).
5. Menu lateral **Acionadores** (ícone de relógio) → **Adicionar acionador**: função `onEditCreateVisitEvent`, evento `Ao editar`, fonte `Da planilha`. Precisa ser esse acionador **instalável** (não o `onEdit(e)` simples) porque `CalendarApp` exige autorização.
6. Na primeira execução, o Google vai pedir autorização — autorizar com a conta do passo 1.

O script evita duplicar evento: se a linha já tiver um evento criado (coluna S preenchida) e a corretora editar Data/Hora de novo, ele **atualiza** o evento existente em vez de criar outro.
