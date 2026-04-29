import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// Proxy autenticado para fotos privadas de imóveis (Vercel Blob store privado).
// URLs private do blob não são acessíveis diretamente pelo browser —
// este endpoint busca a imagem server-side com o token e faz streaming
// para o cliente autenticado.
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ erro: 'Não autorizado' }, { status: 401 })

  const { searchParams } = req.nextUrl
  const url = searchParams.get('url')

  if (!url) {
    return NextResponse.json({ erro: 'Parâmetro url obrigatório' }, { status: 400 })
  }

  if (!url.includes('blob.vercel-storage.com')) {
    return NextResponse.json({ erro: 'URL inválida' }, { status: 400 })
  }

  const token = process.env.BLOB_READ_WRITE_TOKEN
  if (!token) {
    return NextResponse.json({ erro: 'Token de armazenamento não configurado' }, { status: 503 })
  }

  const resposta = await fetch(url, {
    headers: { authorization: `Bearer ${token}` },
  })

  if (!resposta.ok) {
    return NextResponse.json({ erro: 'Erro ao buscar imagem' }, { status: resposta.status })
  }

  const contentType = resposta.headers.get('content-type') ?? 'image/webp'

  return new NextResponse(resposta.body, {
    status: 200,
    headers: {
      'content-type': contentType,
      'cache-control': 'private, max-age=3600',
    },
  })
}
