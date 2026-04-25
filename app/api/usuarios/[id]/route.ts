import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { z } from 'zod'

const schemaAtualizar = z.object({
  nome: z.string().min(2).optional(),
  email: z.string().email().optional(),
  senha: z.string().min(8).optional(),
  perfil: z.enum(['MASTER', 'PROPRIETARIO', 'ESPECIALISTA']).optional(),
  unidadeId: z.string().optional(),
  ativo: z.boolean().optional(),
})

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ erro: 'Não autorizado' }, { status: 401 })

  const operador = session.user as any
  if (operador.perfil === 'ESPECIALISTA') {
    return NextResponse.json({ erro: 'Acesso negado' }, { status: 403 })
  }

  const body = await req.json()
  const dados = schemaAtualizar.parse(body)

  const data: any = { ...dados }
  if (dados.senha) {
    data.senhaHash = await bcrypt.hash(dados.senha, 12)
    delete data.senha
  }

  const usuario = await prisma.usuario.update({
    where: { id: params.id },
    data,
    include: { unidade: true },
  })

  return NextResponse.json(usuario)
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ erro: 'Não autorizado' }, { status: 401 })

  const operador = session.user as any
  if (operador.perfil === 'ESPECIALISTA') {
    return NextResponse.json({ erro: 'Acesso negado' }, { status: 403 })
  }

  // Não pode deletar a si mesmo
  if (operador.id === params.id) {
    return NextResponse.json({ erro: 'Não é possível excluir sua própria conta' }, { status: 400 })
  }

  await prisma.usuario.update({
    where: { id: params.id },
    data: { ativo: false },
  })

  return NextResponse.json({ ok: true })
}
