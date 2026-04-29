# Portal Biocasa — Guia de Arquitetura para Claude Code
*Atualizado: Abril 2026 (Sessão 5b: Imóveis — Interface, Filtros, Galeria e Download)*

Este arquivo documenta a arquitetura completa, decisões técnicas e convenções do projeto.

## Visão Geral
Portal de **Análise de Viabilidade Imobiliária** com IA + **Módulo de Cadastro de Imóveis**, desenvolvido para a Biocasa.
- Módulo de Incorporação: analisa imóveis e terrenos usando Google Gemini 2.5 Flash
- Módulo de Imóveis: cadastro e gestão completa de imóveis para venda/locação
- Cinco perfis de acesso: MASTER, PROPRIETARIO, ESPECIALISTA, ASSISTENTE, CORRETOR
- Documentos de referência por cidade melhoram análises com o tempo
- Sistema de aprendizado baseado em validações dos usuários
- Em produção: portal-biocasa.vercel.app

## Stack Técnica
| Camada | Tecnologia | Versão |
|--------|-----------|--------|
| Framework | Next.js App Router | 14.2.x |
| Estilo | Tailwind CSS | 3.x |
| Banco de dados | PostgreSQL + pgvector | 15 + 0.8.2 |
| ORM | Prisma | 5.x |
| IA | Google Gemini 2.5 Flash | gemini-2.5-flash |
| Autenticação | NextAuth.js | 4.x |
| Upload | Vercel Blob | 2.3.3 |
| Compressão imagens | sharp | latest |
| Deploy frontend | Vercel | — |
| Deploy banco | Docker Swarm (VPS2) | — |

## Perfis de Acesso

| Perfil | Módulo Incorporação | Módulo Imóveis | Treinar IA | Usuários |
|--------|--------------------|--------------------|------------|----------|
| MASTER | ✅ total | ✅ total (incl. DELETE) | ✅ | ✅ criar qualquer |
| PROPRIETARIO | ✅ total | ✅ criar/editar/ver (sem DELETE) | ❌ | ✅ criar ESPECIALISTA/ASSISTENTE/CORRETOR |
| ESPECIALISTA | ✅ chat (campos obrigatórios) | ❌ | ❌ | ❌ |
| ASSISTENTE | ❌ | ✅ criar/editar/ver (sem DELETE) | ❌ | ❌ |
| CORRETOR | ❌ | 👁 apenas leitura | ❌ | ❌ |

**Regras de unidade:** PROPRIETARIO, ASSISTENTE e CORRETOR só veem/editam imóveis da sua própria unidade.

## Infraestrutura

### VPS2 (178.105.38.118)
- Sistema: Docker Swarm (modo manager único)
- Rede: network_public (overlay, compartilhada com todos os stacks)
- Traefik v2.11: Reverse proxy SSL

### Stacks Docker na VPS2
| Stack | Serviços | Domínio |
|-------|---------|---------|
| traefik | traefik v2.11 | — |
| portainer | portainer-ce | painel2.cf8.com.br |
| frappecrm | ERPNext + MariaDB + Redis | erp.cf8.com.br |
| postgres-biocasa | PostgreSQL 15 + pgvector | interno porta 5433 |

### PostgreSQL Biocasa
- Host: 178.105.38.118
- Porta: 5433
- Banco: portal_biocasa
- Usuário: biocasa_user
- Compose: /opt/stacks/postgres-biocasa/docker-compose.yml
- Senha com caracteres especiais — usar URL encoding: @ → %40, # → %23, ! → %21

## Estrutura de Diretórios

```
portal-biocasa/
├── app/
│   ├── (auth)/login/
│   ├── (dashboard)/
│   │   ├── layout.tsx
│   │   ├── chat/page.tsx           # Chat de análise (incorporação)
│   │   ├── usuarios/page.tsx
│   │   ├── treinar-ia/page.tsx     # MASTER apenas
│   │   └── analises-unidades/      # Análises (MASTER)
│   ├── api/
│   │   ├── auth/[...nextauth]/
│   │   ├── analises/               # CRUD + envio ao Gemini
│   │   ├── analises/[id]/
│   │   ├── arquivos/               # Upload Vercel Blob (incorporação)
│   │   ├── arquivos/download/
│   │   ├── cidades/
│   │   ├── configuracoes/
│   │   ├── diagnostico/
│   │   ├── documentos/
│   │   ├── logs-erro/
│   │   ├── unidades/
│   │   ├── usuarios/
│   │   └── imoveis/                # ← NOVO
│   │       ├── route.ts            # GET (lista + n8n + busca texto) + POST
│   │       ├── fotos/
│   │       │   └── download/       # GET — proxy autenticado (Blob privado)
│   │       └── [id]/
│   │           ├── route.ts        # GET + PUT (incl. fotos) + DELETE
│   │           └── fotos/
│   │               ├── route.ts    # POST (upload+compress) + DELETE
│   │               └── zip/route.ts # GET — download ZIP de todas as fotos
├── app/(dashboard)/
│   ├── imoveis/page.tsx            # Listagem com filtros + cards + paginação
│   ├── imoveis/novo/page.tsx       # Formulário novo imóvel
│   ├── imoveis/[id]/page.tsx       # Visualização completa (server component)
│   └── imoveis/[id]/editar/        # Formulário edição + galeria de fotos
├── components/
│   ├── ChatInterface.tsx
│   ├── ExportarPDF.tsx
│   ├── LogoBiocasa.tsx
│   ├── Providers.tsx
│   ├── Sidebar.tsx
│   ├── TreinarIA.tsx
│   ├── UploadArquivos.tsx
│   ├── UserManagement.tsx
│   └── imoveis/                        # ← NOVO
│       ├── ImovelForm.tsx              # Formulário completo (5 seções, client)
│       ├── GaleriaFotos.tsx            # Upload + drag-reorder + Salvar Ordem
│       ├── GerenciarFotosModal.tsx     # Modal com galeria (ESC/click-outside/scroll lock)
│       └── CopiarFichaButton.tsx       # Botão copiar ficha WhatsApp (client)
├── lib/
│   ├── auth.ts
│   ├── gemini.ts
│   ├── prisma.ts
│   └── utils.ts
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
├── types/
│   └── next-auth.d.ts              # ← NOVO — tipos dos 5 perfis
└── middleware.ts
```

## Banco de Dados

### Tabelas
- unidades → franquias/filiais
- usuarios → MASTER | PROPRIETARIO | ESPECIALISTA | ASSISTENTE | CORRETOR
- cidades → unique: nome + estado
- documentos_ia → treinamento com embedding vector(768)
- analises → histórico com tokens e custo
- arquivos_analise → arquivos anexados (cascade delete)
- aprendizados → resumos válidos com embedding
- configuracoes → chave/valor (câmbio, etc)
- logs_erro → erros de API
- **imoveis** → cadastro completo de imóveis ← NOVO

### Model Imovel — campos principais
| Campo | Tipo | Descrição |
|-------|------|-----------|
| codigoRef | String unique | Código Kenlo (ex: AP17597) |
| finalidade | String | RESIDENCIAL, COMERCIAL |
| tipo | String | CASA, APARTAMENTO, TERRENO, CHACARA, SALA, LOJA, CASA_COMERCIAL, GALPAO |
| subtipo | String? | Para casa: ISOLADA, SOBRADO, etc. |
| modalidade | String | VENDA, LOCACAO, AMBOS |
| situacao | String | DISPONIVEL, VENDIDO, ALUGADO |
| fotos | String? (Text) | JSON array: [{url, ordem, principal}] |
| facilidadesImovel | String? | JSON array de facilidades |
| facilidadesCond | String? | JSON array de facilidades condomínio |
| unidadeId | String | FK → unidades |

### Relações
- Usuario → Unidade (N:1)
- Analise → Usuario, Unidade, Cidade
- Analise → ArquivoAnalise (1:N, cascade delete)
- Analise → Aprendizado (1:1)
- DocumentoIa → Cidade (nullable = global)
- **Imovel → Unidade (N:1)** ← NOVO

## API Endpoints — Módulo de Imóveis

### GET /api/imoveis
- Lista imóveis com filtros: `modalidade`, `tipo`, `cidade`, `bairro`, `dormitorios`, `situacao`, `valor_min`, `valor_max`, `destaque`, `publicar_site`, `busca` (texto livre), `unidadeId` (MASTER only), `pagina`
- Auth dupla: session NextAuth **ou** header `x-api-key: <API_KEY_N8N>` (para n8n)
- MASTER vê todos; demais perfis veem apenas sua unidade

### POST /api/imoveis
- Cria imóvel — MASTER, PROPRIETARIO, ASSISTENTE
- ASSISTENTE/PROPRIETARIO: unidade fixada no token de sessão
- MASTER: pode informar `unidadeId` no body
- Auto-gera `linkSite` = `/imovel/{codigoRef}` se não informado
- Retorna 409 se `codigoRef` já existe

### GET /api/imoveis/[id]
- Detalhe completo — MASTER, PROPRIETARIO, ASSISTENTE, CORRETOR
- Restrição por unidade para não-MASTER

### PUT /api/imoveis/[id]
- Edição parcial — MASTER, PROPRIETARIO, ASSISTENTE
- Schema Zod `.strict()` — rejeita campos desconhecidos
- Usado também pelo Salvar Ordem da galeria (envia apenas `fotos`)

### DELETE /api/imoveis/[id]
- Exclusão — apenas MASTER

### POST /api/imoveis/[id]/fotos
- Upload via `multipart/form-data` (campo `foto`)
- Comprime com **sharp** → WebP, max 1920×1920px, qualidade 80
- Salva no Vercel Blob (private) em `/imoveis/{id}/`
- Primeira foto vira principal automaticamente
- Retorna `{ foto, fotos }`

### DELETE /api/imoveis/[id]/fotos
- Body: `{ url: "https://..." }`
- Remove do Vercel Blob + atualiza JSON do campo fotos
- Renumera ordens; promove nova principal se necessário

### GET /api/imoveis/[id]/fotos/zip
- Download ZIP de todas as fotos do imóvel
- Auth: session NextAuth — restrição por unidade para não-MASTER
- Usa **JSZip** (tipo `arraybuffer` para compatibilidade com NextResponse)
- Arquivos nomeados `{codigoRef}_{n}.webp`
- Retorna com `Content-Disposition: attachment; filename="{codigoRef}-fotos.zip"`

### GET /api/imoveis/fotos/download
- Proxy autenticado para fotos privadas do Vercel Blob
- Query param: `url` (URL do blob)
- Busca com `Authorization: Bearer ${BLOB_READ_WRITE_TOKEN}` e repassa ao cliente

## Autenticação

### Perfis e permissões (completo)
| Ação | MASTER | PROPRIETARIO | ESPECIALISTA | ASSISTENTE | CORRETOR |
|------|--------|-------------|-------------|------------|----------|
| Ver todas as análises | ✅ | ❌ só unidade | ❌ só próprias | ❌ | ❌ |
| Criar usuário qualquer perfil | ✅ | ❌ | ❌ | ❌ | ❌ |
| Criar ESPECIALISTA/ASSISTENTE/CORRETOR | ✅ | ✅ sua unidade | ❌ | ❌ | ❌ |
| Treinar IA | ✅ | ❌ | ❌ | ❌ | ❌ |
| Configurar câmbio | ✅ | ❌ | ❌ | ❌ | ❌ |
| Chat campos obrigatórios | ❌ | ❌ | ✅ | ❌ | ❌ |
| Cadastrar/editar imóvel | ✅ | ✅ | ❌ | ✅ | ❌ |
| Ver imóvel | ✅ | ✅ | ❌ | ✅ | ✅ |
| Excluir imóvel | ✅ | ❌ | ❌ | ❌ | ❌ |
| Upload fotos | ✅ | ✅ | ❌ | ✅ | ❌ |

## Integração Gemini (módulo incorporação)

### Modelo atual
- gemini-2.5-flash
- maxOutputTokens: 8192
- temperature: 0.7

### Fluxo de contexto
1. Documentos globais ativos
2. Documentos da cidade
3. Aprendizados recentes da cidade (últimos 3)
4. Contexto injetado na primeira mensagem
5. Histórico completo multiturno

### Cálculo de custo
- custo_usd = (tokens_input * 0.10 + tokens_output * 0.40) / 1_000_000
- custo_brl = custo_usd * cambio (lido da tabela configuracoes)

## Upload de Arquivos

### Vercel Blob
- Store: portal-biocasa-blob (região GRU1 São Paulo)
- Incorporação: `access: 'private'`, proxy autenticado `/api/arquivos/download`
- **Imóveis (fotos): `access: 'private'`**, pasta `/imoveis/{id}/`, proxy `/api/imoveis/fotos/download`
- Versão @vercel/blob: 2.3.3

## Variáveis de Ambiente

```
DATABASE_URL="postgresql://biocasa_user:<SENHA_URL_ENCODED>@178.105.38.118:5433/portal_biocasa"
NEXTAUTH_URL="https://portal-biocasa.vercel.app"
NEXTAUTH_SECRET="<openssl rand -base64 32>"
GEMINI_API_KEY="<chave Google AI Studio>"
BLOB_READ_WRITE_TOKEN="<token painel Vercel>"
DOLAR_REAL_PADRAO="5.50"
API_KEY_N8N="<chave aleatória forte>"   # ← NOVO — autenticação para integração n8n
```

## Comandos Úteis

```bash
# Desenvolvimento
npm run dev
npm run build
npm run db:push
npm run db:seed

# VPS2 — PostgreSQL
ssh vps2 "docker service ls | grep postgres-biocasa"
ssh vps2 "docker service update --force postgres-biocasa_postgres"
ssh vps2 "docker exec -it \$(docker ps -q -f name=postgres-biocasa) psql -U biocasa_user -d portal_biocasa"
ssh vps2 "docker exec \$(docker ps -q -f name=postgres-biocasa) pg_dump -U biocasa_user portal_biocasa > /tmp/backup-biocasa-\$(date +%Y%m%d).sql"

# Diagnóstico
curl https://portal-biocasa.vercel.app/api/diagnostico?debug=biocasa2026

# db:push local (precisa do .env.local)
export \$(grep -v '^#' .env.local | xargs) && npx prisma db push
```

## Módulo de Imóveis — Interface e Componentes

### Listagem `/imoveis` — Filtros e Cards
- **Linha 1 de filtros:** Modalidade (w-36) | Tipo (w-44) | Cidade (w-36) | Bairro (w-36) | Dormitórios (w-40) | Situação (w-36)
- **Linha 2 de filtros:** Busca livre (flex-1) | Filtrar | Limpar
- **Card:** badge (tipo) no footer; valor em destaque; linha cond/IPTU; linha características (dorms/suítes/vagas/m²)

### Formulário `ImovelForm.tsx` — 5 Seções
1. Identificação e Classificação — codigoRef, tipo, finalidade, modalidade, situacao, destaque, publicarSite, parceria
2. Endereço — CEP → Logradouro → Nº → Complemento → Bairro → Cidade → Estado → Edifício (CEP com auto-fill via ViaCEP)
3. Detalhes Técnicos — áreas, quartos, suítes, banheiros, garagem, facilidades, descrição
4. Dados Comerciais — valor venda/locação/condomínio/IPTU (máscaras BRL), proprietário, telefone, comissão, links, observações
5. Fotos — contador estático; botões no footer: "Baixar Fotos" (link ZIP) + "Gerenciar Fotos" (abre modal)

**Máscaras de entrada:**
- Monetário (`CampoMonetario`): armazena dígitos puros; exibe formatado BRL no blur; raw no focus
- Telefone: `(00) 00000-0000` (celular) ou `(00) 0000-0000` (fixo) — detectado pelo 3º dígito `=== '9'`
- CEP: auto-fill via ViaCEP ao digitar 8 dígitos (preenche logradouro, bairro, cidade, estado)

### `GaleriaFotos.tsx`
- Dropzone (react-dropzone) para upload de novas fotos
- HTML5 drag-and-drop nativo para reordenação
- **Reordenação lazy:** arrastar atualiza estado local; banner amarelo "Salvar Ordem" aparece; botão faz PUT no imóvel
- Definir foto principal: clique no botão de estrela (PUT imediato)
- `readOnly` mode: apenas visualiza (usado na página de detalhes)
- Callback `onFotosChange?: (fotos) => void` notifica o pai sobre mudanças

### `GerenciarFotosModal.tsx`
- Botão "Gerenciar Fotos" abre modal fullscreen (z-50)
- Fecha com ESC, clique no overlay ou botão X
- Bloqueia scroll do body enquanto aberto
- Header mostra contador de fotos atualizado via `onFotosChange`
- Conteúdo: `<GaleriaFotos>` com overflow-y-auto

### Página de Detalhes `/imoveis/[id]` — 4 Seções
1. **Dados Comerciais:** valores, características (dorms/suítes/banheiros/garagem/áreas)
2. **Endereço e Imóvel:** endereço completo, situação do imóvel, vista mar, facilidades, descrição
3. **Captação e Administrativo:** proprietário, comissão, publicações, links, observações internas
4. **Fotos:** `<GaleriaFotos readOnly>` — sempre por último

### ViaCEP — Auto-fill de CEP
- Disparado quando o campo CEP atinge 8 dígitos (sem máscara)
- Endpoint: `https://viacep.com.br/ws/{cep}/json/`
- Preenche: logradouro, bairro, cidade, estado
- Campos ficam editáveis para correção manual

## Convenções de Código
- Arquivos: PascalCase componentes, camelCase libs
- Variáveis/funções: camelCase em português
- Erros API: sempre logar em logs_erro, retornar { erro: 'mensagem amigável' }
- Autenticação: sempre verificar session + perfil nas API routes
- Campos JSON (fotos, facilidades): armazenados como String serializado; parse na camada da aplicação

## Cores Tailwind
- dourado-400 = #C9A84C (primária, botões)
- escuro-600 = #1A1A2E (fundo)
- escuro-500 = cards e painéis
- escuro-700 = sidebar e header

## Pendências / TODOs
| # | Item | Prioridade |
|---|------|-----------|
| 1 | Busca semântica real com text-embedding-004 | Alta |
| 2 | Análise Profunda com Google Search (400 bad request) | Alta |
| 3 | Firewall UFW porta 5433 — liberar apenas IPs Vercel | Alta |
| 4 | Adicionar API_KEY_N8N no painel Vercel (env de produção) | Alta |
| 5 | Script de importação Kenlo (~125 imóveis) via API /api/imoveis | Alta |
| 6 | Site público de imóveis (portal de busca para clientes) | Média |
| 7 | Automações n8n WhatsApp (notificações de novos imóveis) | Média |
| 8 | Integrações de portais (ZAP, Viva Real, OLX) via n8n | Média |
| 9 | Reset mensal analises_mes (cron job) | Média |
| 10 | Logo real da Biocasa | Média |
| 11 | Responsivo mobile completo | Média |
| 12 | Paginação no histórico da Sidebar | Baixa |
| 13 | Notificação email quando limite atingido | Baixa |

## Usuário inicial (seed)
| Email | Senha | Perfil |
|-------|-------|--------|
| master@biocasa.com.br | Biocasa@2026! | MASTER |
