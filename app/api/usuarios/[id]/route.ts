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
  perfil: z.enum(['MASTER', 'PROPRIETARIO', 'ESPECIALISTA', 'ASSISTENTE', 'CORRETOR']).optional(),
  unidadeId: z.string().optional(),
  ativo: z.boolean().optional(),
  acessoImob: z.boolean().optional(),
  acessoIncorp: z.boolean().optional(),
})

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ erro: 'Não autorizado' }, { status: 401 })

  const operador = session.user as any
  if (['ESPECIALISTA', 'ASSISTENTE', 'CORRETOR'].includes(operador.perfil)) {
    return NextResponse.json({ erro: 'Acesso negado' }, { status: 403 })
  }

  // PROPRIETARIO só pode editar usuários da sua unidade
  if (operador.perfil === 'PROPRIETARIO') {
    const alvo = await prisma.usuario.findUnique({ where: { id: params.id }, select: { unidadeId: true } })
    if (!alvo || alvo.unidadeId !== operador.unidadeId) {
      return NextResponse.json({ erro: 'Acesso negado' }, { status: 403 })
    }
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
  if (['ESPECIALISTA', 'ASSISTENTE', 'CORRETOR'].includes(operador.perfil)) {
    return NextResponse.json({ erro: 'Acesso negado' }, { status: 403 })
  }

  // PROPRIETARIO só pode desativar usuários da sua unidade
  if (operador.perfil === 'PROPRIETARIO') {
    const alvo = await prisma.usuario.findUnique({ where: { id: params.id }, select: { unidadeId: true } })
    if (!alvo || alvo.unidadeId !== operador.unidadeId) {
      return NextResponse.json({ erro: 'Acesso negado' }, { status: 403 })
    }
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
