import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Proxy autenticado para arquivos privados do Vercel Blob.
// Private blob URLs (*.private.blob.vercel-storage.com) não são
// acessíveis diretamente pelo browser — este endpoint busca o arquivo
// usando o token server-side e faz streaming para o cliente autenticado.
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ erro: 'Não autorizado' }, { status: 401 })

  const { searchParams } = req.nextUrl
  const arquivoId = searchParams.get('id')
  const urlDireta = searchParams.get('url')

  let blobUrl: string

  if (arquivoId) {
    const registro = await prisma.arquivoAnalise.findUnique({ where: { id: arquivoId } })
    if (!registro) return NextResponse.json({ erro: 'Arquivo não encontrado' }, { status: 404 })

    // Verifica se o usuário tem acesso à análise deste arquivo
    const analise = await prisma.analise.findUnique({ where: { id: registro.analiseId } })
    if (!analise) return NextResponse.json({ erro: 'Análise não encontrada' }, { status: 404 })

    const perfil = (session.user as any).perfil as string
    const usuarioId = (session.user as any).id as string
    const unidadeId = (session.user as any).unidadeId as string

    if (perfil !== 'MASTER' && analise.unidadeId !== unidadeId) {
      return NextResponse.json({ erro: 'Acesso negado' }, { status: 403 })
    }

    blobUrl = registro.arquivoUrl
  } else if (urlDireta) {
    // Apenas permite URLs do Vercel Blob do próprio projeto
    if (!urlDireta.includes('blob.vercel-storage.com')) {
      return NextResponse.json({ erro: 'URL inválida' }, { status: 400 })
    }
    blobUrl = urlDireta
  } else {
    return NextResponse.json({ erro: 'Parâmetro id ou url obrigatório' }, { status: 400 })
  }

  const token = process.env.BLOB_READ_WRITE_TOKEN
  if (!token) return NextResponse.json({ erro: 'Token não configurado' }, { status: 503 })

  const resposta = await fetch(blobUrl, {
    headers: { authorization: `Bearer ${token}` },
  })

  if (!resposta.ok) {
    return NextResponse.json({ erro: 'Erro ao buscar arquivo' }, { status: resposta.status })
  }

  const contentType = resposta.headers.get('content-type') ?? 'application/octet-stream'
  const contentDisposition = resposta.headers.get('content-disposition')
  const headers: Record<string, string> = { 'content-type': contentType }
  if (contentDisposition) headers['content-disposition'] = contentDisposition

  return new NextResponse(resposta.body, { status: 200, headers })
}
