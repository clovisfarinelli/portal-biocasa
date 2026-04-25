import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { enviarMensagemGemini, ArquivoParaGemini } from '@/lib/gemini'
import { z } from 'zod'

const schemaArquivo = z.object({
  url: z.string(),
  tipo: z.string(),
  nome: z.string(),
})

const schemaNovaAnalise = z.object({
  mensagem: z.string().min(1),
  cidadeId: z.string().nullish(),
  inscricaoImobiliaria: z.string().nullish(),
  margemAlvo: z.number().optional(),
  analiseProfunda: z.boolean().default(false),
  analiseId: z.string().nullish(),
  historico: z.array(z.object({
    role: z.enum(['user', 'model']),
    content: z.string(),
  })).default([]),
  arquivos: z.array(schemaArquivo).default([]),
})

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ erro: 'Não autorizado' }, { status: 401 })

  const usuario = session.user as any
  const { searchParams } = new URL(req.url)
  const pagina = parseInt(searchParams.get('pagina') ?? '1')
  const porPagina = 20
  const skip = (pagina - 1) * porPagina

  const proprio           = searchParams.get('proprio') === 'true'
  const filtroUnidade     = searchParams.get('unidadeId')
  const filtroUsr         = searchParams.get('usuarioId')
  const filtroMes         = searchParams.get('mes')           // YYYY-MM
  const filtroStatus      = searchParams.get('statusValidacao') // PENDENTE | VALIDA | INVALIDA
  const porPaginaReq      = Math.min(parseInt(searchParams.get('porPagina') ?? '20'), 200)

  const filtro: any = {}

  if (usuario.perfil === 'ESPECIALISTA') {
    filtro.usuarioId = usuario.id
  } else if (usuario.perfil === 'PROPRIETARIO') {
    filtro.unidadeId = usuario.unidadeId
  } else {
    // MASTER: sidebar usa ?proprio=true para ver só a sua unidade
    if (proprio && usuario.unidadeId) filtro.unidadeId = usuario.unidadeId
    if (filtroUnidade) filtro.unidadeId = filtroUnidade
    if (filtroUsr)     filtro.usuarioId = filtroUsr
  }

  if (filtroMes) {
    const [ano, mes] = filtroMes.split('-').map(Number)
    filtro.criadoEm = { gte: new Date(ano, mes - 1, 1), lt: new Date(ano, mes, 1) }
  }

  if (filtroStatus) filtro.statusValidacao = filtroStatus

  const limite = porPaginaReq || porPagina

  const [analises, total] = await Promise.all([
    prisma.analise.findMany({
      where: filtro,
      orderBy: { criadoEm: 'desc' },
      skip,
      take: limite,
      include: {
        usuario: { select: { nome: true } },
        cidade: { select: { nome: true } },
        unidade: { select: { nome: true } },
      },
    }),
    prisma.analise.count({ where: filtro }),
  ])

  return NextResponse.json({ analises, total, pagina, porPagina })
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ erro: 'Não autorizado' }, { status: 401 })

  const usuario = session.user as any

  let dados: z.infer<typeof schemaNovaAnalise>
  try {
    const body = await req.json()
    dados = schemaNovaAnalise.parse(body)
  } catch (parseErr: any) {
    console.error('[analises/POST] body inválido:', parseErr?.message)
    return NextResponse.json(
      { erro: `Dados inválidos: ${parseErr?.message?.slice(0, 200)}` },
      { status: 400 }
    )
  }

  // Verifica limite da unidade para PROPRIETARIO e ESPECIALISTA
  if (usuario.perfil !== 'MASTER' && usuario.unidadeId) {
    const unidade = await prisma.unidade.findUnique({
      where: { id: usuario.unidadeId },
    })
    if (unidade && unidade.analisesMes >= unidade.limiteAnalises) {
      return NextResponse.json(
        { erro: 'Limite de análises da unidade atingido. Entre em contato com o MASTER.' },
        { status: 429 }
      )
    }
  }

  try {
    const cidadeId = dados.cidadeId ?? undefined
    const analiseId = dados.analiseId ?? undefined

    const cidade = cidadeId
      ? await prisma.cidade.findUnique({ where: { id: cidadeId } })
      : null

    // Consolida arquivos: os enviados agora + os já salvos nesta análise (turnos anteriores)
    let arquivosDoTurno: ArquivoParaGemini[] = dados.arquivos
    if (analiseId && dados.arquivos.length === 0) {
      const salvos = await prisma.arquivoAnalise.findMany({ where: { analiseId } })
      arquivosDoTurno = salvos.map(a => ({ url: a.arquivoUrl, tipo: a.tipo, nome: a.nomeArquivo }))
    }

    const resultado = await enviarMensagemGemini(
      [...dados.historico, { role: 'user', content: dados.mensagem }],
      {
        cidade: cidade?.nome,
        inscricaoImobiliaria: dados.inscricaoImobiliaria ?? undefined,
        margemAlvo: dados.margemAlvo,
      },
      cidadeId,
      arquivosDoTurno,
      dados.analiseProfunda
    )

    // Remove the [SOLICITAR_DOCS] marker before storing so it doesn't pollute the history
    const textoArmazenado = resultado.texto.replace(/\[SOLICITAR_DOCS\]\s*$/m, '').trim()

    const novoHistorico = [
      ...dados.historico,
      { role: 'user' as const, content: dados.mensagem },
      { role: 'model' as const, content: textoArmazenado },
    ]

    let analise
    if (analiseId) {
      analise = await prisma.analise.update({
        where: { id: analiseId },
        data: {
          conteudoConversa: novoHistorico,
          tokensInput: { increment: resultado.tokensInput },
          tokensOutput: { increment: resultado.tokensOutput },
          custoUsd: { increment: resultado.custoUsd },
          custoBrl: { increment: resultado.custoBrl },
        },
      })
    } else {
      analise = await prisma.analise.create({
        data: {
          usuarioId: usuario.id,
          unidadeId: usuario.unidadeId ?? null,
          cidadeId: cidadeId ?? null,
          inscricaoImobiliaria: dados.inscricaoImobiliaria ?? null,
          margemAlvo: dados.margemAlvo ?? 20,
          analiseProfunda: dados.analiseProfunda,
          conteudoConversa: novoHistorico,
          tokensInput: resultado.tokensInput,
          tokensOutput: resultado.tokensOutput,
          custoUsd: resultado.custoUsd,
          custoBrl: resultado.custoBrl,
        },
      })

      // Incrementa contador da unidade
      if (usuario.unidadeId) {
        await prisma.unidade.update({
          where: { id: usuario.unidadeId },
          data: { analisesMes: { increment: 1 } },
        })
      }
    }

    return NextResponse.json({
      resposta: resultado.texto,
      analiseId: analise.id,
      tokensInput: resultado.tokensInput,
      tokensOutput: resultado.tokensOutput,
      custoBrl: resultado.custoBrl,
    })
  } catch (error: any) {
    const nome = error?.constructor?.name ?? 'Error'
    const msg: string = error?.message ?? String(error)
    const stack = error?.stack?.split('\n').slice(0, 4).join(' | ') ?? ''

    console.error('[analises/POST] ERRO:', nome, msg, stack)

    try {
      await prisma.logErro.create({
        data: {
          usuarioId: usuario.id,
          mensagem: `[${nome}] Erro ao chamar API Gemini`,
          detalhes: `${msg}\n\n${stack}`,
        },
      })
    } catch (dbErr: any) {
      console.error('[analises/POST] falha ao gravar log:', dbErr?.message)
    }

    return NextResponse.json(
      { erro: `Erro ao processar análise. [${nome}]: ${msg.slice(0, 200)}` },
      { status: 500 }
    )
  }
}
