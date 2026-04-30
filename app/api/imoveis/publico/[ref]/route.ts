import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(_req: NextRequest, { params }: { params: { ref: string } }) {
  try {
    const imovel = await prisma.imovel.findFirst({
      where: { codigoRef: params.ref, situacao: 'DISPONIVEL', publicarSite: true },
    })

    if (!imovel) {
      return NextResponse.json({ erro: 'Imóvel não encontrado' }, { status: 404 })
    }

    return NextResponse.json(imovel)
  } catch {
    return NextResponse.json({ erro: 'Erro ao buscar imóvel' }, { status: 500 })
  }
}
