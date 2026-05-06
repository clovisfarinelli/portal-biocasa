# Módulo de Imóveis — Estado Atual
*Atualizado: Maio 2026*

## Status
✅ Módulo completo e em produção.

## O que foi implementado

### Banco de dados
Tabela `imoveis` no PostgreSQL (model Prisma: `Imovel`).

Campos reais (nomes Prisma):
- **Identificação:** `codigoRef` (unique), `nome`
- **Classificação:** `finalidade`, `tipo`, `subtipo`
- **Endereço:** `logradouro`, `numero`, `complemento`, `bairro`, `cidade`, `estado`, `cep`
- **Edifício:** `edificio`, `andar`, `acesso`
- **Proprietário:** `proprietario`, `telProprietario`
- **Captação:** `captador`, `parceria`, `nomeParceiro`
- **Modalidade e valores:** `modalidade` (VENDA/LOCACAO/AMBOS), `valorVenda`, `valorLocacao`, `locacaoPacote`, `valorCondominio`, `valorIptu`
- **Características:** `areaUtil`, `areaTotal`, `dormitorios`, `suites`, `totalBanheiros`, `vagasGaragem`, `tipoGaragem`, `situacaoImovel`, `dependencia`, `vistaMar`, `tipoVistaMar`
- **Facilidades:** `facilidadesImovel`, `facilidadesImovelOutros`, `facilidadesCond`, `facilidadesCondOutros` (JSON arrays serializados como String)
- **Negociação:** `aceitaPermuta`, `aceitaFinanc`, `documentacaoOk`, `exclusividade`
- **Publicação:** `publicarSite`, `publicarPortais`, `destaque`
- **Links e códigos:** `linkSite`, `linkExterno`, `codIptu`, `codMatricula`, `slug` (único, gerado automaticamente)
- **Descrições:** `descricao`, `obsInternas`
- **Comissão:** `percComissao`
- **Mídia:** `fotos` (JSON array: `[{url, ordem, principal}]`)
- **Status:** `situacao` (DISPONIVEL/VENDIDO/ALUGADO)
- **Relação:** `unidadeId` → FK para `unidades`

### APIs implementadas
- `GET  /api/imoveis` — lista com filtros + busca texto livre (14 campos) + paginação + ordenação
- `GET  /api/imoveis/[id]` — detalhe completo
- `POST /api/imoveis` — cadastrar (MASTER/PROPRIETARIO/ASSISTENTE)
- `PUT  /api/imoveis/[id]` — editar (MASTER/PROPRIETARIO/ASSISTENTE)
- `DELETE /api/imoveis/[id]` — remover (MASTER apenas)
- `POST /api/imoveis/[id]/duplicar` — duplica sem fotos, novo codigoRef e slug
- `POST /api/imoveis/gerar-descricao` — gera descrição de marketing via Gemini 2.5 Flash
- `POST /api/imoveis/[id]/fotos` — upload + compressão WebP via sharp
- `DELETE /api/imoveis/[id]/fotos` — remove foto do Blob + atualiza JSON
- `GET  /api/imoveis/[id]/fotos/zip` — download ZIP de todas as fotos
- `GET  /api/imoveis/fotos/download` — proxy autenticado para fotos privadas (dashboard)
- `GET  /api/imoveis/publico` — listagem pública sem auth (filtra publicarSite=true)
- `GET  /api/imoveis/publico/[ref]` — detalhe público por codigoRef
- `GET  /api/imoveis/publico/fotos` — proxy de fotos para o site público (sem auth, cache 1h)
- `GET  /api/imoveis/relatorios` — estatísticas (total, porStatus, porBairro top10, porCorretor)
- `GET  /api/imoveis/relatorios/impressao` — lista agrupada para relatório imprimível A4

### Interface implementada
- `/imoveis` — listagem com filtros persistidos via sessionStorage
- `/imoveis/novo` — formulário de cadastro (5 seções)
- `/imoveis/[id]` — visualização completa (4 seções em grid)
- `/imoveis/[id]/editar` — edição + galeria de fotos
- `/imoveis/relatorios` — aba Gráficos (donut + barras) + aba Relatório imprimível A4
- `/imprimir/ficha-captacao` — ficha de captação para impressão (meia folha A4)
- `/imprimir/imoveis/[id]/ficha` — ficha completa do imóvel para impressão
- `imoveis.cf8.com.br` — site público com homepage + detalhe por `/imoveis/[ref]`

### Funcionalidades implementadas
- Galeria de fotos com upload, drag-reorder, lightbox e definição de foto principal
- Gerador de descrição com IA (Gemini) — 150–250 palavras, 3–4 parágrafos
- Duplicar imóvel (sem fotos, novo codigoRef/slug)
- Site público sem autenticação (imoveis.cf8.com.br) via roteamento por hostname no middleware
- Ficha de captação imprimível (meia folha A4)
- Relatório imprimível A4 agrupado por Unidade → Captador → Modalidade
- Filtros persistidos via sessionStorage (limpos ao sair do módulo)
- Segurança CORRETOR: somente leitura, campos sensíveis ocultos (proprietário, telefone, IPTU, matrícula, obs internas, comissão)
- Download ZIP de todas as fotos de um imóvel
- Compartilhar: copia linkExterno para área de transferência
- Copiar ficha para WhatsApp

### Componentes criados
- `components/imoveis/ImovelForm.tsx` — formulário completo (5 seções)
- `components/imoveis/GaleriaFotos.tsx` — upload + drag-reorder + salvar ordem
- `components/imoveis/GerenciarFotosModal.tsx` — modal fullscreen de galeria
- `components/imoveis/FichaCaptacao.tsx` — ficha para impressão meia folha A4
- `components/imoveis/DuplicarButton.tsx` — botão duplicar imóvel
- `components/imoveis/Lightbox.tsx` — lightbox de fotos (ESC + swipe)
- `components/imoveis/GaleriaPublica.tsx` — galeria para site público (sem auth)
- `components/imoveis/CompartilharButton.tsx` — copia linkExterno para área de transferência
- `components/imoveis/CopiarFichaButton.tsx` — copia ficha para WhatsApp
- `components/imoveis/CopiarTextoButton.tsx` — copia texto genérico

## Pendências
| # | Item | Prioridade |
|---|------|-----------|
| 1 | ⏳ Integração n8n — sugestão automática de imóveis via WhatsApp | Alta |
| 2 | ⏳ Integração n8n — ficha por comando /ficha no Chatwoot | Alta |
| 3 | ⏳ Integração n8n — endereço de visita com Google Maps | Média |
| 4 | ⏳ Integração ERPNext — contratos de locação | Baixa (aguardando ERP) |

## Padrão de filtros (replicar em outros módulos)
Filtros de listagem persistidos via sessionStorage:
- Chave: `biocasa:imoveis:filtros`
- Salvar ao clicar Filtrar ou mudar página
- Limpar ao sair do módulo (`useRef navegandoInternamente`)
- Iniciar sempre limpo (sem defaults pré-selecionados)
- Prioridade: URL params > sessionStorage > vazio
