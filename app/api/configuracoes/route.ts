import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ erro: 'Não autorizado' }, { status: 401 })

  const configuracoes = await prisma.configuracao.findMany()
  const mapa: Record<string, string> = {}
  configuracoes.forEach(c => { mapa[c.chave] = c.valor })

  return NextResponse.json(mapa)
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ erro: 'Não autorizado' }, { status: 401 })

  const usuario = session.user as any
  if (usuario.perfil !== 'MASTER') {
    return NextResponse.json({ erro: 'Apenas MASTER pode alterar configurações' }, { status: 403 })
  }

  const body = await req.json()

  await Promise.all(
    Object.entries(body).map(([chave, valor]) =>
      prisma.configuracao.upsert({
        where: { chave },
        update: { valor: String(valor) },
        create: { chave, valor: String(valor) },
      })
    )
  )

  return NextResponse.json({ ok: true })
}
