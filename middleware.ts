export { default } from 'next-auth/middleware'

export const config = {
  matcher: [
    '/chat/:path*',
    '/usuarios/:path*',
    '/treinar-ia/:path*',
    '/analises-unidades/:path*',
    '/imoveis/:path*',
    '/api/analises/:path*',
    '/api/usuarios/:path*',
    '/api/documentos/:path*',
    '/api/cidades/:path*',
    '/api/arquivos/:path*',
    '/api/configuracoes/:path*',
    '/api/unidades/:path*',
    '/api/logs-erro/:path*',
  ],
}
