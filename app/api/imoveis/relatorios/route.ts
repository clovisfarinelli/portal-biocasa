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

  const filtro: any = {}
  if (usuario.perfil === 'PROPRIETARIO') {
    filtro.unidadeId = usuario.unidadeId
  }

  try {
    const [total, porStatusRaw, porBairroRaw, porCorretorRaw] = await Promise.all([
      prisma.imovel.count({ where: filtro }),
      prisma.imovel.groupBy({
        by: ['situacao'],
        _count: { id: true },
        where: filtro,
      }),
      prisma.imovel.groupBy({
        by: ['bairro'],
        _count: { id: true },
        where: filtro,
        orderBy: { _count: { bairro: 'desc' } },
        take: 10,
      }),
      prisma.imovel.groupBy({
        by: ['captador'],
        _count: { id: true },
        where: { ...filtro, captador: { not: null } },
        orderBy: { _count: { captador: 'desc' } },
      }),
    ])

    const porStatus = porStatusRaw.map(r => ({ status: r.situacao, total: r._count.id }))
    const porBairro = porBairroRaw.map(r => ({ bairro: r.bairro, total: r._count.id }))
    const porCorretor = porCorretorRaw
      .filter(r => r.captador)
      .map(r => ({ corretor: r.captador as string, total: r._count.id }))

    return NextResponse.json({ total, porStatus, porBairro, porCorretor })
  } catch (error: any) {
    const msg = error?.message ?? String(error)
    try {
      await prisma.logErro.create({
        data: {
          usuarioId: usuario.id ?? null,
          mensagem: '[/api/imoveis/relatorios] Erro ao buscar relatórios',
          detalhes: msg,
        },
      })
    } catch {}
    return NextResponse.json({ erro: 'Erro ao buscar relatórios' }, { status: 500 })
  }
}
