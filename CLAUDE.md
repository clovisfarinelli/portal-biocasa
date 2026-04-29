# Portal Biocasa — Guia de Arquitetura para Claude Code
*Atualizado: Abril 2026*

Este arquivo documenta a arquitetura completa, decisões técnicas e convenções do projeto para uso em sessões futuras.

## Visão Geral
Portal de **Análise de Viabilidade Imobiliária** com IA + **Módulo de Cadastro de Imóveis**, desenvolvido para a Biocasa.
- Módulo de Incorporação: analisa imóveis e terrenos usando Google Gemini 2.5 Flash
- Módulo de Imóveis: cadastro e gestão completa de imóveis para venda/locação
- Cinco perfis de acesso: MASTER, PROPRIETARIO, ESPECIALISTA, ASSISTENTE, CORRETOR
- Flags de acesso por módulo: acessoImob e acessoIncorp (para ESPECIALISTA, ASSISTENTE, CORRETOR)
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
| Deploy frontend | Vercel | — |
| Deploy banco | Docker Swarm (VPS2) | — |

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
│   ├── (auth)/login/               # Página de login
│   ├── (dashboard)/
│   │   ├── layout.tsx              # Layout com Sidebar
│   │   ├── chat/page.tsx           # Chat de análise
│   │   ├── usuarios/page.tsx       # Gestão de usuários
│   │   └── treinar-ia/page.tsx     # Treinamento da IA (MASTER)
│   ├── api/
│   │   ├── auth/[...nextauth]/
│   │   ├── analises/               # CRUD + envio ao Gemini
│   │   ├── analises/[id]/          # Detalhe + validação
│   │   ├── arquivos/               # Upload Vercel Blob
│   │   ├── arquivos/download/      # Proxy autenticado para arquivos privados
│   │   ├── cidades/
│   │   ├── configuracoes/          # Câmbio e configs
│   │   ├── diagnostico/            # Diagnóstico da API (?debug=biocasa2026)
│   │   ├── documentos/
│   │   ├── logs-erro/
│   │   ├── unidades/
│   │   └── usuarios/
├── components/
│   ├── ChatInterface.tsx           # Chat principal com Gemini
│   ├── ExportarPDF.tsx
│   ├── LogoBiocasa.tsx             # Placeholder SVG
│   ├── Providers.tsx
│   ├── Sidebar.tsx
│   ├── TreinarIA.tsx
│   ├── UploadArquivos.tsx          # Dropzone com dois campos: IPTU + Outros
│   └── UserManagement.tsx
├── lib/
│   ├── auth.ts                     # NextAuth + JWT com perfil e unidadeId
│   ├── gemini.ts                   # Gemini 2.5 Flash + busca contexto
│   ├── prisma.ts
│   └── utils.ts
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
└── middleware.ts
```

## Banco de Dados

### Tabelas
- unidades → franquias/filiais
- usuarios → MASTER | PROPRIETARIO | ESPECIALISTA
- cidades → unique: nome + estado
- documentos_ia → treinamento com embedding vector(768)
- analises → histórico com tokens e custo
- arquivos_analise → arquivos anexados (cascade delete)
- aprendizados → resumos válidos com embedding
- configuracoes → chave/valor (câmbio, etc)
- logs_erro → erros de API

### Relações
- Usuario → Unidade (N:1)
- Analise → Usuario, Unidade, Cidade
- Analise → ArquivoAnalise (1:N, cascade delete)
- Analise → Aprendizado (1:1)
- DocumentoIa → Cidade (nullable = global)

## Autenticação

### Perfis e permissões
| Ação | MASTER | PROPRIETARIO | ESPECIALISTA |
|------|--------|-------------|-------------|
| Ver todas as análises | ✅ | ❌ só unidade | ❌ só próprias |
| Criar usuário qualquer perfil | ✅ | ❌ | ❌ |
| Criar ESPECIALISTA | ✅ | ✅ sua unidade | ❌ |
| Treinar IA | ✅ | ❌ | ❌ |
| Configurar câmbio | ✅ | ❌ | ❌ |
| Criar unidade | ✅ | ❌ | ❌ |
| Chat campos obrigatórios | ❌ | ❌ | ✅ |

## Integração Gemini

### Modelo atual
- gemini-2.5-flash
- maxOutputTokens: 8192
- temperature: 0.7

### Fluxo de contexto
1. Documentos globais ativos (categoria = GLOBAL)
2. Documentos da cidade (categoria = CIDADE, cidadeId)
3. Aprendizados recentes da cidade (últimos 3)
4. Contexto injetado na primeira mensagem
5. Histórico completo multiturno

### Cálculo de custo
- custo_usd = (tokens_input * 0.10 + tokens_output * 0.40) / 1_000_000
- custo_brl = custo_usd * cambio (lido da tabela configuracoes)

### Fluxo quando dados insuficientes
1. IA lista o que falta
2. Exibe botões: "Autorizar Análise Profunda" ou "Enviar Documentos"
3. "Autorizar" → toggle ativa + reenvio automático
4. "Enviar" → abre dropzone, usuário sobe docs, IA analisa o que recebeu,
   informa o que ainda falta, pergunta o que fazer antes de gerar análise completa

### Análise Profunda
- Flag analiseProfunda enviada ao backend
- PENDENTE: Google Search grounding retorna 400 no gemini-2.5-flash
- Alternativa em investigação: Google Custom Search API ou duck-duck-scrape

### Marcador especial
- IA inclui [SOLICITAR_DOCS] quando dados insuficientes
- Backend faz strip antes de salvar no banco
- Frontend detecta e exibe botões de ação

## Upload de Arquivos

### Vercel Blob
- Store: portal-biocasa-blob (região GRU1 São Paulo)
- Access: private
- Rota de download: /api/arquivos/download (proxy autenticado)
- Versão @vercel/blob: 2.3.3

### Dois campos separados no chat
- Campo 1: IPTU (1 arquivo, obrigatório para ESPECIALISTA)
- Campo 2: Outros Documentos (até 9 arquivos, opcional)

## Variáveis de Ambiente

```
DATABASE_URL="postgresql://biocasa_user:<SENHA_URL_ENCODED>@178.105.38.118:5433/portal_biocasa"
NEXTAUTH_URL="https://portal-biocasa.vercel.app"
NEXTAUTH_SECRET="<openssl rand -base64 32>"
GEMINI_API_KEY="<chave Google AI Studio>"
BLOB_READ_WRITE_TOKEN="<token painel Vercel>"
DOLAR_REAL_PADRAO="5.50"
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
```

## Convenções de Código
- Arquivos: PascalCase componentes, camelCase libs
- Variáveis/funções: camelCase em português
- Erros API: sempre logar em logs_erro, retornar { erro: 'mensagem amigável' }
- Autenticação: sempre verificar session + perfil nas API routes

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

## Usuário inicial (seed)
| Email | Senha | Perfil |
|-------|-------|--------|
| master@biocasa.com.br | Biocasa@2026! | MASTER |
