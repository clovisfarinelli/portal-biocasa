import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const MESES_LABEL = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']

function inicioDoMes(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1)
}
function fimDoMes(d: Date) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999)
}
function subMeses(d: Date, n: number) {
  const r = new Date(d)
  r.setMonth(r.getMonth() - n)
  return r
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ erro: 'Não autorizado' }, { status: 401 })

  const usuario = session.user as any
  if (usuario.perfil !== 'MASTER') {
    return NextResponse.json({ erro: 'Acesso restrito ao perfil MASTER' }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const unidadeIdFiltro = searchParams.get('unidadeId') || null
  const meses = Math.min(Math.max(parseInt(searchParams.get('meses') || '6'), 1), 24)

  const agora = new Date()
  const dataInicio = inicioDoMes(subMeses(agora, meses - 1))
  const dataFim = fimDoMes(agora)

  const [unidades, analises, imoveisGrupo, usuariosGrupo] = await Promise.all([
    prisma.unidade.findMany({
      where: unidadeIdFiltro ? { id: unidadeIdFiltro } : { ativo: true },
      orderBy: { nome: 'asc' },
      select: { id: true, nome: true, analisesMes: true, limiteAnalises: true },
    }),
    prisma.analise.findMany({
      where: {
        criadoEm: { gte: dataInicio, lte: dataFim },
        ...(unidadeIdFiltro ? { unidadeId: unidadeIdFiltro } : {}),
      },
      select: { unidadeId: true, custoBrl: true, criadoEm: true },
    }),
    prisma.imovel.groupBy({
      by: ['unidadeId'],
      _count: { id: true },
      where: unidadeIdFiltro ? { unidadeId: unidadeIdFiltro } : {},
    }),
    prisma.usuario.groupBy({
      by: ['unidadeId'],
      _count: { id: true },
      where: {
        ativo: true,
        unidadeId: { not: null },
        ...(unidadeIdFiltro ? { unidadeId: unidadeIdFiltro } : {}),
      },
    }),
  ])

  // Agrupa análises por unidade
  const analisesMap = new Map<string, { count: number; custo: number }>()
  for (const a of analises) {
    if (!a.unidadeId) continue
    const cur = analisesMap.get(a.unidadeId) ?? { count: 0, custo: 0 }
    analisesMap.set(a.unidadeId, { count: cur.count + 1, custo: cur.custo + (a.custoBrl ?? 0) })
  }

  const imoveisMap = new Map(imoveisGrupo.map(g => [g.unidadeId, g._count.id]))
  const usuariosMap = new Map(usuariosGrupo.map(g => [g.unidadeId!, g._count.id]))

  const metricas = unidades.map(u => ({
    id: u.id,
    nome: u.nome,
    analisesMes: u.analisesMes,
    limiteAnalises: u.limiteAnalises,
    analisesNoPeriodo: analisesMap.get(u.id)?.count ?? 0,
    custoNoPeriodo: analisesMap.get(u.id)?.custo ?? 0,
    imoveisCadastrados: imoveisMap.get(u.id) ?? 0,
    usuariosAtivos: usuariosMap.get(u.id) ?? 0,
  }))

  // Evolução mensal
  const mesesChave: { key: string; label: string }[] = []
  for (let i = meses - 1; i >= 0; i--) {
    const d = subMeses(agora, i)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    const label = `${MESES_LABEL[d.getMonth()]}/${String(d.getFullYear()).slice(-2)}`
    mesesChave.push({ key, label })
  }

  const evolMap = new Map(mesesChave.map(m => [m.key, { analises: 0, custo: 0 }]))
  for (const a of analises) {
    const d = new Date(a.criadoEm)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    const cur = evolMap.get(key)
    if (cur) { cur.analises += 1; cur.custo += a.custoBrl ?? 0 }
  }

  const evolucaoMensal = mesesChave.map(m => ({
    mes: m.key,
    label: m.label,
    analises: evolMap.get(m.key)?.analises ?? 0,
    custo: evolMap.get(m.key)?.custo ?? 0,
  }))

  return NextResponse.json({ metricas, evolucaoMensal })
}
