import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { gerarSlugImovel } from '@/lib/slug'

export async function POST() {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any)?.perfil !== 'MASTER') {
    return NextResponse.json({ erro: 'Acesso restrito ao MASTER' }, { status: 403 })
  }

  const imoveis = await prisma.imovel.findMany({
    where: { slug: null },
    select: { id: true, codigoRef: true, tipo: true, bairro: true, cidade: true },
  })

  let atualizados = 0
  const erros: string[] = []

  for (const imovel of imoveis) {
    const slug = gerarSlugImovel(imovel.codigoRef, imovel.tipo, imovel.bairro, imovel.cidade)
    try {
      await prisma.imovel.update({ where: { id: imovel.id }, data: { slug } })
      atualizados++
    } catch {
      // Slug duplicado — adiciona sufixo com id curto
      try {
        await prisma.imovel.update({
          where: { id: imovel.id },
          data: { slug: `${slug}-${imovel.id.slice(-4)}` },
        })
        atualizados++
      } catch (err: any) {
        erros.push(`${imovel.codigoRef}: ${err?.message}`)
      }
    }
  }

  return NextResponse.json({ atualizados, total: imoveis.length, erros })
}
