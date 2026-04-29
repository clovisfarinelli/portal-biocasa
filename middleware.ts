import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'

export async function middleware(req: NextRequest) {
  const token = await getToken({ req })
  const { pathname } = req.nextUrl

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
  matcher: [
    '/chat/:path*',
    '/usuarios/:path*',
    '/treinar-ia/:path*',
    '/analises-unidades/:path*',
    '/imoveis/:path*',
    '/acesso-negado',
    '/api/analises/:path*',
    '/api/imoveis/:path*',
    '/api/usuarios/:path*',
    '/api/documentos/:path*',
    '/api/cidades/:path*',
    '/api/arquivos/:path*',
    '/api/configuracoes/:path*',
    '/api/unidades/:path*',
    '/api/logs-erro/:path*',
  ],
}
