import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ erro: 'Não autorizado' }, { status: 401 })

  const usuario = session.user as any
  if (usuario.perfil !== 'MASTER') {
    return NextResponse.json({ erro: 'Acesso negado' }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const pagina = parseInt(searchParams.get('pagina') ?? '1')
  const porPagina = 50

  const [logs, total] = await Promise.all([
    prisma.logErro.findMany({
      orderBy: { criadoEm: 'desc' },
      skip: (pagina - 1) * porPagina,
      take: porPagina,
      include: { usuario: { select: { nome: true, email: true } } },
    }),
    prisma.logErro.count(),
  ])

  return NextResponse.json({ logs, total })
}
