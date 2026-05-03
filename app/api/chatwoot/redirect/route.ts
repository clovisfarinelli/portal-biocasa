import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const CHATWOOT_URL = 'https://atendimento.cf8.com.br'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.redirect(new URL('/login', process.env.NEXTAUTH_URL ?? 'http://localhost:3000'))
  }

  const platformToken = process.env.CHATWOOT_PLATFORM_TOKEN
  if (!platformToken) {
    return new NextResponse('Chatwoot não configurado no servidor', { status: 503 })
  }

  const usuarioId = (session.user as any).id as string

  const usuario = await prisma.usuario.findUnique({
    where: { id: usuarioId },
    select: { chatwootUserId: true },
  })

  if (!usuario?.chatwootUserId) {
    return new NextResponse('Usuário sem acesso ao Chatwoot configurado', { status: 404 })
  }

  const resp = await fetch(
    `${CHATWOOT_URL}/platform/api/v1/users/${usuario.chatwootUserId}/login`,
    { headers: { api_access_token: platformToken } }
  )

  if (!resp.ok) {
    console.error('[chatwoot/redirect] Platform API erro:', resp.status, await resp.text())
    return new NextResponse('Falha ao gerar link de acesso', { status: 502 })
  }

  const data = await resp.json()

  if (!data.url) {
    return new NextResponse('URL SSO não retornada pela API', { status: 502 })
  }

  return NextResponse.redirect(data.url)
}
