# Portal Biocasa — Análise de Viabilidade Imobiliária

Sistema de análise de viabilidade imobiliária com Inteligência Artificial (Google Gemini).

## Stack

- **Frontend:** Next.js 14 (App Router) + Tailwind CSS
- **Banco de dados:** PostgreSQL 15 + pgvector (VPS2)
- **ORM:** Prisma
- **IA:** Google Gemini 1.5 Pro
- **Autenticação:** NextAuth.js
- **Upload:** Vercel Blob
- **Deploy:** Vercel (frontend) + Docker Swarm (banco)

## Perfis de Acesso

| Perfil | Descrição |
|--------|-----------|
| **MASTER** | Acesso total: cria usuários, treina IA, vê todas as análises |
| **PROPRIETARIO** | Gerencia especialistas da sua unidade, faz análises |
| **ESPECIALISTA** | Apenas chat de análise com campos obrigatórios |

## Configuração Local

### 1. Variáveis de ambiente

```bash
cp .env.example .env.local
```

Edite `.env.local` com suas credenciais:

```env
DATABASE_URL="postgresql://biocasa_user:SENHA@178.105.38.118:5433/portal_biocasa"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="gere-com: openssl rand -base64 32"
GEMINI_API_KEY="sua-chave-gemini"
BLOB_READ_WRITE_TOKEN="seu-token-vercel-blob"
```

### 2. Instalar dependências

```bash
npm install
```

### 3. Sincronizar banco de dados

```bash
npx prisma db push
npx tsx prisma/seed.ts
```

### 4. Executar em desenvolvimento

```bash
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000)

**Usuário padrão:** `master@biocasa.com.br` / `Biocasa@2026!`

## Deploy na Vercel

1. Conecte o repositório GitHub à Vercel
2. Configure as variáveis de ambiente no painel da Vercel
3. O deploy é automático a cada push na branch `main`

### Variáveis necessárias na Vercel

```
DATABASE_URL
NEXTAUTH_URL
NEXTAUTH_SECRET
GEMINI_API_KEY
BLOB_READ_WRITE_TOKEN
DOLAR_REAL_PADRAO
```

## Infraestrutura (VPS2)

O PostgreSQL 15 com pgvector roda em Docker Swarm na VPS2:

- **Host:** 178.105.38.118
- **Porta:** 5433 (mapeada da 5432 interna)
- **Banco:** portal_biocasa
- **Stack Docker:** postgres-biocasa

### Comandos úteis

```bash
# Ver status do serviço
ssh vps2 "docker service ls | grep postgres-biocasa"

# Logs do PostgreSQL
ssh vps2 "docker service logs postgres-biocasa_postgres --tail 50"

# Acessar banco
ssh vps2 "docker exec -it \$(docker ps -q -f name=postgres-biocasa) psql -U biocasa_user -d portal_biocasa"
```

## Comandos de desenvolvimento

```bash
npm run dev          # Servidor de desenvolvimento
npm run build        # Build de produção
npm run db:generate  # Regenera o Prisma client
npm run db:push      # Sincroniza schema com banco
npm run db:migrate   # Cria migração
npm run db:studio    # Abre Prisma Studio
npm run db:seed      # Popula dados iniciais
```

## Estrutura do Projeto

```
portal-biocasa/
├── app/
│   ├── (auth)/login/        # Página de login
│   ├── (dashboard)/         # Layout com sidebar
│   │   ├── chat/            # Chat de análise
│   │   ├── usuarios/        # Gerenciar usuários
│   │   └── treinar-ia/      # Treinamento da IA (MASTER)
│   └── api/                 # API Routes
├── components/              # Componentes React
├── lib/                     # Utilitários e integrações
├── prisma/                  # Schema e seed
└── types/                   # Tipos TypeScript
```
