import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { z } from 'zod'

const schemaCriarUsuario = z.object({
  nome: z.string().min(2),
  email: z.string().email(),
  senha: z.string().min(8),
  perfil: z.enum(['MASTER', 'PROPRIETARIO', 'ESPECIALISTA']),
  unidadeId: z.string().optional(),
})

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ erro: 'Não autorizado' }, { status: 401 })

  const usuario = session.user as any
  if (usuario.perfil === 'ESPECIALISTA') {
    return NextResponse.json({ erro: 'Acesso negado' }, { status: 403 })
  }

  const filtro: any = {}
  if (usuario.perfil === 'PROPRIETARIO') {
    filtro.unidadeId = usuario.unidadeId
  }

  const inicio = new Date()
  inicio.setDate(1)
  inicio.setHours(0, 0, 0, 0)

  const usuarios = await prisma.usuario.findMany({
    where: filtro,
    include: {
      unidade: { select: { nome: true, limiteAnalises: true } },
      _count: { select: { analises: true } },
    },
    orderBy: { criadoEm: 'desc' },
  })

  // Calcula consumo do mês por usuário
  const usuariosComConsumo = await Promise.all(
    usuarios.map(async (u) => {
      const analisesMes = await prisma.analise.aggregate({
        where: { usuarioId: u.id, criadoEm: { gte: inicio } },
        _sum: { custoBrl: true },
        _count: { id: true },
      })
      return {
        ...u,
        analisesMes: analisesMes._count.id,
        custoMes: analisesMes._sum.custoBrl ?? 0,
      }
    })
  )

  return NextResponse.json(usuariosComConsumo)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ erro: 'Não autorizado' }, { status: 401 })

  const operador = session.user as any
  if (operador.perfil === 'ESPECIALISTA') {
    return NextResponse.json({ erro: 'Acesso negado' }, { status: 403 })
  }

  const body = await req.json()
  const dados = schemaCriarUsuario.parse(body)

  // PROPRIETARIO só pode criar ESPECIALISTA na sua unidade
  if (operador.perfil === 'PROPRIETARIO') {
    if (dados.perfil !== 'ESPECIALISTA') {
      return NextResponse.json({ erro: 'Proprietário só pode criar Especialistas' }, { status: 403 })
    }
    dados.unidadeId = operador.unidadeId
  }

  const emailExiste = await prisma.usuario.findUnique({ where: { email: dados.email } })
  if (emailExiste) {
    return NextResponse.json({ erro: 'Email já cadastrado' }, { status: 409 })
  }

  const senhaHash = await bcrypt.hash(dados.senha, 12)
  const novoUsuario = await prisma.usuario.create({
    data: {
      nome: dados.nome,
      email: dados.email,
      senhaHash,
      perfil: dados.perfil as any,
      unidadeId: dados.unidadeId ?? null,
    },
    include: { unidade: true },
  })

  return NextResponse.json(novoUsuario, { status: 201 })
}
