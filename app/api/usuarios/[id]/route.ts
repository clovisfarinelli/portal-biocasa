import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { desassociarUsuarioChatwoot, atualizarSenhaChatwoot } from '@/lib/chatwoot'
import { registrarLog } from '@/lib/logs'
import { ipDaRequisicao } from '@/lib/rateLimit'

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

  // Sincronizar nova senha com Chatwoot se o usuário tiver conta lá
  if (dados.senha && usuario.chatwootUserId) {
    await atualizarSenhaChatwoot(usuario.chatwootUserId, dados.senha).catch(
      err => console.error('[patch usuario] sync senha chatwoot falhou:', err)
    )
  }

  // Log de reativação
  if (dados.ativo === true) {
    await registrarLog({
      acao: 'usuario_reativado',
      recurso: 'usuario',
      usuarioId: operador.id,
      detalhes: `alvoId: ${params.id}, nome: ${usuario.nome}`,
      ip: ipDaRequisicao(req),
    })
  }

  return NextResponse.json(usuario)
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ erro: 'Não autorizado' }, { status: 401 })

  const operador = session.user as any
  if (operador.perfil !== 'MASTER') {
    return NextResponse.json({ erro: 'Acesso negado' }, { status: 403 })
  }

  if (operador.id === params.id) {
    return NextResponse.json({ erro: 'Não é possível desativar sua própria conta' }, { status: 400 })
  }

  const alvo = await prisma.usuario.findUnique({
    where: { id: params.id },
    select: { perfil: true, chatwootUserId: true, chatwootAccountId: true, nome: true },
  })

  if (!alvo) return NextResponse.json({ erro: 'Usuário não encontrado' }, { status: 404 })

  if (alvo.perfil === 'MASTER') {
    return NextResponse.json({ erro: 'Não é possível desativar outro usuário MASTER' }, { status: 403 })
  }

  await prisma.usuario.update({ where: { id: params.id }, data: { ativo: false } })

  if (alvo.chatwootUserId) {
    await desassociarUsuarioChatwoot(
      alvo.chatwootUserId,
      alvo.chatwootAccountId ?? undefined,
    ).catch(err => console.error('[desativar] chatwoot falhou:', err))
  }

  await registrarLog({
    acao: 'usuario_desativado',
    usuarioId: operador.id,
    detalhes: `alvoId: ${params.id}, nome: ${alvo.nome}`,
    ip: ipDaRequisicao(req),
  })

  return NextResponse.json({ ok: true })
}
