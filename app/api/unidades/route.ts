import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ erro: 'Não autorizado' }, { status: 401 })

  const unidades = await prisma.unidade.findMany({
    where: { ativo: true },
    orderBy: { nome: 'asc' },
  })

  return NextResponse.json(unidades)
}

const schemaUnidade = z.object({
  nome: z.string().min(2),
  estado: z.string().length(2),
  limiteAnalises: z.number().int().positive().default(50),
})

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ erro: 'Não autorizado' }, { status: 401 })

  const usuario = session.user as any
  if (usuario.perfil !== 'MASTER') {
    return NextResponse.json({ erro: 'Apenas MASTER pode criar unidades' }, { status: 403 })
  }

  const body = await req.json()
  const dados = schemaUnidade.parse(body)

  const unidade = await prisma.unidade.create({
    data: {
      nome: dados.nome,
      estado: dados.estado.toUpperCase(),
      limiteAnalises: dados.limiteAnalises,
    },
  })

  return NextResponse.json(unidade, { status: 201 })
}
