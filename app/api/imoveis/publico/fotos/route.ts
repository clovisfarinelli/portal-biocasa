import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get('url')
  if (!url) return NextResponse.json({ erro: 'URL ausente' }, { status: 400 })

  const token = process.env.BLOB_READ_WRITE_TOKEN
  if (!token) return NextResponse.json({ erro: 'Configuração ausente' }, { status: 500 })

  try {
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } })
    if (!res.ok) return new NextResponse(null, { status: 404 })

    const contentType = res.headers.get('content-type') ?? 'image/webp'
    const buffer = await res.arrayBuffer()

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=3600',
      },
    })
  } catch {
    return new NextResponse(null, { status: 500 })
  }
}
