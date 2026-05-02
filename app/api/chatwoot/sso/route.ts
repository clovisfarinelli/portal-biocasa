import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const CHATWOOT_URL = 'https://atendimento.cf8.com.br'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ erro: 'Não autorizado' }, { status: 401 })

  const platformToken = process.env.CHATWOOT_PLATFORM_TOKEN
  if (!platformToken) {
    return NextResponse.json({ erro: 'Chatwoot não configurado no servidor' }, { status: 503 })
  }

  const usuarioId = (session.user as any).id as string

  const usuario = await prisma.usuario.findUnique({
    where: { id: usuarioId },
    select: { chatwootUserId: true, chatwootAccountId: true },
  })

  if (!usuario?.chatwootUserId) {
    return NextResponse.json({ erro: 'Usuário sem acesso ao Chatwoot configurado' }, { status: 404 })
  }

  const resp = await fetch(
    `${CHATWOOT_URL}/platform/api/v1/users/${usuario.chatwootUserId}/login`,
    { headers: { api_access_token: platformToken } }
  )

  if (!resp.ok) {
    const err = await resp.text()
    console.error('[chatwoot/sso] Platform API erro:', resp.status, err)
    return NextResponse.json({ erro: 'Falha ao gerar link de acesso' }, { status: 502 })
  }

  const data = await resp.json()

  if (!data.url) {
    return NextResponse.json({ erro: 'URL SSO não retornada pela API' }, { status: 502 })
  }

  return NextResponse.json({
    url: data.url,
    chatwootAccountId: usuario.chatwootAccountId,
  })
}
