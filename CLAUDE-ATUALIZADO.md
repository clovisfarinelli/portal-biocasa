# Portal Biocasa — Guia de Arquitetura para Claude Code
*Atualizado: Maio 2026 (Sessão 10: LGPD — Consentimento, Páginas Legais, Retenção de Dados)*

Este arquivo documenta a arquitetura completa, decisões técnicas e convenções do projeto.

## Visão Geral
Portal de **Análise de Viabilidade Imobiliária** com IA + **Módulo de Cadastro de Imóveis**, desenvolvido para a Biocasa.
- Módulo de Incorporação: analisa imóveis e terrenos usando Google Gemini 2.5 Flash
- Módulo de Imóveis: cadastro e gestão completa de imóveis para venda/locação
- Site Público: portal de busca de imóveis em `imoveis.cf8.com.br` (sem autenticação)
- Cinco perfis de acesso: MASTER, PROPRIETARIO, ESPECIALISTA, ASSISTENTE, CORRETOR
- Flags de acesso por módulo: `acessoImob` e `acessoIncorp` (para ESPECIALISTA, ASSISTENTE, CORRETOR)
- Sistema de aprendizado baseado em validações dos usuários
- Em produção: portal.cf8.com.br (dashboard) | imoveis.cf8.com.br (site público)

## Stack Técnica
| Camada | Tecnologia | Versão |
|--------|-----------|--------|
| Framework | Next.js App Router | 14.2.x |
| Estilo | Tailwind CSS | 3.x |
| Banco de dados | PostgreSQL + pgvector | 15 + 0.8.2 |
| ORM | Prisma | 5.22.x |
| IA | Google Gemini 2.5 Flash | gemini-2.5-flash |
| Autenticação | NextAuth.js | 4.x |
| 2FA | otplib + qrcode | 13.x + 1.x |
| Upload | Vercel Blob | 2.3.3 |
| Compressão imagens | sharp | 0.34.x |
| Email (convites + alertas) | Resend | 6.12.x |
| Export Excel | xlsx | 0.18.x |
| ZIP fotos | jszip | 3.10.x |
| Deploy frontend | Vercel | — |
| Deploy banco | Docker Swarm (VPS2) | — |

## Perfis de Acesso

| Perfil | Módulo Incorporação | Módulo Imóveis | Treinar IA | Usuários |
|--------|--------------------|--------------------|------------|----------|
| MASTER | ✅ total | ✅ total (incl. DELETE) | ✅ | ✅ criar qualquer |
| PROPRIETARIO | ✅ total | ✅ criar/editar/ver (sem DELETE) | ❌ | ✅ criar ESPECIALISTA/ASSISTENTE/CORRETOR |
| ESPECIALISTA | ✅ chat (campos obrigatórios) | ❌ | ❌ | ❌ |
| ASSISTENTE | ❌ | ✅ criar/editar/ver (sem DELETE) | ❌ | ❌ |
| CORRETOR | ❌ | 👁 apenas leitura (campos sensíveis ocultos) | ❌ | ❌ |

**Regras de unidade:** PROPRIETARIO, ASSISTENTE e CORRETOR só veem/editam imóveis da sua própria unidade.

**Campos sensíveis ocultos para CORRETOR:** proprietário, telefone proprietário, código IPTU, código matrícula, observações internas, comissão.

**Flags de módulo:** ESPECIALISTA, ASSISTENTE e CORRETOR precisam ter `acessoImob=true` ou `acessoIncorp=true` para acessar os respectivos módulos. MASTER e PROPRIETARIO têm acesso implícito a ambos.

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
- **SSL ativo** — certificado autoassinado em `/opt/stacks/postgres-biocasa/ssl/`
- **DATABASE_URL Vercel**: adicionar `?sslmode=require` ao final da URL
- Autenticação: scram-sha-256 (já ativado)

## Estrutura de Diretórios

```
portal-biocasa/
├── app/
│   ├── (auth)/login/               # Página de login
│   ├── (dashboard)/                # Portal autenticado (portal.cf8.com.br)
│   │   ├── layout.tsx
│   │   ├── page.tsx                # Redirect para chat ou imoveis conforme perfil
│   │   ├── acesso-negado/          # Página exibida quando sem permissão de módulo
│   │   ├── analises-unidades/      # Análises por unidade (MASTER/PROPRIETARIO)
│   │   ├── atendimento/            # Chatwoot iframe SSO
│   │   ├── chat/                   # Chat de análise (incorporação)
│   │   ├── configurar-2fa/         # Setup 2FA para MASTER
│   │   ├── consolidado/            # Dashboard MASTER (4 abas: métricas/usuários/auditoria/configs)
│   │   ├── treinar-ia/             # Treinamento da IA (MASTER)
│   │   ├── usuarios/               # Gestão de usuários (pode ser acessado via Dashboard tb)
│   │   └── imoveis/
│   │       ├── page.tsx            # Listagem com filtros + cards + paginação + sessionStorage
│   │       ├── novo/page.tsx       # Formulário novo imóvel
│   │       ├── relatorios/page.tsx # Relatórios: gráficos (donut+barras) + impressão A4
│   │       └── [id]/
│   │           ├── page.tsx        # Visualização completa
│   │           └── editar/page.tsx # Formulário edição + galeria de fotos
│   ├── (site)/                     # Site público de imóveis (imoveis.cf8.com.br)
│   │   └── site/
│   │       ├── layout.tsx
│   │       ├── page.tsx            # Homepage com busca hero + listagem
│   │       ├── BuscaHero.tsx       # Componente de busca (client)
│   │       ├── HeaderSite.tsx      # Header público
│   │       └── imoveis/
│   │           └── [ref]/
│   │               ├── page.tsx    # Detalhe público do imóvel (SSR)
│   │               └── GaleriaPublica.tsx
│   ├── (imprimir)/                 # Páginas de impressão (sem sidebar, layout limpo)
│   │   ├── layout.tsx
│   │   └── imprimir/
│   │       ├── ficha-captacao/     # Ficha de captação para impressão
│   │       │   ├── page.tsx
│   │       │   └── FichaImpressaoClient.tsx
│   │       └── imoveis/
│   │           └── [id]/ficha/     # Ficha completa do imóvel para impressão
│   └── api/
│       ├── auth/[...nextauth]/
│       ├── 2fa/
│       │   ├── configurar/         # GET (status+QR) + POST (ativar) + DELETE (desativar)
│       │   └── preflight/          # GET — verifica 2FA antes do login
│       ├── admin/                  # Rota admin interna (MASTER)
│       ├── analises/               # CRUD + envio ao Gemini
│       ├── analises/[id]/          # Detalhe + validação
│       ├── arquivos/               # Upload Vercel Blob (incorporação)
│       ├── arquivos/download/      # Proxy autenticado para arquivos privados
│       ├── chatwoot/
│       │   ├── contas/             # GET — lista contas Chatwoot do usuário (MASTER)
│       │   ├── redirect/           # GET — SSO via Platform API → redirect
│       │   ├── session/            # GET — seta cookie de auth para iframe
│       │   ├── sso/                # GET — retorna URL SSO one-time
│       │   └── token/              # GET — retorna token Chatwoot do usuário atual
│       ├── cidades/
│       ├── configuracoes/          # GET/PUT câmbio e configs gerais
│       ├── dashboard-consolidado/  # GET — métricas agregadas por unidade (MASTER)
│       ├── diagnostico/            # GET — diagnóstico da API (?debug=biocasa2026)
│       ├── documentos/
│       ├── logs/
│       │   ├── route.ts            # GET — logs de auditoria com filtros (MASTER)
│       │   └── exportacao/route.ts # POST — registra exportação + verifica abuso
│       ├── logs-erro/
│       ├── unidades/
│       ├── usuarios/
│       │   ├── route.ts            # GET (lista) + POST (criar/convidar)
│       │   ├── [id]/route.ts       # GET + PUT + DELETE (soft-delete)
│       │   ├── [id]/reenviar-convite/
│       │   ├── convite/route.ts    # GET — valida token de convite
│       │   └── convite/aceitar/    # POST — aceita convite, define senha, cria no Chatwoot
│       └── imoveis/
│           ├── route.ts            # GET (lista + n8n + busca texto) + POST
│           ├── gerar-descricao/    # POST — gera descrição com Gemini 2.5 Flash
│           ├── fotos/download/     # GET — proxy autenticado fotos privadas (dashboard)
│           ├── publico/            # GET — listagem pública (publicarSite=true, sem auth)
│           │   ├── route.ts
│           │   ├── fotos/route.ts  # GET — proxy de fotos para site público (sem auth)
│           │   └── [ref]/route.ts  # GET — detalhe público por codigoRef
│           ├── relatorios/
│           │   ├── route.ts        # GET — estatísticas (total, porStatus, porBairro, porCorretor)
│           │   └── impressao/      # GET — lista para impressão A4 com filtros e agrupamento
│           └── [id]/
│               ├── route.ts        # GET + PUT + DELETE
│               ├── duplicar/       # POST — duplica imóvel (sem fotos)
│               └── fotos/
│                   ├── route.ts    # POST (upload+compress) + DELETE
│                   └── zip/route.ts # GET — download ZIP de todas as fotos
├── components/
│   ├── AbaAuditoria.tsx            # Aba de logs de auditoria com filtros (Dashboard MASTER)
│   ├── AbaConfiguracoes.tsx        # Aba de gestão de unidades/configs (Dashboard MASTER)
│   ├── AnalisesUnidades.tsx        # Listagem de análises (MASTER/PROPRIETARIO)
│   ├── ChatInterface.tsx           # Chat principal com Gemini
│   ├── ChatwootEmbed.tsx           # Iframe Chatwoot com SSO
│   ├── DashboardConsolidado.tsx    # Aba de métricas (usada dentro do DashboardMaster)
│   ├── DashboardMaster.tsx         # Dashboard MASTER: 4 abas (Métricas/Usuários/Auditoria/Configs)
│   ├── ExportarPDF.tsx             # Exportação de análises em PDF (com marca d'água BIOCASA)
│   ├── LayoutPrincipal.tsx         # Layout reutilizável para páginas internas
│   ├── LogoBiocasa.tsx             # Placeholder SVG do logo
│   ├── ModalConfirmarDescricaoIA.tsx # Modal de confirmação da descrição gerada por IA
│   ├── Providers.tsx               # SessionProvider + theme
│   ├── Sidebar.tsx                 # Sidebar de navegação (responsiva)
│   ├── TagInput.tsx                # Input de tags reutilizável
│   ├── TreinarIA.tsx               # Interface de treinamento da IA
│   ├── UploadArquivos.tsx          # Dropzone (IPTU + outros documentos)
│   ├── UserManagement.tsx          # Gestão de usuários (usada na aba Usuários do Dashboard)
│   └── imoveis/
│       ├── CompartilharButton.tsx  # Copia linkExterno para área de transferência
│       ├── CopiarFichaButton.tsx   # Botão copiar ficha WhatsApp
│       ├── CopiarTextoButton.tsx   # Botão copiar texto genérico
│       ├── DuplicarButton.tsx      # Botão duplicar imóvel (sem fotos)
│       ├── FichaCaptacao.tsx       # Ficha de captação para impressão (meia folha A4)
│       ├── GaleriaFotos.tsx        # Upload + drag-reorder + Salvar Ordem
│       ├── GaleriaPublica.tsx      # Galeria para site público (sem auth)
│       ├── GerenciarFotosModal.tsx # Modal fullscreen de galeria
│       ├── ImovelForm.tsx          # Formulário completo (5 seções, client)
│       └── Lightbox.tsx            # Lightbox de fotos (ESC + swipe)
├── lib/
│   ├── alertas.ts                  # Detecção de logins falhos + exports abusivos → email
│   ├── auth.ts                     # NextAuth + JWT (perfil, unidadeId, 2FA, acessoImob/Incorp)
│   ├── chatwoot.ts                 # Funções de integração com Chatwoot Platform API
│   ├── email.ts                    # Resend — envio de convites e alertas de segurança
│   ├── gemini.ts                   # Gemini 2.5 Flash + busca de contexto para incorporação
│   ├── logs.ts                     # registrarLog() para tabela logs_acesso
│   ├── prisma.ts                   # Singleton do PrismaClient
│   ├── rateLimit.ts                # Rate limiting sem dependência externa
│   ├── slug.ts                     # gerarSlugImovel() para URLs amigáveis
│   └── utils.ts                    # formatarMoeda, formatarTelefone, parsearOutros, etc.
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
├── types/
│   └── next-auth.d.ts              # Tipos: 5 perfis, acessoImob, acessoIncorp, totpAtivado
└── middleware.ts                   # Roteamento hostname + auth + 2FA + flags de módulo
```

## Banco de Dados

### Tabelas
| Tabela | Descrição |
|--------|-----------|
| unidades | Franquias/filiais |
| usuarios | 5 perfis + 2FA + Chatwoot + convite |
| cidades | Único: nome + estado |
| documentos_ia | Treinamento com embedding vector(768) |
| analises | Histórico com tokens e custo |
| arquivos_analise | Arquivos anexados (cascade delete) |
| aprendizados | Resumos válidos com embedding |
| configuracoes | Chave/valor (câmbio, etc) |
| logs_erro | Erros de API |
| logs_acesso | Auditoria de ações com IP |
| imoveis | Cadastro completo de imóveis |

### Model Usuario — campos relevantes
```prisma
id, nome, email, senhaHash, perfil, unidadeId
ativo, acessoImob, acessoIncorp
totpSecret, totpAtivado, totpGraceExpiraEm    # 2FA
chatwootUserId (Int?), chatwootAccountId (Int?), chatwootToken (String?)
conviteToken (String? unique), conviteExpiraEm (DateTime?)
```

**Nota:** NÃO existem campos `consentimentoEm` ou `consentimentoIp` no schema atual.

### Model Imovel — campos principais
| Campo | Tipo | Descrição |
|-------|------|-----------|
| codigoRef | String @unique | Código Kenlo (ex: AP17597) |
| finalidade | String | RESIDENCIAL, COMERCIAL |
| tipo | String | CASA, APARTAMENTO, TERRENO, CHACARA, SALA, LOJA, CASA_COMERCIAL, GALPAO |
| subtipo | String? | Para casa: ISOLADA, SOBRADO, SOBREPOSTA_ALTA, SOBREPOSTA_BAIXA, VILLAGGIO, etc. |
| modalidade | String | VENDA, LOCACAO, AMBOS |
| situacao | String | DISPONIVEL, VENDIDO, ALUGADO |
| fotos | String? @db.Text | JSON array: [{url, ordem, principal}] |
| facilidadesImovel | String? | JSON array de facilidades do imóvel |
| facilidadesCond | String? | JSON array de facilidades do condomínio (inclui PORTARIA_24HRS) |
| facilidadesImovelOutros | String? | JSON array de facilidades extras (texto livre) |
| facilidadesCondOutros | String? | JSON array de facilidades extras do cond |
| slug | String? @unique | URL amigável gerada automaticamente |
| unidadeId | String | FK → unidades |
| publicarSite | Boolean | Exibir no site público imoveis.cf8.com.br |

### Relações
- Usuario → Unidade (N:1)
- Analise → Usuario, Unidade, Cidade
- Analise → ArquivoAnalise (1:N, cascade delete)
- Analise → Aprendizado (1:1)
- DocumentoIa → Cidade (nullable = global)
- Imovel → Unidade (N:1)

## Middleware — Roteamento e Proteção

O `middleware.ts` cobre três camadas:

### 1. Roteamento por hostname (Site Público)
- Se `host === 'imoveis.cf8.com.br'`: reescreve `/` → `/site`, `/imoveis/[ref]` → `/site/imoveis/[ref]`
- Arquivos estáticos e rotas `/api/` passam sem reescrita
- Rotas `/site/*` passam sem autenticação

### 2. API pública de imóveis
- `/api/imoveis/publico/*` passa sem autenticação (listagem e detalhe público)

### 3. Rotas públicas adicionais (sem auth)
- `/privacidade` e `/termos` — páginas legais acessíveis sem login
- `/api/cron/*` — autenticação própria via Bearer token (`CRON_SECRET`); bypass do NextAuth

### 4. Rotas protegidas
- Sem token → redirect `/login` (pages) ou 401 (API)
- 2FA enforçado para MASTER após período de carência (24h)
- **Consentimento LGPD:** todas as rotas autenticadas exigem `token.consentimentoEm`; sem consentimento → redirect `/lgpd/consentimento` (pages) ou 403 (API)
  - Isentas: `ROTAS_LIVRES_CONSENTIMENTO = ['/lgpd', '/api/lgpd', '/api/auth', '/api/2fa', '/login', '/configurar-2fa', '/privacidade', '/termos']`
- Módulo Imóveis: `/imoveis/*` e `/api/imoveis/*` exigem `acessoImob=true` para não-admins
- Módulo Incorporação: `/chat/*` e `/api/analises/*` exigem `acessoIncorp=true` para não-admins

## API Endpoints — Módulo de Imóveis

### GET /api/imoveis
- Lista imóveis com filtros: `modalidade`, `tipo`, `cidade`, `bairro`, `dormitorios`, `situacao`, `valor_min`, `valor_max`, `destaque`, `publicar_site`, `busca` (texto livre), `unidadeId` (MASTER only), `pagina`, `ordenar`
- `ordenar`: `mais_recente` (padrão, dataCadastro DESC) | `maior_valor` | `menor_valor` — nulls sempre por último
- Auth dupla: session NextAuth **ou** header `x-api-key: <API_KEY_N8N>` (para n8n)
- MASTER vê todos; demais perfis veem apenas sua unidade

#### Busca por Texto Livre (`busca`)
Implementada como `OR` com `contains + mode: insensitive` (ILIKE):

| Campo Prisma | Condição |
|---|---|
| `codigoRef`, `nome`, `bairro`, `proprietario` | Sempre |
| `logradouro`, `cidade`, `captador`, `edificio`, `acesso` | Sempre |
| `facilidadesImovel`, `facilidadesCond`, `facilidadesImovelOutros`, `facilidadesCondOutros` | Sempre — JSON serializado |
| `vagasGaragem`, `totalBanheiros` | Condicional — só quando `busca` é número válido (`!isNaN(parseInt)`) |

### POST /api/imoveis
- Cria imóvel — MASTER, PROPRIETARIO, ASSISTENTE
- ASSISTENTE/PROPRIETARIO: unidade fixada no token
- MASTER: pode informar `unidadeId` no body
- Auto-gera `linkSite` = `/imovel/{codigoRef}` e `slug` se não informados
- Retorna 409 se `codigoRef` já existe

### GET /api/imoveis/[id]
- Detalhe completo — MASTER, PROPRIETARIO, ASSISTENTE, CORRETOR
- Restrição por unidade para não-MASTER

### PUT /api/imoveis/[id]
- Edição parcial — MASTER, PROPRIETARIO, ASSISTENTE (CORRETOR não pode)
- Schema Zod `.strict()` — rejeita campos desconhecidos
- Usado também pelo Salvar Ordem da galeria (envia apenas `fotos`)

### DELETE /api/imoveis/[id]
- Exclusão — apenas MASTER

### POST /api/imoveis/[id]/duplicar
- Duplica o imóvel — MASTER, PROPRIETARIO, ASSISTENTE
- Cria cópia com `codigoRef` incrementado (`AP001` → `AP001-COPIA`), sem fotos
- Novo slug gerado automaticamente
- Registra log `imovel_duplicado`

### POST /api/imoveis/gerar-descricao
- Gera descrição de marketing com Gemini 2.5 Flash
- Recebe dados do imóvel (tipo, área, quartos, bairro, etc.)
- Retorna texto de 150–250 palavras, 3–4 parágrafos, sem clichês
- `maxOutputTokens: 2048`, `temperature: 0.7`

### GET /api/imoveis/publico
- Listagem pública — sem autenticação
- Filtra automaticamente `publicarSite=true`
- Paginação: 12 por página
- Filtros: `tipo`, `modalidade`, `busca`, `cidade`, `bairro`, `quartos_min`, `suites_min`, `vagas_min`, `valor_max`, `destaque`

### GET /api/imoveis/publico/[ref]
- Detalhe público por `codigoRef` — sem autenticação
- Requer `publicarSite=true`

### GET /api/imoveis/publico/fotos
- Proxy de fotos para o site público — sem autenticação
- Query param: `url` (URL do Blob privado)
- `Cache-Control: public, max-age=3600`

### POST /api/imoveis/[id]/fotos
- Upload via `multipart/form-data` (campo `foto`)
- Comprime com **sharp** → WebP, max 1920×1920px, qualidade 80
- Salva no Vercel Blob (private) em `/imoveis/{id}/`
- Primeira foto vira principal automaticamente

### DELETE /api/imoveis/[id]/fotos
- Body: `{ url: "https://..." }`
- Remove do Vercel Blob + atualiza JSON do campo fotos
- Renumera ordens; promove nova principal se necessário

### GET /api/imoveis/[id]/fotos/zip
- Download ZIP de todas as fotos — auth session, restrição por unidade
- Usa **JSZip** (arraybuffer); arquivos nomeados `{codigoRef}_{n}.webp`

### GET /api/imoveis/fotos/download
- Proxy autenticado para fotos privadas do Vercel Blob (dashboard)
- Query param: `url` (URL do blob)

### GET /api/imoveis/relatorios
- Estatísticas para gráficos — MASTER, PROPRIETARIO
- MASTER: todas as unidades; PROPRIETARIO: apenas sua unidade
- Retorna: `{ total, porStatus, porBairro (top 10), porCorretor }`

### GET /api/imoveis/relatorios/impressao
- Lista para relatório imprimível — MASTER, PROPRIETARIO
- Filtros: `unidadeId`, `modalidade`, `tipo`, `cidade`, `captador`
- OrderBy: Unidade → Captador → Modalidade → Tipo → Cidade → Bairro
- Retorna: `{ imoveis, filtrosAplicados, total, geradoEm }`

### GET /api/imoveis/fotos/download
- Proxy autenticado para fotos privadas do Vercel Blob
- Query param: `url`

## API Endpoints — Logs e Auditoria

### GET /api/logs
- Logs de auditoria com filtros — MASTER
- Filtros: `usuarioId`, `unidadeId`, `acao`, `recurso`, `dataInicio`, `dataFim`, `pagina`
- Retorna: `{ logs, total, pagina, porPagina, usuarios, unidades }`

### POST /api/logs/exportacao
- Registra exportação de análise + verifica abuso (via `lib/alertas.ts`)
- Dispara email para MASTERs se 5+ exports em 1 hora

## API Endpoints — Usuários e Convites

### GET /api/usuarios/convite?token=xxx
- Valida token de convite — sem autenticação
- Retorna: nome, email; erro 404 ou 410 (expirado)

### POST /api/usuarios/convite/aceitar
- Aceita convite, define senha, cria usuário no Chatwoot
- Body: `{ token, senha }`

### POST /api/usuarios/[id]/reenviar-convite
- Reenvio de convite por email — MASTER, PROPRIETARIO

## Autenticação

### Perfis e permissões completo
| Ação | MASTER | PROPRIETARIO | ESPECIALISTA | ASSISTENTE | CORRETOR |
|------|--------|-------------|-------------|------------|----------|
| Ver todas as análises | ✅ | ❌ só unidade | ❌ só próprias | ❌ | ❌ |
| Criar usuário qualquer perfil | ✅ | ❌ | ❌ | ❌ | ❌ |
| Criar ESPECIALISTA/ASSISTENTE/CORRETOR | ✅ | ✅ sua unidade | ❌ | ❌ | ❌ |
| Convidar usuário por email | ✅ | ✅ | ❌ | ❌ | ❌ |
| Treinar IA | ✅ | ❌ | ❌ | ❌ | ❌ |
| Chat campos obrigatórios | ❌ | ❌ | ✅ | ❌ | ❌ |
| Cadastrar/editar imóvel | ✅ | ✅ | ❌ | ✅ | ❌ |
| Ver imóvel | ✅ | ✅ | ❌ | ✅ | ✅ |
| Ver campos sensíveis do imóvel | ✅ | ✅ | ❌ | ✅ | ❌ |
| Excluir imóvel | ✅ | ❌ | ❌ | ❌ | ❌ |
| Upload fotos | ✅ | ✅ | ❌ | ✅ | ❌ |
| Ver relatórios | ✅ | ✅ | ❌ | ❌ | ❌ |

## Integração Gemini

### Módulo Incorporação
- gemini-2.5-flash, maxOutputTokens: 8192, temperature: 0.7
- Contexto: documentos globais + documentos da cidade + aprendizados recentes (últimos 3)
- Histórico completo multiturno

### Módulo Imóveis — Gerar Descrição
- gemini-2.5-flash, maxOutputTokens: 2048, temperature: 0.7
- System instruction: Copywriter Imobiliário Especialista
- Saída: 150–250 palavras, 3–4 parágrafos (sem clichês, sem listas)
- Modal de confirmação antes de sobrescrever descrição existente

### Cálculo de custo (incorporação)
- `custo_usd = (tokens_input * 0.10 + tokens_output * 0.40) / 1_000_000`
- `custo_brl = custo_usd * cambio` (lido da tabela configuracoes)

## Upload de Arquivos

### Vercel Blob
- Store: portal-biocasa-blob (região GRU1 São Paulo)
- Incorporação: `access: 'private'`, proxy `/api/arquivos/download`
- Imóveis (fotos): `access: 'private'`, pasta `/imoveis/{id}/`, proxy `/api/imoveis/fotos/download` (dashboard) ou `/api/imoveis/publico/fotos` (site público — sem auth)
- Versão @vercel/blob: 2.3.3

## Sistema de Convites

### Fluxo
1. MASTER/PROPRIETARIO cria usuário no painel → sem informar senha → email enviado via Resend
2. Email contém link com `conviteToken` (UUID, expira em 7 dias)
3. Usuário acessa o link → página pública de aceite
4. Define senha → backend valida token, faz hash, ativa usuário
5. Se `chatwootUserId` null → backend chama `criarUsuarioChatwoot()` automaticamente

### Reenvio
- Botão "Reenviar Convite" disponível enquanto usuário não aceitou (conviteToken ainda existe)
- `POST /api/usuarios/[id]/reenviar-convite` — gera novo token e reenvia email

## Alertas de Segurança (lib/alertas.ts)

Detecta comportamentos suspeitos e envia emails para todos os MASTERs ativos via Resend.

| Evento | Gatilho | Lib |
|--------|---------|-----|
| Logins falhos repetidos | 3+ logins do mesmo IP em 10 min | `verificarLoginFalhou()` |
| Exportações abusivas | 5+ exports em 1 hora | `verificarExportacaoAbusiva()` |

## Site Público de Imóveis (app/(site))

### Configuração
- Domínio: `imoveis.cf8.com.br`
- Middleware: rewrites todo o tráfego para `/site/*` (transparente para o usuário)
- Sem autenticação — somente imóveis com `publicarSite=true` são exibidos

### Páginas
- `/` → homepage com `BuscaHero` (busca por tipo/cidade/quartos) + grid de cards
- `/imoveis/[ref]` → detalhe do imóvel: galeria lightbox, dados completos, sem campos administrativos

### Fotos públicas
- `/api/imoveis/publico/fotos?url=...` — proxy sem auth, cache 1h
- `GaleriaPublica.tsx` — galeria com miniatura + lightbox, sem autenticação

## Páginas de Impressão (app/(imprimir))

### Layout
- Route group `(imprimir)`: layout limpo sem sidebar, otimizado para `@media print`
- Todas as rotas são protegidas por autenticação (exceto `/imprimir/ficha-captacao` para CORRETOR)

### Ficha de Captação
- URL: `/imprimir/ficha-captacao?id={imovelId}` ou via ImovelForm
- `FichaImpressaoClient.tsx`: busca dados, renderiza para impressão meia folha A4 (148mm)
- Campos sensíveis visíveis somente para MASTER/PROPRIETARIO/ASSISTENTE

### Relatório de Imóveis (Impressão)
- Gerado via `window.open()` na aba de relatórios — não usa `(imprimir)`
- HTML com CSS inline, agrupamento Unidade → Captador → Modalidade
- `@page { size: A4 portrait; margin: 1.5cm }`, tabela com `table-layout: fixed`

## Módulo de Imóveis — Interface e Componentes

### Listagem `/imoveis` — Filtros, Cards e Persistência
- **Linha 1:** Modalidade | Tipo | Dormitórios | Faixa de Valor | Cidade | Bairro
- **Linha 2:** Busca livre (flex-1) | Ordenar por | Filtrar | Limpar
- **Persistência:** `sessionStorage` (chave `biocasa:imoveis:filtros`)
  - Filtros salvos ao clicar Filtrar ou mudar página
  - Restaurados ao retornar via botão Voltar do detalhe/edição
  - Limpados ao navegar para fora do módulo (sidebar, etc.)
  - Filtros iniciam **vazios** por padrão (sem valores padrão)
- **Navegação interna** marcada com `navegandoInternamente.current = true` em: Ver, Editar, Novo Imóvel, Relatórios

### Relatórios `/imoveis/relatorios` — Duas Abas
**Aba Gráficos:**
- Donut SVG (puro, sem lib externa): status dos imóveis com legenda
- Barras CSS horizontais: top 10 bairros + captadores
- Fichas: link para impressão da ficha de captação

**Aba Relatório de Imóveis:**
- Filtros (ocultos na impressão): Unidade (MASTER) | Modalidade | Tipo | Cidade | Captador
- Botão "Imprimir": abre `window.open()` com HTML+CSS completo e chama `print()`
- Agrupamento: **Unidade → Captador → Modalidade** (Maps aninhados)
- `page-break-inside: avoid` somente no nível do captador (não da unidade)

### Formulário `ImovelForm.tsx` — 5 Seções
1. Identificação e Classificação — codigoRef, tipo, finalidade, modalidade, situacao, destaque, publicarSite, parceria
2. Endereço — CEP (auto-fill ViaCEP) → Logradouro → Nº → Complemento → Bairro → Cidade → Estado → Edifício
3. Detalhes Técnicos — áreas, quartos, suítes, banheiros, garagem, facilidades, descrição + botão "Gerar com IA"
4. Dados Comerciais — valorVenda/Locacao/Condominio/IPTU (máscaras BRL), proprietário, telefone, comissão, links, obsInternas
5. Fotos — contador; botões: "Baixar Fotos" (ZIP) + "Gerenciar Fotos" (modal)

**Campos sensíveis ocultos para CORRETOR:** proprietário, telefone, codIptu, codMatricula, obsInternas, percComissao.

**Botões do rodapé:** `[Excluir] [Cancelar]` esquerda · `[Salvar] [Voltar]` direita.

**Máscaras:** BRL (armazena float, exibe formatado), telefone (detecta celular pelo 3º dígito `=== '9'`), CEP (auto-fill ViaCEP ao atingir 8 dígitos).

### `GaleriaFotos.tsx`
- Dropzone (react-dropzone) para upload
- HTML5 drag-and-drop nativo para reordenação lazy
- Banner amarelo "Salvar Ordem" aparece ao arrastar; PUT imediato ao confirmar
- `readOnly` mode para a página de detalhes
- `onFotosChange?` callback notifica o pai

### `GerenciarFotosModal.tsx`
- Modal fullscreen (z-50), fecha com ESC/overlay/botão X
- Bloqueia scroll do body enquanto aberto
- Header mostra contador atualizado via `onFotosChange`

### Página de Detalhes `/imoveis/[id]`
- 4 seções em grid: Dados Comerciais | Dados do Imóvel | Dados do Condomínio | Dados Administrativos
- Chips de facilidades: ativos = dourado, inativos = apagados
- Parceria: badge verde com `✓` no card de identificação
- Compartilhar: usa `linkExterno`; desabilitado com tooltip se não cadastrado
- Botões: Editar | Duplicar | Imprimir Ficha | (campos sensíveis ocultos para CORRETOR)

### `lib/utils.ts` — Funções
| Função | Descrição |
|--------|-----------|
| `formatarMoeda(valor)` | BRL formatado: R$ 1.234.567,89 |
| `formatarTelefone(valor)` | `(XX) XXXXX-XXXX` ou `(XX) XXXX-XXXX` |
| `parsearOutros(valor)` | String: JSON array → `join(', ')`, fallback literal |
| `parsearOutrosArray(valor)` | `string[]`: JSON array → array filtrado, fallback `[valor]` |

## Dashboard MASTER Unificado (Hub Unificado Sessão 5) ✅

### Estrutura
- URL: `/consolidado` — acesso exclusivo MASTER
- Componente: `DashboardMaster.tsx` com 4 abas via `?aba=` na URL
- Sidebar: "Dashboard" (substituiu o acesso direto a Usuários para MASTER)

### Abas
| Aba | Componente | Conteúdo |
|-----|-----------|----------|
| Métricas | `DashboardConsolidado.tsx` | 4 cards totais + tabela por unidade + gráficos barras CSS |
| Usuários | `UserManagement.tsx` | Lista de usuários com filtros, convites, ativar/desativar |
| Auditoria | `AbaAuditoria.tsx` | Timeline de logs com filtros (usuário, unidade, ação, período) |
| Configurações | `AbaConfiguracoes.tsx` | Gestão de unidades (limite análises, status, proprietário) |

### API `GET /api/logs`
- Filtros: usuarioId, unidadeId, acao, recurso, dataInicio, dataFim, pagina
- Retorna logs com dados do usuário (nome, email, perfil, unidade)

### Marca d'água em exportações
- PDFs de análises incluem `<div class="watermark">BIOCASA</div>` (fundo fixo, semitransparente)
- Visível apenas na impressão (`@media print { .watermark { display: block } }`)

## Integração Chatwoot (Hub Unificado Sessão 2) ✅

### Solução final: iframe com SSO via Platform API
- Portal: `portal.cf8.com.br` | Chatwoot: `atendimento.cf8.com.br` — mesmo domínio raiz `.cf8.com.br`
- Cookies `SameSite=None; Secure` configurados no Chatwoot — iframe funciona (first-party context)
- `ChatwootEmbed.tsx`: chama `/api/chatwoot/sso` → carrega URL SSO no iframe (100% da área)

### Campos do schema Usuario relacionados ao Chatwoot
- `chatwootUserId` (Int?) — ID numérico do usuário no Chatwoot; null = sem acesso
- `chatwootAccountId` (Int?) — ID da conta (Account) do Chatwoot
- `chatwootToken` (String?) — Token de autenticação do usuário no Chatwoot

### Variáveis de ambiente necessárias
```
CHATWOOT_PLATFORM_TOKEN="<token de super-admin do Chatwoot>"
```

## LGPD e Conformidade (Hub Unificado Sessão 4) ✅

### 4.1 — Documentos legais
- `app/(auth)/privacidade/page.tsx` — Política de Privacidade (pública, fundo branco, max-w-800px)
- `app/(auth)/termos/page.tsx` — Termos de Uso (mesma estrutura)
- Footer no dashboard layout com links para ambas as páginas
- `LGPD-REGISTRO-TRATAMENTO.md` — registro interno Art. 37 (controlador, operadores, atividades, retenção)

### 4.2 — Consentimento no primeiro login
- Schema: campos `consentimentoEm DateTime?` e `consentimentoIp String?` na tabela `usuarios`
- `app/api/lgpd/consentimento/route.ts` — POST grava data + IP no banco
- `app/(auth)/lgpd/consentimento/page.tsx` — tela de aceite (checkbox obrigatório)
- JWT: `trigger === 'update'` atualiza `token.consentimentoEm` sem novo login
- Middleware verifica `token.consentimentoEm` em todas as rotas autenticadas

### 4.3 — Retenção de dados via Vercel Cron
- `app/api/cron/retencao/route.ts` — GET autenticado via `Bearer CRON_SECRET`
- Schedule: `0 3 1 * *` (dia 1 de cada mês, 03:00 UTC) em `vercel.json`
- Etapas: análises > 5 anos (+ blobs Vercel) → arquivos_analise > 2 anos → logs_acesso > 1 ano → logs_erro > 6 meses
- Cada etapa tem `try/catch` independente; resultado registrado em `logs_erro`
- Middleware: `/api/cron/*` bypassa NextAuth (autenticação própria via Bearer)

### 4.4 — Soft-delete de usuários
- `DELETE /api/usuarios/[id]` → `ativo=false` + desassociação Chatwoot + log
- Login com conta desativada → mensagem específica

### 4.5 — Registro de tratamento interno
- `LGPD-REGISTRO-TRATAMENTO.md` na raiz — Art. 37 LGPD
- Controlador: CF8 Negócios Imobiliários Ltda (CNPJ 31.399.238/0001-65)
- Operadores: Vercel, Google LLC (Gemini), Hetzner

## Segurança — Implementado ✅
| Item | Status | Detalhes |
|------|--------|---------|
| UFW ativo na VPS2 | ✅ | deny default; 22/80/443/5433 liberados |
| PostgreSQL SSL | ✅ | Certificado autoassinado; `ssl=on`; scram-sha-256 |
| Backup automático | ✅ | `/opt/backups/biocasa`, cron 03h00, retenção 30 dias |
| Rate limiting APIs | ✅ | 10 req/min login; 30 req/min analises/arquivos |
| Logs de acesso | ✅ | Tabela `logs_acesso`; lib/logs.ts |
| 2FA TOTP para MASTER | ✅ | otplib; QR code; período de carência 24h |
| Alertas de segurança por email | ✅ | lib/alertas.ts + lib/email.ts (Resend) |
| Marca d'água em PDFs | ✅ | ExportarPDF.tsx com div watermark BIOCASA |
| Campos sensíveis ocultos (CORRETOR) | ✅ | Sessão 9 |
| DATABASE_URL com SSL | ⚠ | Ação manual: adicionar `?sslmode=require` no painel Vercel |

## Variáveis de Ambiente

```
DATABASE_URL="postgresql://biocasa_user:<SENHA_URL_ENCODED>@178.105.38.118:5433/portal_biocasa"
NEXTAUTH_URL="https://portal.cf8.com.br"
NEXTAUTH_SECRET="<openssl rand -base64 32>"
GEMINI_API_KEY="<chave Google AI Studio>"
BLOB_READ_WRITE_TOKEN="<token painel Vercel>"
DOLAR_REAL_PADRAO="5.50"
API_KEY_N8N="<chave aleatória forte>"            # Auth para integração n8n
CHATWOOT_PLATFORM_TOKEN="<super-admin token>"    # SSO Chatwoot
RESEND_CONFIG="<api_key>|<from@email.com>"       # Email convites e alertas (formato: key|from)
CRON_SECRET="<openssl rand -base64 32>"          # Auth Bearer do endpoint /api/cron/retencao
```

## Comandos Úteis

```bash
# Desenvolvimento
npm run dev
npm run build
npm run db:push
npm run db:seed
npm run db:studio

# VPS2 — PostgreSQL
ssh vps2 "docker service ls | grep postgres-biocasa"
ssh vps2 "docker service update --force postgres-biocasa_postgres"
ssh vps2 "docker exec -it \$(docker ps -q -f name=postgres-biocasa) psql -U biocasa_user -d portal_biocasa"
ssh vps2 "docker exec \$(docker ps -q -f name=postgres-biocasa) pg_dump -U biocasa_user portal_biocasa > /tmp/backup-biocasa-\$(date +%Y%m%d).sql"

# Diagnóstico
curl https://portal.cf8.com.br/api/diagnostico?debug=biocasa2026
```

## Sessão 9 — Relatórios de Imóveis, Filtros, Segurança Corretor (Maio 2026) ✅

### Relatórios `/imoveis/relatorios`
- **Aba Gráficos:** donut SVG (sem lib externa) para status + barras CSS para bairros e captadores
- **Aba Relatório:** filtros de seleção + impressão via `window.open()` com HTML+CSS isolado
  - Agrupamento: Unidade → Captador → Modalidade (Maps aninhados)
  - CSS: `@page A4 portrait`, colgroup com larguras fixas, `page-break-inside: avoid` apenas no captador
  - API `/api/imoveis/relatorios` (gráficos) + `/api/imoveis/relatorios/impressao` (tabela)

### Filtros de listagem com sessionStorage
- Filtros persistidos durante navegação interna ao módulo
- Cleanup automático ao sair do módulo (sidebar → navegação externa)
- Prioridade: URL params > sessionStorage > vazio
- Filtros iniciam vazios por padrão (removidos defaults VENDA/APARTAMENTO)

### Segurança comercial — Perfil CORRETOR
- CORRETOR tem acesso somente leitura ao módulo de imóveis
- Campos sensíveis ocultos na listagem e no detalhe: proprietário, telefone, IPTU, matrícula, obs internas, comissão

## Sessão 10 — LGPD: Consentimento, Páginas Legais e Retenção de Dados (Maio 2026) ✅

### Consentimento no primeiro login
- Schema: `consentimentoEm DateTime?` e `consentimentoIp String?` adicionados à tabela `usuarios` (`npx prisma db push`)
- `POST /api/lgpd/consentimento` — grava data e IP; retorna `consentimentoEm` para o cliente
- `app/(auth)/lgpd/consentimento/page.tsx` — tela de aceite com checkbox; chama `update({ consentimentoEm })` do `useSession()` para atualizar o JWT sem novo login
- JWT callback com `trigger === 'update'` propaga `consentimentoEm` ao token
- Middleware: todas as rotas autenticadas verificam `token.consentimentoEm`

### Páginas legais públicas
- `app/(auth)/privacidade/page.tsx` — Política de Privacidade (bg-white, max-w-800px, botão "← Voltar")
- `app/(auth)/termos/page.tsx` — Termos de Uso (mesma estrutura visual)
- Links atualizados na tela de consentimento (`href="/privacidade"` e `href="/termos"`)
- Footer no `app/(dashboard)/layout.tsx`: `© 2026 CF8 · Portal Biocasa · Política de Privacidade · Termos de Uso`
- Middleware: `/privacidade` e `/termos` retornam antes do `getToken()` (sem auth)
- Middleware: `/privacidade` e `/termos` adicionados ao `ROTAS_LIVRES_CONSENTIMENTO`

### Retenção de dados via Vercel Cron
- `app/api/cron/retencao/route.ts` — GET com autenticação Bearer (`CRON_SECRET`)
- `vercel.json` — seção `crons` adicionada: schedule `0 3 1 * *` (dia 1, 03:00 UTC)
- Middleware: `/api/cron/*` bypassa NextAuth completamente
- `.env.example` e `.env.local` atualizados com `CRON_SECRET`

### Documentação LGPD
- `LGPD-REGISTRO-TRATAMENTO.md` — Registro de Atividades de Tratamento (Art. 37)
  - Controlador, operadores, 5 atividades de tratamento, direitos dos titulares, medidas de segurança
  - Dados preenchidos: CNPJ 31.399.238/0001-65, Av. Cons. Nebias 671, santos@biocasaimob.com.br

## Convenções de Código
- Arquivos: PascalCase componentes, camelCase libs
- Variáveis/funções: camelCase em português
- Erros API: sempre logar em logs_erro, retornar `{ erro: 'mensagem amigável' }`
- Autenticação: sempre verificar session + perfil nas API routes
- Campos JSON (fotos, facilidades): armazenados como String serializado; parse na camada da aplicação

## Cores Tailwind
- dourado-400 = #C9A84C (primária, botões)
- escuro-600 = #1A1A2E (fundo)
- escuro-500 = cards e painéis
- escuro-700 = sidebar e header

## Pendências / TODOs
| # | Item | Prioridade | Status |
|---|------|-----------|--------|
| 1 | Busca semântica real com text-embedding-004 | Alta | ⏳ |
| 2 | Análise Profunda com Google Search (400 bad request) | Alta | ⏳ |
| 3 | Adicionar `?sslmode=require` ao DATABASE_URL no painel Vercel | Alta | ⏳ |
| 4 | Adicionar API_KEY_N8N no painel Vercel | Alta | ⏳ |
| 5 | Script de importação Kenlo (~125 imóveis) via API /api/imoveis | Alta | ⏳ |
| 6 | Site público de imóveis (portal de busca para clientes) | Média | ✅ |
| 7 | Automações n8n WhatsApp (notificações de novos imóveis) | Média | ⏳ |
| 8 | Integrações de portais (ZAP, Viva Real, OLX) via n8n | Média | ⏳ |
| 9 | ERPNext no Portal (Hub Sessão 7) | Média | ⏳ |
| 10 | Reset mensal analises_mes (cron job) | Média | ⏳ |
| 11 | Logo real da Biocasa | Média | ⏳ |
| 12 | Responsivo mobile completo | Média | ⏳ |
| 13 | Onboarding automatizado de novas unidades (Hub Sessão 8) | Média | ⏳ |
| 14 | Paginação no histórico da Sidebar | Baixa | ⏳ |
| 15 | Notificação email quando limite de análises atingido | Baixa | ⏳ |
| 16 | consentimentoEm/consentimentoIp na tabela usuarios (LGPD Task 4.2) | Baixa | ✅ |

## Usuário inicial (seed)
| Email | Senha | Perfil |
|-------|-------|--------|
| master@biocasa.com.br | Biocasa@2026! | MASTER |
