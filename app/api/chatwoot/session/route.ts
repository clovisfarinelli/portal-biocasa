import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const CHATWOOT_URL = 'https://atendimento.cf8.com.br'

// Deriva o domínio pai (.cf8.com.br) para o cookie ser enviado ao iframe
function cookieDomain(url: string): string {
  const hostname = new URL(url).hostname          // 'atendimento.cf8.com.br'
  const parts = hostname.split('.')
  return parts.length > 2 ? '.' + parts.slice(1).join('.') : hostname
}

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ erro: 'Não autorizado' }, { status: 401 })

  const usuarioId = (session.user as any).id as string

  const usuario = await prisma.usuario.findUnique({
    where: { id: usuarioId },
    select: {
      chatwootToken:     true,
      chatwootAccountId: true,
    },
  })

  if (!usuario?.chatwootToken) {
    return NextResponse.json(
      { erro: 'Usuário sem acesso ao Chatwoot configurado (chatwootToken ausente)' },
      { status: 404 },
    )
  }

  // POST /auth/sign_in com user_access_token permanente (não expira)
  const signInResp = await fetch(`${CHATWOOT_URL}/auth/sign_in`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_access_token: usuario.chatwootToken }),
  })

  if (!signInResp.ok) {
    const err = await signInResp.text()
    console.error('[chatwoot/session] sign_in falhou:', signInResp.status, err)
    return NextResponse.json({ erro: 'Falha ao autenticar no Chatwoot' }, { status: 502 })
  }

  // Extrai _chatwoot_session do cabeçalho Set-Cookie
  const setCookieRaw = signInResp.headers.get('set-cookie') ?? ''
  const sessionMatch = setCookieRaw.match(/_chatwoot_session=([^;]+)/)

  const accountId = usuario.chatwootAccountId
  const iframeSrc = accountId
    ? `${CHATWOOT_URL}/app/accounts/${accountId}/conversations`
    : `${CHATWOOT_URL}/app`

  const response = NextResponse.json({ iframeSrc, accountId })

  // Re-seta o cookie com domínio pai para ser enviado pelo browser ao iframe
  if (sessionMatch) {
    const domain = cookieDomain(CHATWOOT_URL)   // '.cf8.com.br'
    response.cookies.set('_chatwoot_session', sessionMatch[1], {
      domain,
      path: '/',
      secure: true,
      sameSite: 'none',
      httpOnly: true,
    })
  } else {
    console.warn('[chatwoot/session] _chatwoot_session não encontrado no Set-Cookie da resposta')
  }

  return response
}
