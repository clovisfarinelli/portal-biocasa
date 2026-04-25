import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ erro: 'Não autorizado' }, { status: 401 })

  const usuario = session.user as any
  const analise = await prisma.analise.findUnique({
    where: { id: params.id },
    include: {
      cidade: true,
      arquivos: true,
      usuario: { select: { nome: true, perfil: true } },
    },
  })

  if (!analise) return NextResponse.json({ erro: 'Análise não encontrada' }, { status: 404 })

  // Validação de acesso
  if (usuario.perfil === 'ESPECIALISTA' && analise.usuarioId !== usuario.id) {
    return NextResponse.json({ erro: 'Acesso negado' }, { status: 403 })
  }
  if (usuario.perfil === 'PROPRIETARIO' && analise.unidadeId !== usuario.unidadeId) {
    return NextResponse.json({ erro: 'Acesso negado' }, { status: 403 })
  }

  return NextResponse.json(analise)
}

const schemaValidacao = z.object({
  statusValidacao: z.enum(['VALIDA', 'INVALIDA']),
  motivoInvalidacao: z.string().optional(),
})

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ erro: 'Não autorizado' }, { status: 401 })

  const body = await req.json()
  const dados = schemaValidacao.parse(body)

  const analise = await prisma.analise.update({
    where: { id: params.id },
    data: {
      statusValidacao: dados.statusValidacao,
      motivoInvalidacao: dados.motivoInvalidacao,
      validadoEm: new Date(),
      usarComoAprendizado: dados.statusValidacao === 'VALIDA',
    },
  })

  // Cria aprendizado se válida
  if (dados.statusValidacao === 'VALIDA') {
    const conversa = analise.conteudoConversa as any[]
    const resumo = conversa
      .filter(m => m.role === 'model')
      .map(m => m.content)
      .join('\n\n')
      .slice(0, 2000)

    await prisma.aprendizado.upsert({
      where: { analiseId: analise.id },
      update: { resumo, ativo: true },
      create: {
        analiseId: analise.id,
        cidadeId: analise.cidadeId,
        resumo,
      },
    })
  }

  return NextResponse.json(analise)
}
