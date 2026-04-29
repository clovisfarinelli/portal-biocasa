import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { put } from '@vercel/blob'
import { z } from 'zod'

const schemaDocumento = z.object({
  titulo: z.string().min(2),
  tipo: z.enum(['PLANO_DIRETOR', 'ZONEAMENTO', 'CUSTOS', 'MERCADO', 'DIRETRIZES_BIOCASA', 'OUTRO']),
  categoria: z.enum(['GLOBAL', 'CIDADE']),
  cidadeId: z.string().optional(),
  conteudoTexto: z.string().optional(),
  arquivoUrl: z.string().optional(),
})

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ erro: 'Não autorizado' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const cidadeId = searchParams.get('cidadeId')
  const categoria = searchParams.get('categoria') as 'GLOBAL' | 'CIDADE' | null

  const documentos = await prisma.documentoIa.findMany({
    where: {
      ...(cidadeId ? { cidadeId } : {}),
      ...(categoria ? { categoria } : {}),
    },
    include: { cidade: { select: { nome: true } } },
    orderBy: { criadoEm: 'desc' },
  })

  return NextResponse.json(documentos)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ erro: 'Não autorizado' }, { status: 401 })

  const usuario = session.user as any
  if (usuario.perfil !== 'MASTER') {
    return NextResponse.json({ erro: 'Apenas MASTER pode adicionar documentos de treinamento' }, { status: 403 })
  }

  const contentType = req.headers.get('content-type') ?? ''

  let dados: z.infer<typeof schemaDocumento>
  let arquivoUrl: string | undefined

  if (contentType.includes('multipart/form-data')) {
    const formData = await req.formData()
    const arquivo = formData.get('arquivo') as File | null

    dados = schemaDocumento.parse({
      titulo: formData.get('titulo'),
      tipo: formData.get('tipo'),
      categoria: formData.get('categoria'),
      cidadeId: formData.get('cidadeId') ?? undefined,
    })

    if (arquivo) {
      const blob = await put(`documentos-ia/${Date.now()}-${arquivo.name}`, arquivo, {
        access: 'private',
      })
      arquivoUrl = blob.url

      // Extrai texto de TXT/CSV simples
      if (arquivo.type === 'text/plain' || arquivo.type === 'text/csv') {
        dados.conteudoTexto = await arquivo.text()
      }
    }
  } else {
    const body = await req.json()
    dados = schemaDocumento.parse(body)
  }

  const documento = await prisma.documentoIa.create({
    data: {
      titulo: dados.titulo,
      tipo: dados.tipo as any,
      categoria: dados.categoria as any,
      cidadeId: dados.cidadeId ?? null,
      arquivoUrl: arquivoUrl ?? dados.arquivoUrl ?? null,
      conteudoTexto: dados.conteudoTexto ?? null,
    },
  })

  return NextResponse.json(documento, { status: 201 })
}
