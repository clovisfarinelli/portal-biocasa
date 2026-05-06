# Módulo de Imóveis — Estado Atual
*Atualizado: Maio 2026*

## Status
✅ Módulo completo e em produção.

## O que foi implementado

### Banco de dados
Tabela `imoveis` no PostgreSQL com todos os campos planejados.
Campos principais: ref, tipo, pretensao, status, origem, nome, logradouro,
numero, complemento, bairro, cidade, estado, cep, valor, condominio, iptu,
area_privativa, area_total, quartos, banheiros, vagas, andar,
aceita_financ, aceita_permuta, exclusividade, destaque,
descricao_curta, tags, link_kenlo, fotos, captador, unidadeId.

### APIs implementadas
- GET  /api/imoveis — lista com filtros
- GET  /api/imoveis/[id] — detalhe completo
- POST /api/imoveis — cadastrar
- PUT  /api/imoveis/[id] — editar
- DELETE /api/imoveis/[id] — remover
- GET  /api/imoveis/relatorios — dados para gráficos
- GET  /api/imoveis/relatorios/impressao — dados para relatório imprimível

### Interface implementada
- /dashboard/imoveis — listagem com filtros persistidos via sessionStorage
- /dashboard/imoveis/novo — formulário de cadastro
- /dashboard/imoveis/[id] — visualização
- /dashboard/imoveis/[id]/editar — edição
- /dashboard/imoveis/relatorios — gráficos + relatório imprimível A4

### Funcionalidades extras (além do planejamento original)
- Duplicar imóvel
- Galeria de fotos com lightbox
- Gerador de descrição com IA (Gemini)
- Site público: imoveis.cf8.com.br (roteamento por hostname no middleware)
- Ficha de captação imprimível
- Relatório imprimível A4 com agrupamento por Unidade → Captador → Modalidade
- Filtros persistidos via sessionStorage (limpos ao sair do módulo)

### Componentes criados
- components/imoveis/FichaCaptacao.tsx
- components/imoveis/ImovelForm.tsx
- components/imoveis/GaleriaFotos.tsx
- components/imoveis/GerenciarFotosModal.tsx
- components/imoveis/DuplicarButton.tsx
- components/imoveis/Lightbox.tsx
- components/imoveis/GaleriaPublica.tsx

## Pendências
| # | Item | Prioridade |
|---|------|-----------|
| 1 | ⏳ Integração n8n — sugestão automática de imóveis via WhatsApp | Alta |
| 2 | ⏳ Integração n8n — ficha por comando /ficha no Chatwoot | Alta |
| 3 | ⏳ Integração n8n — endereço de visita com Google Maps | Média |
| 4 | ⏳ Integração ERPNext — contratos de locação | Baixa (aguardando ERP) |

## Padrão de filtros (replicar em outros módulos)
Filtros de listagem persistidos via sessionStorage:
- Chave: biocasa:imoveis:filtros
- Salvar ao clicar Filtrar
- Limpar ao sair do módulo (useRef navegandoInternamente)
- Iniciar sempre limpo (sem defaults pré-selecionados)
