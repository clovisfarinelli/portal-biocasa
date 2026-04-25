import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai'
import { prisma } from '@/lib/prisma'

// Inicialização lazy — garante que a chave é lida em runtime (não no boot do módulo)
function getGenAI() {
  const key = process.env.GEMINI_API_KEY
  if (!key) throw new Error('GEMINI_API_KEY não está configurada nas variáveis de ambiente')
  return new GoogleGenerativeAI(key)
}

const SYSTEM_PROMPT = `Você é um especialista em análise de viabilidade imobiliária da Biocasa.
Seu papel é ajudar a analisar imóveis, terrenos e empreendimentos, fornecendo análises técnicas detalhadas sobre:
- Viabilidade econômica e financeira
- Conformidade com zoneamento e plano diretor
- Estimativa de custos e retorno sobre investimento
- Margem de lucro e análise de risco
- Recomendações sobre potencial construtivo

Responda sempre em Português do Brasil de forma profissional e detalhada.
Use formatação markdown para organizar suas respostas.
Ao final de cada análise completa, pergunte: "Esta análise foi útil e os dados estão corretos?"`

export interface MensagemChat {
  role: 'user' | 'model'
  content: string
}

export interface ContextoAnalise {
  cidade?: string
  inscricaoImobiliaria?: string
  margemAlvo?: number
  documentosContexto?: string
}

async function buscarDocumentosRelevantes(
  texto: string,
  cidadeId?: string
): Promise<string> {
  // Por ora retorna documentos ativos sem busca semântica (embedding integrado após configurar API de embedding)
  const documentos = await prisma.documentoIa.findMany({
    where: {
      ativo: true,
      OR: [
        { categoria: 'GLOBAL' },
        ...(cidadeId ? [{ cidadeId }] : []),
      ],
    },
    take: 5,
    select: { titulo: true, tipo: true, conteudoTexto: true },
  })

  if (documentos.length === 0) return ''

  const contexto = documentos
    .filter(d => d.conteudoTexto)
    .map(d => `## ${d.titulo} (${d.tipo})\n${d.conteudoTexto}`)
    .join('\n\n---\n\n')

  return contexto ? `\n\n# DOCUMENTOS DE REFERÊNCIA\n\n${contexto}` : ''
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
  return `\n\n# APRENDIZADOS ANTERIORES\n\n${contexto}`
}

async function obterCambio(): Promise<number> {
  const config = await prisma.configuracao.findUnique({
    where: { chave: 'cambio_dolar_real' },
  })
  return parseFloat(config?.valor ?? process.env.DOLAR_REAL_PADRAO ?? '5.50')
}

export async function enviarMensagemGemini(
  mensagens: MensagemChat[],
  contexto: ContextoAnalise,
  cidadeId?: string
) {
  const genAI = getGenAI()
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash',
    systemInstruction: SYSTEM_PROMPT,
    generationConfig: {
      maxOutputTokens: 8192,
      temperature: 0.7,
    },
    safetySettings: [
      { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
      { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
    ],
  })

  const documentosCtx = await buscarDocumentosRelevantes(
    mensagens[mensagens.length - 1]?.content ?? '',
    cidadeId
  )
  const aprendizadosCtx = await buscarAprendizadosRelevantes(cidadeId)

  let contextoStr = ''
  if (contexto.cidade) contextoStr += `\nCidade: ${contexto.cidade}`
  if (contexto.inscricaoImobiliaria) contextoStr += `\nInscrição Imobiliária: ${contexto.inscricaoImobiliaria}`
  if (contexto.margemAlvo) contextoStr += `\nMargem de lucro alvo: ${contexto.margemAlvo}%`
  contextoStr += documentosCtx + aprendizadosCtx

  const historico = mensagens.slice(0, -1).map(m => ({
    role: m.role,
    parts: [{ text: m.content }],
  }))

  const chat = model.startChat({
    history: historico,
  })

  const ultimaMensagem = mensagens[mensagens.length - 1].content
  const mensagemComContexto = contextoStr
    ? `${contextoStr}\n\n---\n\n${ultimaMensagem}`
    : ultimaMensagem

  const result = await chat.sendMessage(mensagemComContexto)
  const response = result.response

  const tokensInput = response.usageMetadata?.promptTokenCount ?? 0
  const tokensOutput = response.usageMetadata?.candidatesTokenCount ?? 0

  // Custo Gemini 2.0 Flash: $0.10/1M input, $0.40/1M output
  const custoUsd = (tokensInput * 0.10 + tokensOutput * 0.40) / 1_000_000
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
