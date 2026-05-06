import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ erro: 'Não autorizado' }, { status: 401 })

  const usuario = session.user as any

  if (!['MASTER', 'PROPRIETARIO'].includes(usuario.perfil)) {
    return NextResponse.json({ erro: 'Acesso negado' }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const paramUnidade  = searchParams.get('unidadeId')
  const paramModal    = searchParams.get('modalidade')
  const paramTipo     = searchParams.get('tipo')
  const paramCidade   = searchParams.get('cidade')
  const paramCaptador = searchParams.get('captador')

  const where: any = {}

  if (usuario.perfil === 'PROPRIETARIO') {
    where.unidadeId = usuario.unidadeId
  } else if (paramUnidade) {
    where.unidadeId = paramUnidade
  }

  if (paramModal)    where.modalidade = paramModal
  if (paramTipo)     where.tipo = paramTipo
  if (paramCidade)   where.cidade = { contains: paramCidade, mode: 'insensitive' }
  if (paramCaptador) where.captador = { contains: paramCaptador, mode: 'insensitive' }

  try {
    const imoveis = await prisma.imovel.findMany({
      where,
      select: {
        id: true,
        codigoRef: true,
        dataCadastro: true,
        logradouro: true,
        numero: true,
        complemento: true,
        bairro: true,
        cidade: true,
        valorVenda: true,
        valorLocacao: true,
        modalidade: true,
        tipo: true,
        captador: true,
        unidadeId: true,
      },
      orderBy: [
        { captador: 'asc' },
        { modalidade: 'asc' },
        { tipo: 'asc' },
        { cidade: 'asc' },
        { bairro: 'asc' },
      ],
    })

    const filtrosAplicados = {
      unidadeId: paramUnidade ?? null,
      modalidade: paramModal ?? null,
      tipo: paramTipo ?? null,
      cidade: paramCidade ?? null,
      captador: paramCaptador ?? null,
    }

    return NextResponse.json({
      imoveis,
      filtrosAplicados,
      total: imoveis.length,
      geradoEm: new Date().toISOString(),
    })
  } catch (error: any) {
    const msg = error?.message ?? String(error)
    try {
      await prisma.logErro.create({
        data: {
          usuarioId: usuario.id ?? null,
          mensagem: '[/api/imoveis/relatorios/impressao] Erro ao gerar relatório',
          detalhes: msg,
        },
      })
    } catch {}
    return NextResponse.json({ erro: 'Erro ao gerar relatório' }, { status: 500 })
  }
}
