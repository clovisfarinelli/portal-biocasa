# Biocasa — Contexto Geral do Ecossistema
*Atualizado: Maio 2026*

## Empresas

### CF8
- Empresa de comunicação, marketing e tecnologia
- Presta serviços para a Biocasa e outras empresas
- É o hub tecnológico do ecossistema
- Responsável por desenvolver e manter toda a infraestrutura

### Biocasa Santos
- Franquia imobiliária localizada em Santos/SP
- Rede nacional com 8 lojas atualmente
- Clovis Farinelli é um dos franqueados
- Sistemas homologados pela franquia: Agendor (CRM) e Kenlo (site + imóveis)
- Abertura para homologar novos sistemas se funcionarem bem
- Estratégia: validar tudo na unidade Santos e depois escalar para as demais

## Estratégia Geral
- Usar a CF8 para construir tecnologia personalizada para a Biocasa
- Começar pela unidade Santos como laboratório
- Se funcionar, apresentar para a franqueadora e buscar homologação
- CF8 vira o hub de tecnologia de toda a rede Biocasa
- Receita recorrente por unidade franqueada

## Infraestrutura

### Domínio Principal
- cf8.com.br (Cloudflare DNS)

### VPS1 — Hetzner (existente)
- IP: 162.55.211.60
- DNS: server.cf8.com.br
- Serviços rodando:
  - Chatwoot (atendimento.cf8.com.br) — atendimento via WhatsApp
  - n8n (fluxo.cf8.com.br) — automações e integrações
  - Kanban (kanban.cf8.com.br)
  - Portainer (painel.cf8.com.br)
- Stack: Docker Swarm + Traefik + Portainer

### VPS2 — Hetzner (nova)
- IP: 178.105.38.118
- DNS: server2.cf8.com.br
- Especificações: 2 vCPU, 4GB RAM, 80GB disco, 20TB tráfego, Swap 2GB
- Sistema: Ubuntu 24.04
- Acesso SSH: chave em ~/.ssh/biocasa_vps2 / alias: ssh vps2
- Serviços rodando:
  - Traefik v2.11 (reverse proxy + SSL Let's Encrypt)
  - Portainer (painel2.cf8.com.br)
  - ERPNext v15.65.3 (erp.cf8.com.br)
  - PostgreSQL 15 + pgvector porta 5433 (banco do Portal Biocasa)
- Stack: Docker Swarm + rede network_public

### DNS (Cloudflare)
- server → 162.55.211.60 (VPS1)
- server2 → 178.105.38.118 (VPS2)
- atendimento, fluxo, fluxowebhook, kanban, painel → server.cf8.com.br
- painel2, erp → server2.cf8.com.br

## Portal Biocasa (projeto principal)

### O que é
Portal de análise de viabilidade imobiliária com IA para incorporação.
Analisa terrenos e gera DRE com valor teto de aquisição.
Também possui módulo completo de gestão de imóveis com site público.

### Status atual
- Em produção: portal-biocasa.vercel.app
- Site público de imóveis: imoveis.cf8.com.br
- Repositório: github.com/clovisfarinelli/portal-biocasa
- Fase: MVP avançado, hub unificado em operação

### Stack
- Frontend: Next.js 14 + Tailwind CSS
- Hospedagem: Vercel (deploy automático via GitHub)
- Banco: PostgreSQL 15 + pgvector na VPS2 (porta 5433)
- IA: Google Gemini 2.5 Flash
- Auth: NextAuth.js
- Upload: Vercel Blob (portal-biocasa-blob, região GRU1)
- Email: Resend 6.12.x
- Excel: xlsx 0.18.x

### Módulos implementados
- Análise de Viabilidade Imobiliária (IA com Gemini)
- Módulo de Imóveis (cadastro, edição, fotos, duplicar, site público)
- Chatwoot integrado (iframe + SSO por unidade)
- Dashboard Consolidado MASTER
- LGPD e Conformidade
- Relatórios imprimíveis de imóveis
- Sistema de convites de usuários
- Alertas de segurança
- Gerador de descrição com IA

### Perfis de usuário
- MASTER — acesso total, vê todas as unidades
- PROPRIETARIO — dono de franquia, vê só sua unidade
- ESPECIALISTA — corretor/analista, só chat de análise
- Perfis do Chatwoot: SDR, CORRETOR (mapeados por unidade)

### Credenciais
- MASTER: master@biocasa.com.br / Biocasa@2026!
- Banco PostgreSQL: biocasa_user / Bi0c4s@Pg#2026!Xk9
- Banco URL encode: Bi0c4s%40Pg%232026%21Xk9

## ERPNext (erp.cf8.com.br)
- Versão: v15.65.3
- Objetivo: ERP da Biocasa Santos
- Módulos prioritários: financeiro, contas a pagar/receber
- Banco: MariaDB 10.6 (separado do PostgreSQL do portal)
- Status: em configuração — integração com portal pendente

## Integrações planejadas
- n8n (VPS1) → Portal Biocasa: automações WhatsApp com imóveis
- n8n (VPS1) → ERPNext (VPS2): automação de fluxos financeiros
- Futuro: Portal como hub central integrando Chatwoot, ERPNext, Agendor, Kenlo

## Ambiente de desenvolvimento
- Computador: Windows 10 com WSL2 (Ubuntu 24.04)
- Terminal: Ubuntu WSL — clovis@PC-BIOCASA-STS
- Projeto local: ~/projetos/portal-biocasa
- Claude Code: instalado e autenticado com conta Pro
- GitHub CLI: instalado em ~/.local/bin/gh
- SSH VPS2: ~/.ssh/biocasa_vps2 / alias configurado em ~/.ssh/config

## Decisões técnicas importantes
- Rede Docker: sempre usar network_public
- Nunca usar versão latest nas imagens Docker
- PostgreSQL do portal na porta 5433
- Vercel para o frontend — deploy automático a cada push no GitHub
- pgvector para busca semântica futura
- Câmbio Dólar/Real configurável pelo MASTER
- Filtros de listagem persistidos via sessionStorage com chave biocasa:[modulo]:filtros

## Pendências prioritárias
1. ⏳ Busca semântica real com embedding text-embedding-004 (pgvector)
2. ⏳ Análise Profunda com Google Search (400 bad request no gemini-2.5-flash)
3. ⏳ Integração n8n — automações WhatsApp com imóveis
4. ⏳ Sessão 5 — ERPNext no Portal (aguardando ERP ficar pronto)
5. ⏳ Sessão 6 — Onboarding de Novas Unidades (aguardar 3ª unidade)
6. ⏳ Investigar registro de consentimento LGPD no schema real
