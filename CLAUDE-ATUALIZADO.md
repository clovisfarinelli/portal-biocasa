# Portal Biocasa — Guia de Arquitetura para Claude Code
*Atualizado: Abril 2026 (Sessão: Módulo de Imóveis — Schema + API)*

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
│   │       ├── route.ts            # GET (lista + n8n) + POST
│   │       └── [id]/
│   │           ├── route.ts        # GET + PUT + DELETE
│   │           └── fotos/
│   │               └── route.ts    # POST (upload+compress) + DELETE
├── components/
│   ├── ChatInterface.tsx
│   ├── ExportarPDF.tsx
│   ├── LogoBiocasa.tsx
│   ├── Providers.tsx
│   ├── Sidebar.tsx
│   ├── TreinarIA.tsx
│   ├── UploadArquivos.tsx
│   └── UserManagement.tsx
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

## API Endpoints — Módulo de Imóveis (NOVO)

### GET /api/imoveis
- Lista imóveis com filtros: `finalidade`, `tipo`, `cidade`, `modalidade`, `situacao`, `quartos`, `valor_min`, `valor_max`, `destaque`, `publicar_site`, `unidadeId` (MASTER only), `pagina`
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
- Schema `.strict()` — rejeita campos desconhecidos

### DELETE /api/imoveis/[id]
- Exclusão — apenas MASTER

### POST /api/imoveis/[id]/fotos
- Upload de imagem via `multipart/form-data` (campo `foto`)
- Comprime com sharp → WebP, max 1920×1920px, qualidade 80
- Faz upload ao Vercel Blob em `/imoveis/{id}/`
- Primeira foto vira principal automaticamente
- Retorna `{ foto, fotos }`

### DELETE /api/imoveis/[id]/fotos
- Body: `{ url: "https://..." }`
- Remove do Vercel Blob + atualiza JSON do campo fotos
- Renumera ordens; promove nova principal se necessário

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
- Incorporação: access private, proxy autenticado /api/arquivos/download
- **Imóveis (fotos): access public**, pasta `/imoveis/{id}/`
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
| 4 | Reset mensal analises_mes (cron job) | Média |
| 5 | Logo real da Biocasa | Média |
| 6 | Responsivo mobile completo | Média |
| 7 | Paginação no histórico da Sidebar | Baixa |
| 8 | Notificação email quando limite atingido | Baixa |
| 9 | **Frontend do módulo de imóveis** (Sessão 2) | Alta |
| 10 | Adicionar API_KEY_N8N no painel Vercel (env de produção) | Alta |

## Usuário inicial (seed)
| Email | Senha | Perfil |
|-------|-------|--------|
| master@biocasa.com.br | Biocasa@2026! | MASTER |
