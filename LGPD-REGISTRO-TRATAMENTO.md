# Registro de Atividades de Tratamento de Dados
*CF8 Negócios Imobiliários Ltda — Portal Biocasa*
*Atualizado: Maio de 2026*

Documento interno elaborado em conformidade com o Art. 37 da
Lei Geral de Proteção de Dados (LGPD — Lei 13.709/2018).
Não destinado à publicação.

---

## 1. Identificação do Controlador

| Campo | Dado |
|-------|------|
| Razão Social | CF8 Negócios Imobiliários Ltda |
| CNPJ | 31.399.238/0001-65 |
| Endereço | Av. Cons. Nebias, 671 — Santos/SP |
| Responsável pelo tratamento | Clovis Farinelli |
| Contato LGPD (DPO) | santos@biocasaimob.com.br |

---

## 2. Operadores de Dados

| Operador | País | O que processa |
|----------|------|----------------|
| Vercel Inc. | EUA | Hospedagem do portal, armazenamento de arquivos (Vercel Blob) |
| Google LLC | EUA | Processamento de análises via API Gemini 2.5 Flash |
| Hetzner Online GmbH | Alemanha | Infraestrutura de banco de dados PostgreSQL |

---

## 3. Atividades de Tratamento

### 3.1 Cadastro e Autenticação de Usuários

| Campo | Detalhe |
|-------|---------|
| Dados tratados | Nome completo, e-mail, perfil de acesso, senha (hash bcrypt), unidade vinculada |
| Dados de consentimento | Data e IP do aceite dos Termos de Uso e Política de Privacidade |
| Finalidade | Controle de acesso ao portal por perfil (MASTER, PROPRIETARIO, ESPECIALISTA) |
| Base legal | Consentimento (Art. 7º, I) + Execução de contrato (Art. 7º, V) |
| Retenção | Enquanto o usuário estiver ativo. Soft-delete ao desativar (campo ativo=false) |
| Operadores | Vercel, Hetzner |

---

### 3.2 Análises de Viabilidade Imobiliária

| Campo | Detalhe |
|-------|---------|
| Dados tratados | Inscrição imobiliária, cidade, histórico de conversa com a IA, tokens consumidos, custo, arquivos enviados (IPTU, documentos) |
| Finalidade | Geração de análise de viabilidade para tomada de decisão de incorporação |
| Base legal | Execução de contrato (Art. 7º, V) + Legítimo interesse (Art. 7º, IX) |
| Retenção | 5 anos para análises / 2 anos para arquivos enviados |
| Operadores | Vercel (arquivos), Google/Gemini (processamento IA), Hetzner (banco) |
| Obs | Arquivos enviados ficam no Vercel Blob com acesso privado autenticado |

---

### 3.3 Módulo de Imóveis

| Campo | Detalhe |
|-------|---------|
| Dados tratados | Dados do imóvel (endereço, valor, fotos), nome e telefone do proprietário, nome do captador |
| Finalidade | Gestão da carteira de imóveis da unidade franqueada |
| Base legal | Execução de contrato (Art. 7º, V) |
| Retenção | Indefinida — dados comerciais ativos. Exclusão manual pelo MASTER |
| Operadores | Vercel (fotos), Hetzner (banco) |
| Obs | Dados de proprietários são de pessoas físicas — requer atenção ao direito de exclusão |

---

### 3.4 Logs de Sistema

| Campo | Detalhe |
|-------|---------|
| Dados tratados | Logs de erro (rota, mensagem, usuarioId) / Logs de acesso (quando implementado) |
| Finalidade | Segurança, depuração e auditoria do sistema |
| Base legal | Legítimo interesse (Art. 7º, IX) |
| Retenção | Logs de erro: 6 meses / Logs de acesso: 1 ano |
| Operadores | Hetzner |

---

### 3.5 Integração Chatwoot (Atendimento)

| Campo | Detalhe |
|-------|---------|
| Dados tratados | chatwoot_user_id, chatwoot_account_id vinculados ao usuário do portal |
| Finalidade | SSO entre Portal Biocasa e Chatwoot para atendimento unificado |
| Base legal | Execução de contrato (Art. 7º, V) |
| Retenção | Mesma do cadastro de usuário |
| Operadores | VPS1 Hetzner (Chatwoot self-hosted) |

---

## 4. Direitos dos Titulares — Processo Interno

| Direito | Como atender |
|---------|-------------|
| Acesso aos dados | Exportar registros do banco via painel MASTER |
| Correção | Editar diretamente no portal (perfil do usuário) |
| Exclusão | Desativar usuário (soft-delete) + solicitar exclusão manual ao DPO |
| Revogação do consentimento | Desativar conta + remover consentimentoEm do banco |
| Portabilidade | Exportar análises em PDF via portal |

Prazo de resposta: até 15 dias corridos após a solicitação.
Canal: santos@biocasaimob.com.br

---

## 5. Medidas de Segurança Adotadas

- Autenticação via NextAuth.js com JWT assinado
- 2FA obrigatório para perfil MASTER (TOTP via otplib)
- Senhas armazenadas com hash bcrypt
- Comunicação via HTTPS (TLS) em todos os ambientes
- Arquivos armazenados com acesso privado (Vercel Blob — acesso autenticado)
- Banco de dados acessível apenas pela aplicação (porta 5433 com firewall)
- Rate limiting nas APIs do portal
- Logs de erro registrados para auditoria

---

## 6. Histórico de Atualizações

| Data | Alteração |
|------|-----------|
| Maio 2026 | Criação do documento |

---

*Documento de uso interno. Manter atualizado a cada alteração relevante no tratamento de dados.*
