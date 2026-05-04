import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { criarUsuarioChatwoot, atualizarSenhaChatwoot } from '@/lib/chatwoot'

const schema = z.object({
  token: z.string().uuid(),
  senha: z.string().min(8),
})

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { token, senha } = schema.parse(body)

  const usuario = await prisma.usuario.findUnique({
    where: { conviteToken: token },
    select: { id: true, nome: true, email: true, perfil: true, conviteExpiraEm: true, chatwootUserId: true },
  })

  if (!usuario) {
    return NextResponse.json({ erro: 'Convite inválido ou já utilizado' }, { status: 404 })
  }

  if (usuario.conviteExpiraEm && usuario.conviteExpiraEm < new Date()) {
    return NextResponse.json({ erro: 'Este convite expirou. Solicite um novo ao administrador.' }, { status: 410 })
  }

  const senhaHash = await bcrypt.hash(senha, 12)

  await prisma.usuario.update({
    where: { id: usuario.id },
    data: {
      senhaHash,
      ativo: true,
      conviteToken: null,
      conviteExpiraEm: null,
    },
  })

  // Chatwoot: criar conta se ainda não existir, depois sincronizar senha
  let chatwootUserId = usuario.chatwootUserId ?? null

  if (!chatwootUserId) {
    const cwDados = await criarUsuarioChatwoot(usuario.nome, usuario.email, usuario.perfil)
    if (cwDados) {
      await prisma.usuario.update({ where: { id: usuario.id }, data: cwDados })
      chatwootUserId = cwDados.chatwootUserId
    }
  }

  if (chatwootUserId) {
    await atualizarSenhaChatwoot(chatwootUserId, senha).catch(
      err => console.error('[convite/aceitar] sync senha chatwoot falhou:', err)
    )
  }

  return NextResponse.json({ ok: true, email: usuario.email })
}
