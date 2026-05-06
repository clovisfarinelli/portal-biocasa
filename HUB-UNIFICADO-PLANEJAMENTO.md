# Hub Unificado Biocasa — Plano de Desenvolvimento
*Criado: Maio 2026*

## Contexto
Transformar o Portal Biocasa em um hub central onde todos os sistemas
(análises, imóveis, atendimento, financeiro) rodam com a mesma cara e
login único. Sem abrir outro software.

## Visão final da Sidebar
```
├── 🏠  Análise de Viabilidade   (já existe)
├── 🏢  Imóveis                  (já existe, melhorias em andamento)
├── 💬  Atendimento (Chatwoot)   (Sessão 1)
├── 📈  Dashboard Consolidado    (Sessão 2)
├── 📊  Financeiro (ERPNext)     (Sessão 5)
└── ⚙️  Configurações            (já existe)
```

## Arquitetura de integração
- Chatwoot e ERPNext entram como iframe autenticado via SSO
- Usuário faz login no portal → sistemas abrem já logados automaticamente
- Cada unidade tem isolamento total de dados
- MASTER vê tudo de todas as unidades (sócios da franqueadora + CF8 usam este perfil)

---

## SESSÃO 1 — Segurança Base ✅ CONCLUÍDA
**Implementada em: Maio 2026**

### 1.1 Firewall VPS2 + PostgreSQL SSL ✅
- UFW ativo: deny default; portas 22/80/443/5433 liberadas
- Vercel não oferece IPs estáticos gratuitos → segurança via SSL + scram-sha-256
- Certificado SSL autoassinado em `/opt/stacks/postgres-biocasa/ssl/`
- `ssl=on` no PostgreSQL via command args no docker-compose
- **Pendência**: adicionar `?sslmode=require` ao DATABASE_URL no painel Vercel

### 1.2 Porta 3306 do MariaDB ✅
- Nunca estava exposta no host — nenhuma ação necessária

### 1.3 Backup automático do PostgreSQL ✅
- Script: `/opt/backups/biocasa/backup-biocasa.sh`
- Cron: `0 3 * * *` (03h00 diariamente)
- Retenção: 30 dias (rotação automática)
- Restore testado e validado (10 tabelas, 6 usuários)

### 1.4 Rate limiting nas APIs ✅
- Implementado em `lib/rateLimit.ts` (sem dependência externa)
- 10 req/min em `/api/auth` (login)
- 30 req/min em `/api/analises` e `/api/arquivos`

### 1.5 Logs de acesso ✅
- Tabela `logs_acesso` criada via `db push`
- `lib/logs.ts` com função `registrarLog()`
- Ações registradas: login, analise_criada, arquivo_enviado, usuario_criado, configuracao_alterada

### 1.6 2FA para MASTER ✅
- Biblioteca: otplib v13 + qrcode
- Fluxo: preflight check → QR code → verificação → ativação
- Login em 2 etapas (senha + TOTP) quando ativado
- Período de carência 24h (depois bloqueia acesso até configurar)
- Rota de setup: `/configurar-2fa`
- APIs: `/api/2fa/configurar` (GET/POST/DELETE), `/api/2fa/preflight`

---

## SESSÃO 2 — Chatwoot no Portal (nova aba + SSO) ✅ CONCLUÍDA
**Implementada em: Maio 2026**

### Contexto
- Chatwoot roda na VPS1 em atendimento.cf8.com.br
- Cada unidade tem uma Account separada no Chatwoot
- Acesso via iframe tela cheia substituindo o conteúdo central

### 2.1 Sidebar e roteamento ✅
- Item "Atendimento" na sidebar → `/atendimento`
- Rota `/app/(dashboard)/atendimento/page.tsx` criada
- Componente `ChatwootEmbed.tsx` implementado

### 2.2 API route SSO ✅
- `GET /api/chatwoot/redirect`: verifica sessão → busca `chatwootUserId` → chama Platform API → redirect para URL SSO one-time
- Variável obrigatória: `CHATWOOT_PLATFORM_TOKEN` (super-admin token do Chatwoot)

### 2.3 Solução final: iframe com SSO ✅
- **Portal:** `portal.cf8.com.br` | **Chatwoot:** `atendimento.cf8.com.br` — mesmo domínio raiz `.cf8.com.br`
- Cookies SameSite=None; Secure configurados no Chatwoot via Docker → iframe funciona (first-party context)
- `ChatwootEmbed.tsx`: chama `/api/chatwoot/sso` → carrega URL SSO one-time no iframe (100% da área)
- Tentativa anterior de `window.open` foi necessária enquanto o portal estava em `vercel.app`

### 2.4 Schema — campo na tabela usuarios ✅
- `chatwootUserId` (String?) — ID do usuário no Chatwoot; null = sem acesso

### Pendência de configuração (manual)
- Adicionar `CHATWOOT_PLATFORM_TOKEN` no painel Vercel (variável de ambiente)
- Preencher `chatwootUserId` nos registros dos usuários no banco

---

## SESSÃO 3 — Dashboard Consolidado ✅ CONCLUÍDA
**Implementada em: Maio 2026**

### Contexto
Não será criado perfil FRANQUEADORA separado.
Os 4 sócios da franqueadora + CF8 (manutenção) usam o perfil MASTER.
MASTER já vê tudo de todas as unidades por design.

### 3.1 Dashboard consolidado ✅
- Página `/consolidado` — acesso MASTER
- Item "Dashboard" na sidebar entre Atendimento e Usuários
- Métricas por unidade: análises no período, custo IA, imóveis, usuários ativos
- Filtros: por unidade + período (1/3/6/12 meses)
- Gráficos de barras CSS (sem lib externa): análises por mês + custo por mês
- Tabela por unidade com alerta vermelho quando limite de análises atingido
- API `GET /api/dashboard-consolidado`

---

## SESSÃO 4 — LGPD e Conformidade ✅ CONCLUÍDA
**Implementada em: Maio 2026**

### 4.1 Documentos legais ✅
- Política de Privacidade e Termos de Uso redigidos
- Publicados no portal (footer + tela de login)

### 4.2 Consentimento no primeiro login ✅
- Checkbox obrigatório: "Li e aceito a Política de Privacidade"
- Data e IP do aceite registrados na tabela usuarios

### 4.3 Política de retenção de dados ✅
- Rotina de limpeza automática implementada (cron)
- Retenção: análises 5 anos, uploads 2 anos, logs_acesso 1 ano, logs_erro 6 meses

### 4.4 Soft-delete de usuários ✅
- MASTER pode desativar qualquer usuário (exceto outro MASTER)
- Campo `ativo = false` no banco — dados preservados para auditoria
- Chatwoot: desassociação via `DELETE /platform/api/v1/accounts/{id}/account_users`
- Login com conta desativada → mensagem "Seu acesso foi desativado..."
- Lista de usuários: mostra só ativos por padrão; botão "Ver desativados" (MASTER)
- Log de auditoria: ação `usuario_desativado` registrada em `logs_acesso`

### 4.5 Registro de tratamento (interno) ✅
- Documento listando: dados coletados, finalidade, base legal, operadores
- Operadores: Vercel, Google (Gemini), Hetzner

---

## SESSÃO 5 — Dashboard MASTER Unificado (refatoração + auditoria) ✅ CONCLUÍDA
**Implementada em: Maio 2026**

### Conceito implementado
O Dashboard (`/consolidado`) virou o painel de controle completo do MASTER com 4 abas.
`DashboardMaster.tsx` gerencia as abas via `?aba=` na URL.

### 5.1 — Refatorar layout do Dashboard ✅
- `/consolidado` → `DashboardMaster.tsx` com 4 abas: Métricas, Usuários, Auditoria, Configurações
- Aba Métricas: mantém `DashboardConsolidado.tsx`
- Aba Usuários: usa `UserManagement.tsx`
- Sidebar ainda exibe "Usuários" como fallback para não-MASTER

### 5.2 — Tabela de logs de auditoria ✅
- Tabela `logs_acesso` já existia; nova API `GET /api/logs` com filtros completos
- Filtros: usuarioId, unidadeId, acao, recurso, dataInicio, dataFim, pagina
- Retorna logs com dados do usuário (nome, email, perfil, unidade)

### 5.3 — Aba Auditoria no Dashboard ✅
- `AbaAuditoria.tsx`: timeline de ações recentes com filtros
- Filtros: por usuário, unidade, tipo de ação, período (dataInicio/dataFim)
- Paginação de resultados

### 5.4 — Alertas de segurança por email ✅
- `lib/alertas.ts`: `verificarLoginFalhou()` (3+ do mesmo IP em 10 min) e `verificarExportacaoAbusiva()` (5+ em 1h)
- `lib/email.ts` (Resend): envia emails para todos os MASTERs ativos
- `POST /api/logs/exportacao`: registra exportação e verifica abuso
- **Não implementados ainda:** login fora do horário e mudança de IP habitual

### 5.5 — Aba Configurações no Dashboard ✅
- `AbaConfiguracoes.tsx`: gestão de unidades (limite de análises, status, proprietário)

### 5.6 — Marca d'água em exportações ✅
- `ExportarPDF.tsx`: div `.watermark` com texto "BIOCASA" (visível apenas em `@media print`)

### Adicional implementado (não planejado)
- **Sistema de convites por email:** usuários podem ser criados via convite (sem senha inicial) usando Resend
  - `conviteToken` + `conviteExpiraEm` na tabela `usuarios`
  - `/api/usuarios/convite` (validar) + `/api/usuarios/convite/aceitar` (ativar)
  - `/api/usuarios/[id]/reenviar-convite`
- **Site público de imóveis (`imoveis.cf8.com.br`):**
  - Route group `app/(site)/` com middleware de roteamento por hostname
  - `BuscaHero.tsx`, `HeaderSite.tsx`, `GaleriaPublica.tsx`
  - API `/api/imoveis/publico/*` sem autenticação
- **Duplicar imóvel:** `POST /api/imoveis/[id]/duplicar` + `DuplicarButton.tsx`
- **Gerar descrição com IA:** `POST /api/imoveis/gerar-descricao` (Gemini 2.5 Flash, 150–250 palavras)
  - `ModalConfirmarDescricaoIA.tsx` para confirmar antes de sobrescrever
- **Lightbox de fotos:** `Lightbox.tsx` com ESC + swipe
- **Páginas de impressão:** route group `app/(imprimir)/` — ficha de captação e ficha do imóvel
- **TagInput:** componente reutilizável para campos de tags/facilidades

---

## SESSÃO 6 — (a definir após Sessão 5)

---

## SESSÃO 7 — ERPNext no Portal
**Prioridade: MÉDIA — executar após as demais unidades estarem integradas**

### 7.1 Sidebar e roteamento
- Adicionar item "Financeiro" na sidebar
- Visível para: MASTER e PROPRIETARIO
- Rota /dashboard/financeiro

### 7.2 SSO com ERPNext
- ERPNext suporta OAuth/Social Login
- Mesmo padrão do Chatwoot: token → iframe autenticado
- Cada usuário mapeado para a Empresa da sua unidade no ERPNext

### 7.3 Uma Empresa por unidade no ERPNext
- Plano de contas padrão Biocasa replicado para cada empresa nova
- MASTER tem acesso a todas as Empresas no ERPNext

---

## SESSÃO 8 — Onboarding de Novas Unidades
**Prioridade: MÉDIA — executar quando chegar a 3ª unidade**

### Checklist de onboarding (processo atual — manual)
1. Criar registro na tabela `unidades` no banco
2. Criar usuário PROPRIETARIO vinculado à unidade
3. Criar Account no Chatwoot para a unidade
4. Criar inbox do WhatsApp no Chatwoot
5. Criar Empresa no ERPNext para a unidade
6. Configurar limite de análises mensais
7. Enviar credenciais de acesso ao franqueado

### Automação futura
- Formulário no painel MASTER que executa todos os passos acima
- Avaliar viabilidade após Sessões 1-7 concluídas

---

## Escalabilidade — Regras de decisão

| Situação | Ação |
|----------|------|
| Portal lento com muitas unidades | Migrar PostgreSQL para Supabase/Neon (só troca DATABASE_URL) |
| VPS2 com RAM acima de 80% | Fazer upgrade de servidor na Hetzner |
| Nova unidade chegando | Seguir checklist da Sessão 8 |
| Franqueadora pedindo acesso | Criar usuário MASTER para os sócios |

---

## Regras permanentes (não alterar sem justificativa)
- Rede Docker: sempre network_public
- Nunca usar tag latest nas imagens Docker
- Erros de API sempre logados em logs_erro
- Variáveis sensíveis sempre em variáveis de ambiente
- Interface sempre em Português do Brasil
- Não mexer em Traefik, Portainer ou ERPNext sem necessidade

## SESSÃO 9 — Relatórios de Imóveis, Filtros, Segurança Corretor ✅ CONCLUÍDA
**Implementada em: Maio 2026**

### 9.1 — Relatórios de Imóveis ✅
- `/imoveis/relatorios` com sistema de 2 abas
- Aba Gráficos: donut SVG (puro, sem dependência) para status + barras CSS para bairros e captadores
- Aba Relatório: filtros + impressão via `window.open()` com HTML+CSS isolado do Next.js
  - API `GET /api/imoveis/relatorios` (estatísticas) + `GET /api/imoveis/relatorios/impressao` (tabela)
  - Agrupamento: Unidade → Captador → Modalidade

### 9.2 — Filtros de listagem com sessionStorage ✅
- Filtros da listagem `/imoveis` persistidos durante navegação interna
- Prioridade: URL params > sessionStorage > vazio
- Cleanup automático ao sair do módulo
- Filtros iniciam vazios (removidos defaults VENDA/APARTAMENTO)

### 9.3 — Segurança comercial do Perfil CORRETOR ✅
- CORRETOR: somente leitura em todo o módulo de imóveis
- Campos sensíveis ocultos: proprietário, telefone, codIptu, codMatricula, obsInternas, percComissao

---

## Status das Sessões
| Sessão | Descrição | Status |
|--------|-----------|--------|
| 1 | Segurança Base | ✅ Concluída |
| 2 | Chatwoot no Portal | ✅ Concluída |
| 3 | Dashboard Consolidado (MASTER) | ✅ Concluída |
| 4 | LGPD e Conformidade | ✅ Concluída |
| 5 | Dashboard MASTER Unificado + Site Público + Convites + Extras | ✅ Concluída |
| 6 | (a definir) | ⏳ Pendente |
| 7 | ERPNext no Portal | ⏳ Pendente |
| 8 | Onboarding de Novas Unidades | ⏳ Pendente |
| 9 | Relatórios de Imóveis, Filtros, Segurança Corretor | ✅ Concluída |
