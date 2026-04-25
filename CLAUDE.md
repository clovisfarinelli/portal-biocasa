# Portal Biocasa — Guia de Arquitetura para Claude Code

Este arquivo documenta a arquitetura completa, decisões técnicas e convenções do projeto para uso em sessões futuras.

## Visão Geral

Portal de **Análise de Viabilidade Imobiliária** com IA, desenvolvido para a Biocasa.
- Analisa imóveis e terrenos usando Google Gemini 1.5 Pro
- Três perfis de acesso com permissões distintas
- Documentos de referência por cidade melhoram análises com o tempo
- Sistema de aprendizado baseado em validações dos usuários

---

## Stack Técnica

| Camada | Tecnologia | Versão |
|--------|-----------|--------|
| Framework | Next.js App Router | 14.2.x |
| Estilo | Tailwind CSS | 3.x |
| Banco de dados | PostgreSQL + pgvector | 15 + 0.8.2 |
| ORM | Prisma | 5.x |
| IA | Google Gemini | 1.5 Pro |
| Autenticação | NextAuth.js | 4.x |
| Upload | Vercel Blob | latest |
| Deploy frontend | Vercel | — |
| Deploy banco | Docker Swarm (VPS2) | — |

---

## Infraestrutura

### VPS2 (178.105.38.118)
- **Sistema:** Docker Swarm (modo manager único)
- **Rede:** `network_public` (overlay, compartilhada com todos os stacks)
- **Traefik:** Reverse proxy SSL, entrypoints web (80) e websecure (443)

### Stacks Docker na VPS2
| Stack | Serviços | Domínio |
|-------|---------|---------|
| `traefik` | traefik v2.11 | traefik.cf8.com.br |
| `portainer` | portainer-ce | painel2.cf8.com.br |
| `frappecrm` | ERPNext + MariaDB + Redis | erp.cf8.com.br |
| `postgres-biocasa` | PostgreSQL 15 + pgvector | (interno, porta 5433) |

### PostgreSQL Biocasa
```
Host:     178.105.38.118
Porta:    5433 (externa) / 5432 (interna Docker)
Banco:    portal_biocasa
Usuário:  biocasa_user
Stack:    postgres-biocasa
Compose:  /opt/stacks/postgres-biocasa/docker-compose.yml
```

> **Importante:** A senha contém caracteres especiais. Na DATABASE_URL usar URL-encoding:
> `@` → `%40`, `#` → `%23`, `!` → `%21`

---

## Estrutura de Diretórios

```
portal-biocasa/
├── app/
│   ├── (auth)/
│   │   └── login/page.tsx          # Página de login pública
│   ├── (dashboard)/
│   │   ├── layout.tsx              # Layout com Sidebar (requer sessão)
│   │   ├── chat/page.tsx           # Chat de análise (todos os perfis)
│   │   ├── usuarios/page.tsx       # Gestão de usuários (MASTER + PROPRIETARIO)
│   │   └── treinar-ia/page.tsx     # Treinamento da IA (apenas MASTER)
│   ├── api/
│   │   ├── auth/[...nextauth]/     # NextAuth handler
│   │   ├── analises/               # CRUD análises + envio ao Gemini
│   │   ├── analises/[id]/          # Detalhe + validação (PATCH)
│   │   ├── arquivos/               # Upload para Vercel Blob
│   │   ├── cidades/                # CRUD cidades
│   │   ├── configuracoes/          # Câmbio dólar/real e outras config
│   │   ├── documentos/             # CRUD documentos de treinamento
│   │   ├── documentos/[id]/        # Toggle ativo/inativo + delete
│   │   ├── logs-erro/              # Listagem de logs (MASTER only)
│   │   ├── unidades/               # CRUD unidades (MASTER only)
│   │   └── usuarios/               # CRUD usuários
│   ├── globals.css                 # Tailwind + classes utilitárias
│   ├── layout.tsx                  # Root layout com SessionProvider
│   └── page.tsx                    # Redirect → /login ou /chat
├── components/
│   ├── ChatInterface.tsx           # Chat principal com Gemini
│   ├── ExportarPDF.tsx             # Exportação via window.print()
│   ├── LogoBiocasa.tsx             # Logo SVG placeholder
│   ├── Providers.tsx               # SessionProvider wrapper
│   ├── Sidebar.tsx                 # Navegação lateral com histórico
│   ├── TreinarIA.tsx               # Interface de treinamento (MASTER)
│   ├── UploadArquivos.tsx          # Dropzone com progresso e validação
│   └── UserManagement.tsx          # CRUD de usuários na interface
├── lib/
│   ├── auth.ts                     # NextAuth options + callbacks JWT
│   ├── gemini.ts                   # Integração Gemini + busca contexto
│   ├── prisma.ts                   # Singleton Prisma Client
│   └── utils.ts                    # Formatadores + constantes de upload
├── prisma/
│   ├── schema.prisma               # Schema completo com pgvector
│   └── seed.ts                     # Seed: unidade HQ + usuário MASTER
├── middleware.ts                   # Proteção de rotas via NextAuth
├── .env.example                    # Template de variáveis (sem segredos)
└── .env.local                      # Variáveis locais (no .gitignore)
```

---

## Banco de Dados — Schema Prisma

### Tabelas principais

```
unidades        → franquias/filiais da Biocasa
usuarios        → perfil MASTER | PROPRIETARIO | ESPECIALISTA
cidades         → cidades cadastradas (unique: nome + estado)
documentos_ia   → docs de treinamento com embedding vector(768)
analises        → histórico de conversas com custo e tokens
arquivos_analise → arquivos anexados a uma análise
aprendizados    → resumos de análises válidas com embedding
configuracoes   → chave/valor (câmbio, limites globais)
logs_erro       → erros de API capturados
```

### Relações importantes
- `Usuario` → `Unidade` (muitos para um)
- `Analise` → `Usuario`, `Unidade`, `Cidade`
- `Analise` → `ArquivoAnalise` (um para muitos, cascade delete)
- `Analise` → `Aprendizado` (um para um)
- `DocumentoIa` → `Cidade` (nullable — null = global)

### pgvector
- Tipo: `Unsupported("vector(768)")` no schema Prisma
- Usado em: `documentos_ia.embedding` e `aprendizados.embedding`
- Busca semântica: pendente implementação de embedding (ver seção Gemini)
- Por ora: busca simples por `categoria` e `cidadeId` (funcional)

---

## Autenticação — NextAuth.js

### Estratégia
- Provider: `CredentialsProvider` (email + senha)
- Sessão: JWT (não database session)
- Campos extras no token JWT: `id`, `perfil`, `unidadeId`, `unidadeNome`

### Perfis e permissões

| Ação | MASTER | PROPRIETARIO | ESPECIALISTA |
|------|--------|-------------|-------------|
| Ver todas as análises | ✅ | ❌ (só unidade) | ❌ (só próprias) |
| Criar usuário MASTER/PROPRIETARIO | ✅ | ❌ | ❌ |
| Criar usuário ESPECIALISTA | ✅ | ✅ (sua unidade) | ❌ |
| Treinar IA / Documentos | ✅ | ❌ | ❌ |
| Configurar câmbio | ✅ | ❌ | ❌ |
| Chat de análise | ✅ | ✅ | ✅ |
| Campos obrigatórios no chat | ❌ | ❌ | ✅ |

### Middleware
`middleware.ts` protege todas as rotas `/chat`, `/usuarios`, `/treinar-ia` e `/api/*` (exceto `/api/auth`).

---

## Integração Gemini — lib/gemini.ts

### Modelo
```
gemini-2.0-flash
maxOutputTokens: 8192
temperature: 0.7
```

### Fluxo de contexto por análise
1. Busca documentos globais ativos (`categoria = 'GLOBAL'`)
2. Busca documentos da cidade selecionada (`categoria = 'CIDADE'`, `cidadeId`)
3. Busca aprendizados recentes da cidade (últimos 3)
4. Monta string de contexto e injeta na primeira mensagem do usuário
5. Mantém histórico completo da conversa (multiturno via `chat.sendMessage`)

### Cálculo de custo
```typescript
// Preços Gemini 2.0 Flash (conforme documentação Google em 04/2026)
custo_usd = (tokens_input * 0.10 + tokens_output * 0.40) / 1_000_000
custo_brl = custo_usd * cambio  // cambio lido da tabela configuracoes
```

### TODO — Busca Semântica Real
Quando disponível, substituir a busca simples em `buscarDocumentosRelevantes()` por:
```sql
SELECT * FROM documentos_ia
ORDER BY embedding <=> $1::vector  -- operador cosine similarity pgvector
LIMIT 5;
```
Requer chamar API de embedding do Google (`text-embedding-004`) antes de salvar documentos.

---

## Upload de Arquivos

### Provider: Vercel Blob
- Token: `BLOB_READ_WRITE_TOKEN`
- Arquivos salvos em: `analises/<timestamp>-<nome>` ou `documentos-ia/<timestamp>-<nome>`
- URLs públicas retornadas e salvas no banco

### Limites por tipo
| Tipo | Limite |
|------|--------|
| PDF, DOCX, TXT, XLSX, CSV | 10 MB |
| JPG, PNG, WEBP | 10 MB |
| KML, KMZ | 5 MB |
| MP4, MOV, AVI | 100 MB |

### Máximo por análise: 10 arquivos

---

## Telas e Componentes

### Login (`/login`)
- Componente cliente com `useSession` + `signIn('credentials')`
- Redirect automático se já autenticado

### Chat (`/chat`)
- Parâmetro `?analise=<id>` carrega análise existente
- Formulário de campos mostrado apenas quando `!camposPreenchidos`
- Campos obrigatórios para ESPECIALISTA: cidade, inscrição imobiliária, IPTU
- Toggle "Análise Profunda" (flag enviada ao backend, integração real pendente)
- Validação ao final: botões ✅/❌ → `PATCH /api/analises/[id]`
- Mensagens renderizadas com `react-markdown` + `remark-gfm`

### Sidebar
- Recolhível (estado local)
- Histórico: últimas 10 análises do usuário
- Consumo do mês: calculado no cliente filtrando análises do mês atual
- Ícone de logout com `signOut()`

### Gerenciar Usuários (`/usuarios`)
- MASTER: vê todos + câmbio + campo unidade no formulário
- PROPRIETARIO: vê só sua unidade, cria apenas ESPECIALISTA
- Modal único para criar/editar
- Desativar = `ativo: false` (soft delete)

### Treinar IA (`/treinar-ia`) — apenas MASTER
- 4 abas: Global, Por Cidade, Aprendizados, Logs
- Upload multipart para `/api/documentos`
- Toggle ativo/inativo via `PATCH /api/documentos/[id]`

---

## Variáveis de Ambiente

```env
# Banco de dados
DATABASE_URL="postgresql://biocasa_user:<SENHA_URL_ENCODED>@178.105.38.118:5433/portal_biocasa"

# NextAuth
NEXTAUTH_URL="https://portal.biocasa.com.br"  # URL base do site
NEXTAUTH_SECRET="<openssl rand -base64 32>"

# Google Gemini
GEMINI_API_KEY="<chave da Google AI Studio>"

# Vercel Blob (upload de arquivos)
BLOB_READ_WRITE_TOKEN="<token do painel Vercel>"

# Câmbio padrão (sobrescrito pela tabela configuracoes)
DOLAR_REAL_PADRAO="5.50"
```

---

## Convenções de Código

### Naming
- Arquivos: `PascalCase` para componentes, `camelCase` para libs
- Variáveis/funções: `camelCase` em português (ex: `carregarAnalises`, `cidadeSelecionada`)
- Prisma models: PascalCase singular (ex: `Analise`, `Usuario`)
- API routes: REST pattern, respostas em JSON com chave `erro` para erros

### Tratamento de erros na API
```typescript
// Sempre logar erros de API do Gemini na tabela logs_erro
await prisma.logErro.create({ data: { usuarioId, mensagem, detalhes: error.message } })
return NextResponse.json({ erro: 'Mensagem amigável em português' }, { status: 500 })
```

### Autenticação em API routes
```typescript
const session = await getServerSession(authOptions)
if (!session) return NextResponse.json({ erro: 'Não autorizado' }, { status: 401 })
const usuario = session.user as any  // contém id, perfil, unidadeId
```

### Cores Tailwind (custom)
- `dourado-400` = `#C9A84C` — cor primária, botões, destaques
- `escuro-600` = `#1A1A2E` — fundo principal
- `escuro-500` = cards e painéis
- `escuro-700` = sidebar e header

---

## Comandos de Desenvolvimento

```bash
npm run dev           # Inicia servidor dev em localhost:3000
npm run build         # Build de produção (verifica tipos)
npm run db:push       # Sincroniza schema Prisma → banco (sem migração)
npm run db:migrate    # Cria migração versionada
npm run db:seed       # Popula dados iniciais (MASTER + unidade HQ)
npm run db:studio     # Abre Prisma Studio (UI do banco)
```

---

## Deploy

### Vercel (frontend + API routes)
1. Importar repositório GitHub `portal-biocasa`
2. Framework preset: **Next.js** (detectado automaticamente)
3. Configurar variáveis de ambiente no painel
4. Build command: `npm run build` (padrão)
5. Deploy automático a cada push em `main`

### PostgreSQL (VPS2)
```bash
# Verificar status
ssh vps2 "docker service ls | grep postgres-biocasa"

# Reiniciar serviço
ssh vps2 "docker service update --force postgres-biocasa_postgres"

# Acessar banco direto
ssh vps2 "docker exec -it \$(docker ps -q -f name=postgres-biocasa) psql -U biocasa_user -d portal_biocasa"

# Fazer backup
ssh vps2 "docker exec \$(docker ps -q -f name=postgres-biocasa) pg_dump -U biocasa_user portal_biocasa > /tmp/backup-biocasa-\$(date +%Y%m%d).sql"
```

---

## Pendências / TODOs

| # | Item | Prioridade |
|---|------|-----------|
| 1 | Implementar busca semântica real com embedding `text-embedding-004` | Alta |
| 2 | Integrar Análise Profunda (Google Search grounding no Gemini) | Alta |
| 3 | Upload de arquivos para análise (enviar conteúdo ao Gemini) | Alta |
| 4 | Logo real da Biocasa (substituir SVG placeholder) | Média |
| 5 | Responsivo mobile completo | Média |
| 6 | Paginação no histórico da Sidebar | Baixa |
| 7 | Reset de `analises_mes` mensalmente (cron job ou trigger) | Média |
| 8 | Notificação por email quando limite de análises for atingido | Baixa |
| 9 | Proteção por firewall (UFW) da porta 5433 — liberar apenas IPs Vercel | Alta |

---

## Usuários Iniciais (seed)

| Email | Senha | Perfil | Unidade |
|-------|-------|--------|---------|
| `master@biocasa.com.br` | `Biocasa@2026!` | MASTER | Biocasa HQ |
