import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { enviarMensagemGemini } from '@/lib/gemini'
import { z } from 'zod'

const schemaNovaAnalise = z.object({
  mensagem: z.string().min(1),
  cidadeId: z.string().optional(),
  inscricaoImobiliaria: z.string().optional(),
  margemAlvo: z.number().optional(),
  analiseProfunda: z.boolean().default(false),
  analiseId: z.string().optional(),
  historico: z.array(z.object({
    role: z.enum(['user', 'model']),
    content: z.string(),
  })).default([]),
})

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ erro: 'Não autorizado' }, { status: 401 })

  const usuario = session.user as any
  const { searchParams } = new URL(req.url)
  const pagina = parseInt(searchParams.get('pagina') ?? '1')
  const porPagina = 20
  const skip = (pagina - 1) * porPagina

  const filtro: any = {}
  if (usuario.perfil === 'ESPECIALISTA') {
    filtro.usuarioId = usuario.id
  } else if (usuario.perfil === 'PROPRIETARIO') {
    filtro.unidadeId = usuario.unidadeId
  }

  const [analises, total] = await Promise.all([
    prisma.analise.findMany({
      where: filtro,
      orderBy: { criadoEm: 'desc' },
      skip,
      take: porPagina,
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
  const body = await req.json()
  const dados = schemaNovaAnalise.parse(body)

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
    const cidade = dados.cidadeId
      ? await prisma.cidade.findUnique({ where: { id: dados.cidadeId } })
      : null

    const resultado = await enviarMensagemGemini(
      [...dados.historico, { role: 'user', content: dados.mensagem }],
      {
        cidade: cidade?.nome,
        inscricaoImobiliaria: dados.inscricaoImobiliaria,
        margemAlvo: dados.margemAlvo,
      },
      dados.cidadeId
    )

    const novoHistorico = [
      ...dados.historico,
      { role: 'user' as const, content: dados.mensagem },
      { role: 'model' as const, content: resultado.texto },
    ]

    let analise
    if (dados.analiseId) {
      analise = await prisma.analise.update({
        where: { id: dados.analiseId },
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
          cidadeId: dados.cidadeId ?? null,
          inscricaoImobiliaria: dados.inscricaoImobiliaria,
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
    await prisma.logErro.create({
      data: {
        usuarioId: usuario.id,
        mensagem: 'Erro ao chamar API Gemini',
        detalhes: error?.message ?? String(error),
      },
    })
    return NextResponse.json({ erro: 'Erro ao processar análise. Tente novamente.' }, { status: 500 })
  }
}
