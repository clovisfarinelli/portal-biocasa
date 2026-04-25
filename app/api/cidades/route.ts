import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ erro: 'Não autorizado' }, { status: 401 })

  const cidades = await prisma.cidade.findMany({
    where: { ativo: true },
    orderBy: [{ estado: 'asc' }, { nome: 'asc' }],
  })

  return NextResponse.json(cidades)
}

const schemaCidade = z.object({
  nome: z.string().min(2),
  estado: z.string().length(2),
})

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ erro: 'Não autorizado' }, { status: 401 })

  const body = await req.json()
  const dados = schemaCidade.parse(body)

  const cidade = await prisma.cidade.upsert({
    where: { nome_estado: { nome: dados.nome.trim(), estado: dados.estado.toUpperCase() } },
    update: { ativo: true },
    create: { nome: dados.nome.trim(), estado: dados.estado.toUpperCase() },
  })

  return NextResponse.json(cidade, { status: 201 })
}
