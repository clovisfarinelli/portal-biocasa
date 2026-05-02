import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ erro: 'Não autorizado' }, { status: 401 })

  const usuarioId = (session.user as any).id as string

  const usuario = await prisma.usuario.findUnique({
    where: { id: usuarioId },
    select: {
      chatwootUserId:    true,
      chatwootAccountId: true,
      chatwootToken:     true,
    },
  })

  if (!usuario?.chatwootToken) {
    console.log('[chatwoot/token] usuário sem token configurado:', (session.user as any).email)
    return NextResponse.json({ erro: 'Usuário sem acesso ao Chatwoot configurado' }, { status: 404 })
  }

  console.log('[chatwoot/token] email:', (session.user as any).email)
  console.log('[chatwoot/token] token (4 chars):', usuario.chatwootToken.slice(0, 4))
  console.log('[chatwoot/token] accountId:', usuario.chatwootAccountId)

  return NextResponse.json({
    chatwootUserId:    usuario.chatwootUserId,
    chatwootAccountId: usuario.chatwootAccountId,
    chatwootToken:     usuario.chatwootToken,
  })
}
