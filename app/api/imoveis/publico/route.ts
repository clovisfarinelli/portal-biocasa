import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const POR_PAGINA = 12

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl

  const tipo = searchParams.get('tipo') || undefined
  const modalidade = searchParams.get('modalidade') || undefined
  const cidade = searchParams.get('cidade') || undefined
  const bairro = searchParams.get('bairro') || undefined
  const quartosMin = searchParams.get('quartos_min') ? Number(searchParams.get('quartos_min')) : undefined
  const valorMax = searchParams.get('valor_max') ? Number(searchParams.get('valor_max')) : undefined
  const destaque = searchParams.get('destaque') === 'true'
  const pagina = Math.max(1, Number(searchParams.get('pagina')) || 1)

  const where: any = { situacao: 'DISPONIVEL' }

  if (tipo) where.tipo = tipo
  if (cidade) where.cidade = { contains: cidade, mode: 'insensitive' }
  if (bairro) where.bairro = { contains: bairro, mode: 'insensitive' }
  if (destaque) where.destaque = true

  if (quartosMin) {
    const faixas: Record<number, string[]> = {
      1: ['1', '2', '3', '4_MAIS'],
      2: ['2', '3', '4_MAIS'],
      3: ['3', '4_MAIS'],
      4: ['4_MAIS'],
    }
    where.dormitorios = { in: faixas[quartosMin] ?? ['4_MAIS'] }
  }

  if (modalidade === 'VENDA') {
    where.modalidade = { in: ['VENDA', 'AMBOS'] }
  } else if (modalidade === 'LOCACAO') {
    where.modalidade = { in: ['LOCACAO', 'AMBOS'] }
  }

  if (valorMax) {
    if (modalidade === 'VENDA') {
      where.valorVenda = { lte: valorMax }
    } else if (modalidade === 'LOCACAO') {
      where.valorLocacao = { lte: valorMax }
    } else {
      where.OR = [
        { valorVenda: { lte: valorMax, not: null } },
        { valorLocacao: { lte: valorMax, not: null } },
      ]
    }
  }

  try {
    const [total, imoveis] = await Promise.all([
      prisma.imovel.count({ where }),
      prisma.imovel.findMany({
        where,
        select: {
          id: true,
          codigoRef: true,
          nome: true,
          tipo: true,
          subtipo: true,
          modalidade: true,
          locacaoPacote: true,
          bairro: true,
          cidade: true,
          estado: true,
          valorVenda: true,
          valorLocacao: true,
          areaUtil: true,
          areaTotal: true,
          dormitorios: true,
          totalBanheiros: true,
          vagasGaragem: true,
          descricao: true,
          fotos: true,
          destaque: true,
        },
        orderBy: [{ destaque: 'desc' }, { dataCadastro: 'desc' }],
        skip: (pagina - 1) * POR_PAGINA,
        take: POR_PAGINA,
      }),
    ])

    const resultado = imoveis.map(imovel => {
      let fotoCapa: string | null = null
      if (imovel.fotos) {
        try {
          const arr = JSON.parse(imovel.fotos)
          fotoCapa = arr.find((f: any) => f.principal)?.url ?? arr[0]?.url ?? null
        } catch {}
      }
      return { ...imovel, fotos: undefined, fotoCapa }
    })

    return NextResponse.json({
      imoveis: resultado,
      total,
      pagina,
      paginas: Math.ceil(total / POR_PAGINA),
    })
  } catch {
    return NextResponse.json({ erro: 'Erro ao buscar imóveis' }, { status: 500 })
  }
}
