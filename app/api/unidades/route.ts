import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { z } from 'zod'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ erro: 'Não autorizado' }, { status: 401 })

  const usuario = session.user as any

  // MASTER vê todas as unidades + proprietário + consumo do mês
  if (usuario.perfil === 'MASTER') {
    const unidades = await prisma.unidade.findMany({
      orderBy: { nome: 'asc' },
      include: {
        usuarios: {
          where: { perfil: 'PROPRIETARIO' },
          select: { id: true, nome: true, email: true, ativo: true },
          take: 1,
        },
      },
    })

    return NextResponse.json(
      unidades.map(u => ({
        ...u,
        proprietario: u.usuarios[0] ?? null,
        usuarios: undefined,
      }))
    )
  }

  // Demais perfis: apenas lista ativa (para selects)
  const unidades = await prisma.unidade.findMany({
    where: { ativo: true },
    orderBy: { nome: 'asc' },
    select: { id: true, nome: true, estado: true, limiteAnalises: true },
  })

  return NextResponse.json(unidades)
}

const schemaCriarUnidade = z.object({
  nome: z.string().min(2),
  limiteAnalises: z.number().int().positive().default(50),
  nomeProprietario: z.string().min(2),
  emailProprietario: z.string().email(),
  senhaProprietario: z.string().min(8),
})

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ erro: 'Não autorizado' }, { status: 401 })

  const usuario = session.user as any
  if (usuario.perfil !== 'MASTER') {
    return NextResponse.json({ erro: 'Apenas MASTER pode criar unidades' }, { status: 403 })
  }

  let dados: z.infer<typeof schemaCriarUnidade>
  try {
    dados = schemaCriarUnidade.parse(await req.json())
  } catch (e: any) {
    return NextResponse.json({ erro: e?.message?.slice(0, 200) }, { status: 400 })
  }

  const emailExiste = await prisma.usuario.findUnique({ where: { email: dados.emailProprietario } })
  if (emailExiste) {
    return NextResponse.json({ erro: 'Email do proprietário já cadastrado' }, { status: 409 })
  }

  const senhaHash = await bcrypt.hash(dados.senhaProprietario, 12)

  // Cria unidade + proprietário atomicamente
  const [unidade, proprietario] = await prisma.$transaction(async (tx) => {
    const u = await tx.unidade.create({
      data: {
        nome: dados.nome,
        estado: '',
        limiteAnalises: dados.limiteAnalises,
      },
    })
    const p = await tx.usuario.create({
      data: {
        nome: dados.nomeProprietario,
        email: dados.emailProprietario,
        senhaHash,
        perfil: 'PROPRIETARIO',
        unidadeId: u.id,
      },
    })
    return [u, p]
  })

  return NextResponse.json(
    { ...unidade, proprietario: { id: proprietario.id, nome: proprietario.nome, email: proprietario.email, ativo: proprietario.ativo } },
    { status: 201 }
  )
}
