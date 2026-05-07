import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'

const SITE_HOSTNAME = 'imoveis.cf8.com.br'

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  const hostname = req.headers.get('host') ?? ''

  // ── Site público: roteamento por hostname ──────────────────────────────────
  // Rotas /api/ e arquivos estáticos nunca são reescritos
  if (hostname === SITE_HOSTNAME || hostname.startsWith(`${SITE_HOSTNAME}:`)) {
    if (
      pathname.startsWith('/api/') ||
      pathname.match(/\.(png|jpg|jpeg|svg|ico|webp|gif|css|js|woff|woff2|ttf|otf|map)$/)
    ) {
      return NextResponse.next()
    }
    const url = req.nextUrl.clone()
    url.pathname = `/site${pathname === '/' ? '' : pathname}`
    return NextResponse.rewrite(url)
  }

  // ── Rotas do site (acesso direto em dev/preview) — sem auth ───────────────
  if (pathname.startsWith('/site')) {
    return NextResponse.next()
  }

  // ── API pública de imóveis — sem auth ─────────────────────────────────────
  if (pathname.startsWith('/api/imoveis/publico')) {
    return NextResponse.next()
  }

  // ── Rotas protegidas ───────────────────────────────────────────────────────
  const token = await getToken({ req })

  if (!token) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ erro: 'Não autorizado' }, { status: 401 })
    }
    return NextResponse.redirect(new URL('/login', req.url))
  }

  const perfil = token.perfil as string
  const acessoImob = token.acessoImob as boolean | undefined
  const acessoIncorp = token.acessoIncorp as boolean | undefined
  const isAdmin = ['MASTER', 'PROPRIETARIO'].includes(perfil)

  // Enforça 2FA para MASTER após o período de carência (24h)
  const rotasLivresDoTotp = ['/configurar-2fa', '/api/2fa', '/api/auth', '/login']
  const eRotaLivre = rotasLivresDoTotp.some(r => pathname.startsWith(r))

  if (perfil === 'MASTER' && !eRotaLivre) {
    const totpAtivado = token.totpAtivado as boolean | undefined
    const graceExpiraEm = token.totpGraceExpiraEm as string | null | undefined

    if (!totpAtivado) {
      const graceExpirou = graceExpiraEm ? Date.now() > new Date(graceExpiraEm).getTime() : false
      if (graceExpirou) {
        if (pathname.startsWith('/api/')) {
          return NextResponse.json(
            { erro: '2FA obrigatório. Configure o autenticador no portal.' },
            { status: 403 }
          )
        }
        return NextResponse.redirect(new URL('/configurar-2fa', req.url))
      }
    }
  }

  // Consentimento LGPD — obrigatório para todos os usuários autenticados
  const ROTAS_LIVRES_CONSENTIMENTO = ['/lgpd', '/api/lgpd', '/api/auth', '/api/2fa', '/login', '/configurar-2fa']
  const precisaConsentimento = !ROTAS_LIVRES_CONSENTIMENTO.some(r => pathname.startsWith(r))

  if (precisaConsentimento && !token.consentimentoEm) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ erro: 'Aceite dos termos necessário' }, { status: 403 })
    }
    return NextResponse.redirect(new URL('/lgpd/consentimento', req.url))
  }

  // Proteção do módulo de Imóveis
  if (!isAdmin && (pathname.startsWith('/imoveis') || pathname.startsWith('/api/imoveis'))) {
    if (!acessoImob) {
      if (pathname.startsWith('/api/')) {
        return NextResponse.json({ erro: 'Sem acesso ao módulo de Imóveis' }, { status: 403 })
      }
      return NextResponse.redirect(new URL('/acesso-negado', req.url))
    }
  }

  // Proteção do módulo de Incorporação
  if (!isAdmin && (pathname.startsWith('/chat') || pathname.startsWith('/api/analises'))) {
    if (!acessoIncorp) {
      if (pathname.startsWith('/api/')) {
        return NextResponse.json({ erro: 'Sem acesso ao módulo de Incorporação' }, { status: 403 })
      }
      return NextResponse.redirect(new URL('/acesso-negado', req.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon\\.ico|login|api/auth|api/2fa/preflight).*)'],
}
