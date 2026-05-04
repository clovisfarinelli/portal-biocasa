import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const schemaFiltros = z.object({
  usuarioId:  z.string().optional(),
  unidadeId:  z.string().optional(),
  acao:       z.string().optional(),
  recurso:    z.string().optional(),
  dataInicio: z.string().optional(),
  dataFim:    z.string().optional(),
  pagina:     z.string().optional(),
})

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ erro: 'Não autorizado' }, { status: 401 })

  const operador = session.user as any
  if (operador.perfil !== 'MASTER') {
    return NextResponse.json({ erro: 'Acesso restrito ao MASTER' }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const filtros = schemaFiltros.parse(Object.fromEntries(searchParams.entries()))

  const pagina    = parseInt(filtros.pagina ?? '1')
  const porPagina = 50
  const skip      = (pagina - 1) * porPagina

  const where: any = {}

  if (filtros.usuarioId) where.usuarioId = filtros.usuarioId
  if (filtros.acao)      where.acao      = filtros.acao
  if (filtros.recurso)   where.recurso   = filtros.recurso

  if (filtros.dataInicio || filtros.dataFim) {
    where.criadoEm = {
      ...(filtros.dataInicio ? { gte: new Date(filtros.dataInicio) } : {}),
      ...(filtros.dataFim    ? { lte: new Date(filtros.dataFim + 'T23:59:59Z') } : {}),
    }
  }

  // filtro por unidade: busca usuários dessa unidade e filtra pelos seus logs
  if (filtros.unidadeId) {
    const usuariosDaUnidade = await prisma.usuario.findMany({
      where: { unidadeId: filtros.unidadeId },
      select: { id: true },
    })
    const ids = usuariosDaUnidade.map(u => u.id)
    where.usuarioId = { in: ids }
  }

  const [logs, total] = await Promise.all([
    prisma.logAcesso.findMany({
      where,
      orderBy: { criadoEm: 'desc' },
      skip,
      take: porPagina,
      include: {
        usuario: {
          select: { id: true, nome: true, email: true, perfil: true, unidadeId: true, unidade: { select: { nome: true } } },
        },
      },
    }),
    prisma.logAcesso.count({ where }),
  ])

  // busca usuários e unidades para os selects dos filtros
  const [usuarios, unidades] = await Promise.all([
    prisma.usuario.findMany({ select: { id: true, nome: true, email: true }, orderBy: { nome: 'asc' } }),
    prisma.unidade.findMany({ select: { id: true, nome: true }, orderBy: { nome: 'asc' } }),
  ])

  return NextResponse.json({ logs, total, pagina, porPagina, usuarios, unidades })
}
