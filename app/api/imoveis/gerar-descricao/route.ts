import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { prisma } from '@/lib/prisma'

const SYSTEM_INSTRUCTION = `Role: Especialista em Copywriting Imobiliário de Alta Performance. Contexto: Gerar descrições otimizadas para portais (ZAP, VivaReal, QuintoAndar) a partir de dados estruturados de um sistema de CRM.

🧠 INSTRUÇÕES DE PROCESSAMENTO (Lógica Interna)
Ao receber os dados do imóvel, você deve:1. Filtragem Seletiva: Ignorar dados redundantes. Escolher os 3 diferenciais que agregam valor real (ex: vaga demarcada, andar alto, reforma recente).2. Ângulo Narrativo: Identificar o público-alvo provável. Se o imóvel é pequeno e central, foque em 'Praticidade'. Se é grande e em bairro calmo, foque em 'Conforto Familiar'.
3. Escaneabilidade: O texto deve ser curto, dividido em até 4 parágrafos objetivos, sem o uso de listas (bullet points), mantendo a fluidez da leitura.

✍️ PADRÃO DE ESCRITA
* Parágrafo 1 (O Gancho): [Tipo do Imóvel] com [Metragem] em [Bairro], destacando-se por [Diferencial Principal].
* Parágrafo 2 (A Experiência): Descrever a distribuição dos cômodos seguindo o fluxo natural (Social -> Serviço -> Íntimo).
* Parágrafo 3 (O Valor): Focar em diferenciais sensoriais e estado de conservação (iluminação, ventilação, acabamentos).
* Parágrafo 4 (O Contexto): Breve menção ao que a localização ou o condomínio entregam de facilidade para o dia a dia.

🚫 RESTRIÇÕES CRÍTICAS (Saída da API)
* Saída Limpa: Retorne APENAS o texto da descrição. Não inclua introduções como "Aqui está sua copy" ou conclusões.* Sem Clichês: Proibido o uso de: "imperdível", "oportunidade única", "maravilhoso", "excelente", "confira".* Sem Inventar: Se uma informação não estiver nos dados de entrada, não a crie (ex: não invente que tem varanda se a ficha não menciona).* Tom de Voz: Profissional, direto, empático e informativo.`

const LABEL_FINALIDADE: Record<string, string> = {
  RESIDENCIAL: 'Residencial',
  COMERCIAL: 'Comercial',
}

const LABEL_TIPO: Record<string, string> = {
  CASA: 'Casa',
  APARTAMENTO: 'Apartamento',
  TERRENO: 'Terreno',
  CHACARA: 'Chácara',
  SALA: 'Sala',
  LOJA: 'Loja',
  CASA_COMERCIAL: 'Casa Comercial',
  GALPAO: 'Galpão',
}

const LABEL_SUBTIPO: Record<string, string> = {
  ISOLADA: 'Isolada',
  SOBRADO: 'Sobrado',
  SOBREPOSTA_ALTA: 'Sobreposta Alta',
  SOBREPOSTA_BAIXA: 'Sobreposta Baixa',
  VILLAGGIO: 'Villaggio',
  KITNET_STUDIO: 'Kitnet/Studio',
  PADRAO: 'Padrão',
  TERREO: 'Térreo',
}

const LABEL_MODALIDADE: Record<string, string> = {
  VENDA: 'Venda',
  LOCACAO: 'Locação',
  AMBOS: 'Venda e Locação',
}

const LABEL_DORMITORIOS: Record<string, string> = {
  KIT_STUDIO: 'Kit/Studio',
  '1': '1',
  '2': '2',
  '3': '3',
  '4_MAIS': '4 ou mais',
}

const LABEL_SUITES: Record<string, string> = {
  NAO_TEM: 'Não tem',
  '1': '1',
  '2': '2',
  '3_MAIS': '3 ou mais',
}

const LABEL_BANHEIROS: Record<string, string> = {
  '1': '1',
  '2': '2',
  '3_MAIS': '3 ou mais',
}

const LABEL_VAGAS: Record<string, string> = {
  SEM_VAGA: 'Sem vaga',
  '1': '1',
  '2': '2',
  '3_MAIS': '3 ou mais',
  MOTOS: 'Para motos',
}

const LABEL_TIPO_GARAGEM: Record<string, string> = {
  FECHADA: 'Fechada',
  DEMARCADA: 'Demarcada',
  COLETIVA_SUF: 'Coletiva suficiente',
  COLETIVA_INSUF: 'Coletiva insuficiente',
}

const LABEL_SITUACAO_IMOVEL: Record<string, string> = {
  MOBILIADO: 'Mobiliado',
  SEMI_MOBILIADO: 'Semi-Mobiliado',
  VAZIO: 'Vazio',
}

const LABEL_TIPO_VISTA_MAR: Record<string, string> = {
  FRENTE: 'Frente',
  LATERAL: 'Lateral',
}

const LABEL_ACESSO: Record<string, string> = {
  TERREO: 'Térreo',
  ESCADAS: 'Escadas',
  ELEVADOR: 'Elevador',
}

const LABEL_FACILIDADES_IMOVEL: Record<string, string> = {
  ARMARIOS_QUARTOS: 'Armários nos Quartos',
  COZ_PLANEJADA: 'Cozinha Planejada',
  VENTILADOR_TETO: 'Ventilador de Teto',
  AR_CONDICIONADO: 'Ar Condicionado',
  VARANDA_GOURMET: 'Varanda Gourmet',
  CHURRASQUEIRA: 'Churrasqueira',
}

const LABEL_FACILIDADES_COND: Record<string, string> = {
  PISCINA: 'Piscina',
  ACADEMIA: 'Academia',
  SALAO_FESTAS: 'Salão de Festas',
  SALAO_JOGOS: 'Salão de Jogos',
  PLAYGROUND: 'Playground',
}

function montarMensagemUsuario(d: Record<string, any>): string {
  const linhas: string[] = ['Gere a descrição para o imóvel com os seguintes dados:', '']

  const add = (label: string, valor: string | undefined | null) => {
    if (valor && valor.trim()) linhas.push(`${label}: ${valor}`)
  }

  const finalidade = LABEL_FINALIDADE[d.finalidade] ?? d.finalidade
  const tipo = LABEL_TIPO[d.tipo] ?? d.tipo
  const subtipo = d.subtipo ? (LABEL_SUBTIPO[d.subtipo] ?? d.subtipo) : null
  add('Finalidade', finalidade)
  add('Tipo', subtipo ? `${tipo} — ${subtipo}` : tipo)
  add('Modalidade', LABEL_MODALIDADE[d.modalidade] ?? d.modalidade)

  // Endereço
  const partesCidade = [d.cidade, d.estado].filter(Boolean).join(' - ')
  const endereco = [d.logradouro, d.bairro, partesCidade].filter(Boolean).join(', ')
  add('Endereço', endereco)
  add('Edifício/Condomínio', d.edificio)

  // Quartos / suítes
  if (d.dormitorios) {
    const dormLabel = LABEL_DORMITORIOS[d.dormitorios] ?? d.dormitorios
    const suitesLabel = d.suites && d.suites !== 'NAO_TEM' ? (LABEL_SUITES[d.suites] ?? d.suites) : null
    add('Dormitórios', suitesLabel ? `${dormLabel} (sendo ${suitesLabel} suíte(s))` : dormLabel)
  }

  if (d.totalBanheiros) add('Banheiros', LABEL_BANHEIROS[d.totalBanheiros] ?? d.totalBanheiros)

  // Vagas
  if (d.vagasGaragem && d.vagasGaragem !== 'SEM_VAGA') {
    const vagasLabel = LABEL_VAGAS[d.vagasGaragem] ?? d.vagasGaragem
    const garLabel = d.tipoGaragem ? (LABEL_TIPO_GARAGEM[d.tipoGaragem] ?? d.tipoGaragem) : null
    add('Vagas', garLabel ? `${vagasLabel} (${garLabel})` : vagasLabel)
  } else if (d.vagasGaragem === 'SEM_VAGA') {
    add('Vagas', 'Sem vaga')
  }

  // Áreas
  if (d.areaUtil) add('Área privativa', `${d.areaUtil} m²`)
  if (d.areaTotal && d.areaTotal !== d.areaUtil) add('Área total', `${d.areaTotal} m²`)

  // Situação e diferenciais
  if (d.situacaoImovel) add('Situação do imóvel', LABEL_SITUACAO_IMOVEL[d.situacaoImovel] ?? d.situacaoImovel)
  if (d.vistaMar) {
    const vistaLabel = d.tipoVistaMar ? (LABEL_TIPO_VISTA_MAR[d.tipoVistaMar] ?? d.tipoVistaMar) : 'Sim'
    add('Vista Mar', vistaLabel)
  }
  if (d.dependencia) add('Dependência de empregada', 'sim')

  // Facilidades do imóvel
  const facilImovel = Array.isArray(d.facilidadesImovel)
    ? d.facilidadesImovel
        .filter((id: string) => id !== 'OUTROS')
        .map((id: string) => LABEL_FACILIDADES_IMOVEL[id] ?? id)
    : []
  const facilImovelOutros = Array.isArray(d.facilidadesImovelOutros) ? d.facilidadesImovelOutros : []
  const todasFacilImovel = [...facilImovel, ...facilImovelOutros]
  if (todasFacilImovel.length > 0) add('Facilidades do imóvel', todasFacilImovel.join(', '))

  // Condomínio: acesso e andar
  if (d.acesso) add('Acesso ao condomínio', LABEL_ACESSO[d.acesso] ?? d.acesso)
  if (d.andar) add('Andar', String(d.andar))

  // Facilidades do condomínio
  const facilCond = Array.isArray(d.facilidadesCond)
    ? d.facilidadesCond
        .filter((id: string) => id !== 'OUTROS')
        .map((id: string) => LABEL_FACILIDADES_COND[id] ?? id)
    : []
  const facilCondOutros = Array.isArray(d.facilidadesCondOutros) ? d.facilidadesCondOutros : []
  const todasFacilCond = [...facilCond, ...facilCondOutros]
  if (todasFacilCond.length > 0) add('Facilidades do condomínio', todasFacilCond.join(', '))

  return linhas.join('\n')
}

async function logErro(usuarioId: string | null, mensagem: string, detalhes?: string) {
  try {
    await prisma.logErro.create({ data: { usuarioId, mensagem, detalhes } })
  } catch {}
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ erro: 'Não autorizado' }, { status: 401 })

  const usuario = session.user as any
  const usuarioId: string | null = usuario?.id ?? null

  let dados: Record<string, any>
  try {
    dados = await request.json()
  } catch {
    return NextResponse.json({ erro: 'Dados inválidos' }, { status: 400 })
  }

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    await logErro(usuarioId, 'GEMINI_API_KEY não configurada', 'gerar-descricao')
    return NextResponse.json({ erro: 'Serviço de IA não configurado.' }, { status: 503 })
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      systemInstruction: SYSTEM_INSTRUCTION,
      generationConfig: { maxOutputTokens: 1024, temperature: 0.7 },
    })

    const mensagem = montarMensagemUsuario(dados)
    const result = await model.generateContent(mensagem)
    const descricao = result.response.text().trim()

    return NextResponse.json({ descricao })
  } catch (e: any) {
    await logErro(usuarioId, 'Erro ao gerar descrição com IA', e?.message?.slice(0, 500))
    return NextResponse.json({ erro: 'Não foi possível gerar a descrição. Tente novamente.' }, { status: 500 })
  }
}
