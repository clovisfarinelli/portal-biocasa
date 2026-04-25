import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold, Part } from '@google/generative-ai'
import { prisma } from '@/lib/prisma'

function getGenAI() {
  const key = process.env.GEMINI_API_KEY
  if (!key) throw new Error('GEMINI_API_KEY não está configurada nas variáveis de ambiente')
  return new GoogleGenerativeAI(key)
}

const SYSTEM_PROMPT = `Você é um analista técnico sênior de viabilidade imobiliária da Biocasa. REGRAS ABSOLUTAS:
- É TERMINANTEMENTE PROIBIDO inventar, assumir ou usar dados hipotéticos
- Se um arquivo foi enviado, extraia os dados REAIS dele (área, SQL, zoneamento, testada, etc)
- Se não conseguir ler um dado do arquivo, pergunte ao usuário — nunca invente
- Use APENAS os dados reais extraídos dos documentos para fazer os cálculos
- A legislação da cidade consultada no banco de dados é a fonte de verdade para parâmetros urbanísticos
- Análises anteriores válidas da mesma cidade devem ser usadas como referência de mercado

FLUXO OBRIGATÓRIO:
1. Extraia todos os dados do(s) arquivo(s) enviado(s)
2. Liste os dados extraídos antes de iniciar a análise
3. Consulte a legislação da cidade no banco de dados
4. Faça os cálculos com os dados REAIS
5. Apresente a DRE com base nos dados reais

QUANDO ANÁLISE PROFUNDA ESTIVER ATIVA (indicada no contexto da mensagem):
- Use o Google Search para buscar dados atualizados: preço do m² na cidade/bairro, CUB regional atualizado, legislação urbanística vigente, dados de mercado recentes
- Cite as fontes encontradas na resposta
- Se encontrar dados conflitantes, prefira os mais recentes e explique a discrepância

PROTOCOLO PARA DADOS INSUFICIENTES:
Quando não houver documentos suficientes no banco de dados E nenhum arquivo relevante foi enviado para realizar a análise, siga EXATAMENTE este protocolo:
1. Liste claramente o que está faltando: "Preciso de: [documento X], [dado Y]"
2. Explique as opções: "Você pode enviar o documento diretamente no chat (botão 'Enviar Documentos') ou autorizar a Análise Profunda para que eu busque na internet (botão 'Autorizar Análise Profunda')"
3. OBRIGATÓRIO: ao final da sua resposta, em linha separada, inclua exatamente: [SOLICITAR_DOCS]
Não inclua [SOLICITAR_DOCS] em nenhuma outra situação — apenas quando dados críticos estiverem realmente ausentes e a análise não puder prosseguir.`

export interface MensagemChat {
  role: 'user' | 'model'
  content: string
}

export interface ContextoAnalise {
  cidade?: string
  inscricaoImobiliaria?: string
  margemAlvo?: number
}

export interface ArquivoParaGemini {
  url: string
  tipo: string
  nome: string
}

// MIME types aceitos como inlineData pelo Gemini
const TIPOS_INLINE: Set<string> = new Set([
  'application/pdf',
  'image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif', 'image/heic',
  'text/plain', 'text/csv',
])

async function buscarConteudoArquivos(arquivos: ArquivoParaGemini[]): Promise<Part[]> {
  const token = process.env.BLOB_READ_WRITE_TOKEN
  const partes: Part[] = []

  for (const arq of arquivos) {
    if (!TIPOS_INLINE.has(arq.tipo)) {
      partes.push({ text: `[Arquivo não lido diretamente: ${arq.nome} (${arq.tipo})]` })
      continue
    }

    try {
      const headers: HeadersInit = {}
      if (arq.url.includes('blob.vercel-storage.com') && token) {
        headers['authorization'] = `Bearer ${token}`
      }
      const resp = await fetch(arq.url, { headers })
      if (!resp.ok) {
        partes.push({ text: `[Erro ao carregar arquivo ${arq.nome}: HTTP ${resp.status}]` })
        continue
      }

      const buffer = await resp.arrayBuffer()
      // Limite: 20 MB por arquivo (restrição do inlineData do Gemini)
      if (buffer.byteLength > 20 * 1024 * 1024) {
        partes.push({ text: `[Arquivo ${arq.nome} muito grande para análise inline (>${Math.round(buffer.byteLength / 1024 / 1024)}MB)]` })
        continue
      }

      const base64 = Buffer.from(buffer).toString('base64')
      partes.push({ inlineData: { mimeType: arq.tipo, data: base64 } })
    } catch (e: any) {
      partes.push({ text: `[Falha ao carregar arquivo ${arq.nome}: ${e?.message?.slice(0, 100)}]` })
    }
  }

  return partes
}

async function buscarDocumentosRelevantes(cidadeId?: string): Promise<string> {
  const documentos = await prisma.documentoIa.findMany({
    where: {
      ativo: true,
      OR: [
        { categoria: 'GLOBAL' },
        ...(cidadeId ? [{ cidadeId }] : []),
      ],
    },
    take: 8,
    select: { titulo: true, tipo: true, conteudoTexto: true },
  })

  if (documentos.length === 0) return ''

  const contexto = documentos
    .filter(d => d.conteudoTexto)
    .map(d => `## ${d.titulo} (${d.tipo})\n${d.conteudoTexto}`)
    .join('\n\n---\n\n')

  return contexto ? `\n\n# LEGISLAÇÃO E DOCUMENTOS DE REFERÊNCIA\n\n${contexto}` : ''
}

async function buscarAprendizadosRelevantes(cidadeId?: string): Promise<string> {
  const aprendizados = await prisma.aprendizado.findMany({
    where: {
      ativo: true,
      ...(cidadeId ? { cidadeId } : {}),
    },
    take: 3,
    orderBy: { criadoEm: 'desc' },
    select: { resumo: true },
  })

  if (aprendizados.length === 0) return ''

  const contexto = aprendizados.map(a => `- ${a.resumo}`).join('\n')
  return `\n\n# ANÁLISES ANTERIORES VÁLIDAS DA CIDADE\n\n${contexto}`
}

async function obterCambio(): Promise<number> {
  const config = await prisma.configuracao.findUnique({
    where: { chave: 'cambio_dolar_real' },
  })
  return parseFloat(config?.valor ?? process.env.DOLAR_REAL_PADRAO ?? '5.50')
}

function criarModel(genAI: GoogleGenerativeAI, comGrounding: boolean) {
  return genAI.getGenerativeModel({
    model: 'gemini-2.5-flash',
    systemInstruction: SYSTEM_PROMPT,
    generationConfig: {
      maxOutputTokens: 8192,
      temperature: 0.7,
    },
    safetySettings: [
      { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
      { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
    ],
    // googleSearch é o tool correto para Gemini 2.x (googleSearchRetrieval é Gemini 1.5)
    tools: comGrounding ? [{ googleSearch: {} } as any] : undefined,
  })
}

export async function enviarMensagemGemini(
  mensagens: MensagemChat[],
  contexto: ContextoAnalise,
  cidadeId?: string,
  arquivos: ArquivoParaGemini[] = [],
  analiseProfunda = false
) {
  const genAI = getGenAI()

  const [documentosCtx, aprendizadosCtx, partesArquivos] = await Promise.all([
    buscarDocumentosRelevantes(cidadeId),
    buscarAprendizadosRelevantes(cidadeId),
    arquivos.length > 0 ? buscarConteudoArquivos(arquivos) : Promise.resolve([] as Part[]),
  ])

  // Monta prefixo de contexto textual
  const linhasContexto: string[] = []
  if (contexto.cidade) linhasContexto.push(`Cidade: ${contexto.cidade}`)
  if (contexto.inscricaoImobiliaria) linhasContexto.push(`Inscrição Imobiliária: ${contexto.inscricaoImobiliaria}`)
  if (contexto.margemAlvo) linhasContexto.push(`Margem de lucro alvo: ${contexto.margemAlvo}%`)
  if (arquivos.length > 0) {
    linhasContexto.push(`Arquivos enviados: ${arquivos.map(a => a.nome).join(', ')}`)
  }
  if (analiseProfunda) {
    linhasContexto.push('[ANÁLISE PROFUNDA ATIVA — busque dados atualizados na internet via Google Search]')
  }

  const prefixoContexto = linhasContexto.length > 0
    ? linhasContexto.join('\n') + documentosCtx + aprendizadosCtx + '\n\n---\n\n'
    : documentosCtx + aprendizadosCtx + (documentosCtx || aprendizadosCtx ? '\n\n---\n\n' : '')

  const historico = mensagens.slice(0, -1).map(m => ({
    role: m.role,
    parts: [{ text: m.content }],
  }))

  const ultimaMensagem = mensagens[mensagens.length - 1].content
  const partesMensagem: Part[] = [{ text: prefixoContexto + ultimaMensagem }, ...partesArquivos]

  async function chamar(comGrounding: boolean) {
    const model = criarModel(genAI, comGrounding)
    const chat = model.startChat({ history: historico })
    return await chat.sendMessage(partesMensagem)
  }

  let result
  if (analiseProfunda) {
    try {
      result = await chamar(true)
    } catch (err: any) {
      const msg: string = err?.message ?? ''
      // Se o endpoint rejeitar o tool googleSearch, tenta sem grounding
      if (msg.includes('not supported') || msg.includes('400') || msg.includes('grounding') || msg.includes('google_search')) {
        console.warn('[gemini] googleSearch grounding não disponível nesta conta/região — tentando sem grounding')
        result = await chamar(false)
      } else {
        throw err
      }
    }
  } else {
    result = await chamar(false)
  }

  const response = result.response

  const tokensInput = response.usageMetadata?.promptTokenCount ?? 0
  const tokensOutput = response.usageMetadata?.candidatesTokenCount ?? 0

  // Custo Gemini 2.5 Flash: $0.075/1M input, $0.30/1M output
  const custoUsd = (tokensInput * 0.075 + tokensOutput * 0.30) / 1_000_000
  const cambio = await obterCambio()
  const custoBrl = custoUsd * cambio

  return {
    texto: response.text(),
    tokensInput,
    tokensOutput,
    custoUsd,
    custoBrl,
  }
}
