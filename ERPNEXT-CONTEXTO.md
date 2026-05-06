# ERPNext — Contexto e Estado Atual
*Atualizado: Maio 2026*

## Visão Geral
ERPNext v15.65.3 instalado na VPS2 (178.105.38.118) via Docker Swarm.
Acesso: erp.cf8.com.br
Objetivo: ERP financeiro da CF8 Negócios Imobiliários Ltda (franquia Biocasa Santos)

## Empresa Configurada
- **Nome**: CF8 Negocios Imobiliarios Ltda
- **Abreviação**: CF8
- **Moeda**: BRL
- **País**: Brasil
- **Regime**: Simples Nacional
- **Ano Fiscal**: 2026 (01/01/2026 a 31/12/2026)

## Infraestrutura Docker
Stack: **frappecrm** no Docker Swarm da VPS2

### Serviços rodando
| Serviço | Função |
|---------|--------|
| frappecrm_backend | Gunicorn web server |
| frappecrm_frontend | Nginx |
| frappecrm_websocket | Socket.io |
| frappecrm_worker-short | Worker filas curtas |
| frappecrm_worker-long | Worker filas longas |
| frappecrm_scheduler | Agendador de tarefas |
| frappecrm_redis-cache | Cache Redis |
| frappecrm_redis-queue | Fila Redis |
| frappecrm_redis-socketio | Redis Socket.io |
| frappecrm_db | MariaDB 10.6 |

### Banco de Dados MariaDB
- Host interno: db:3306
- Porta externa: fechada por padrão (abrir apenas para DBeaver)
- Banco: _4fc19c6ead2e0cba
- Usuário: _4fc19c6ead2e0cba
- Senha: ONAEKsVcC8fvntCD
- Root senha: admin

### Abrir/fechar porta para DBeaver
```bash
# Abrir temporariamente
docker service update --publish-add 3306:3306 frappecrm_db

# Fechar após uso
docker service update --publish-rm 3306:3306 frappecrm_db
```

## Conta Bancária
- **Banco**: Banco C6 S.A.
- **Nome no ERPNext**: Conta Bancária - CF8 - Banco C6 S.A.
- **Conta contábil**: Conta Corrente C6 - CF8
- **Agência**: 0001

## Plano de Contas

### Contas de Receita
- Receita de Comissões - CF8
- Receita de Servicos - CF8

### Contas de Despesa
- Royalties e Taxas de Franquia - CF8
- Servicos Contabeis - CF8
- Servicos de TI e Tecnologia - CF8
- Impostos e Taxas - CF8
- Combustivel e Transporte - CF8
- Comissões Pagas - CF8
- Servicos de Terceiros - CF8

### Conta de Passivo
- Emprestimos de Socios - CF8

## Histórico Financeiro Importado
- **Período**: 01/01/2026 a 28/04/2026
- **Banco**: C6 Bank (extrato OFX convertido para CSV)
- **Total de transações**: 77
- **Status**: 77/77 Reconciliadas

## Processo de Importação Mensal do Extrato
1. Baixar extrato do C6 Bank em formato CSV
2. Converter com script Python
3. Importar via Data Import → Transação Bancária
4. Rodar script de reconciliação em lote
5. Revisar manualmente as transações em "Despesas Diversas"

## Formato do CSV para importação
date, deposit, withdrawal, description, reference_number, bank_account, currency
- date: formato YYYY-MM-DD
- bank_account: "Conta Bancária - CF8 - Banco C6 S.A."
- currency: BRL

## Script de Reconciliação em Lote
```bash
docker exec -w /home/frappe/frappe-bench $(docker ps -q -f name=frappecrm_backend) ./env/bin/python /tmp/reconciliar_final.py
```

## Pendências
| # | Item | Prioridade |
|---|------|-----------| 
| 1 | ⏳ Cadastrar fornecedores recorrentes | Alta |
| 2 | ⏳ Configurar fluxo de contas a pagar | Alta |
| 3 | ⏳ Criar modelos de lançamento para despesas recorrentes | Média |
| 4 | ⏳ Lançar gastos do cartão pessoal do sócio | Média |
| 5 | ⏳ Configurar servidor de email no ERPNext | Baixa |
| 6 | ⏳ Integração com Portal Biocasa via SSO | Baixa (aguardando) |

## Comandos Úteis na VPS2
```bash
# Ver containers do ERPNext
docker ps --filter name=frappecrm --format "table {{.ID}}\t{{.Names}}\t{{.Status}}"

# Entrar no container backend
docker exec -it $(docker ps -q -f name=frappecrm_backend) bash

# Abrir console Python do Frappe
bench --site erp.cf8.com.br console

# Rodar script externo
docker exec -w /home/frappe/frappe-bench $(docker ps -q -f name=frappecrm_backend) ./env/bin/python /tmp/script.py

# Copiar script para o container
docker cp /tmp/script.py $(docker ps -q -f name=frappecrm_backend):/tmp/script.py
```

## Observações Importantes
- Gastos do cartão pessoal do sócio: Débito na despesa + Crédito em Empréstimos de Sócios
- Contas a pagar: criar Purchase Invoice quando chega boleto/nota, antes de pagar
- DRE: funcional com dados de jan-abr 2026
- Nomes de contas sem acento: intencional para evitar problemas de encoding nos scripts
