import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { obterLimiteArquivo } from '@/lib/utils'

const MAX_ARQUIVOS = 10

async function salvarArquivo(arquivo: File): Promise<string> {
  // Em produção usa Vercel Blob
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const { put } = await import('@vercel/blob')
    const blob = await put(`analises/${Date.now()}-${arquivo.name}`, arquivo, { access: 'public' })
    return blob.url
  }

  // Em desenvolvimento salva no filesystem local (public/uploads/)
  if (process.env.NODE_ENV === 'development') {
    const { writeFile, mkdir } = await import('fs/promises')
    const path = await import('path')
    const uploadDir = path.join(process.cwd(), 'public', 'uploads')
    await mkdir(uploadDir, { recursive: true })
    const safeName = arquivo.name.replace(/[^a-zA-Z0-9._-]/g, '_')
    const filename = `${Date.now()}-${safeName}`
    const buffer = Buffer.from(await arquivo.arrayBuffer())
    await writeFile(path.join(uploadDir, filename), buffer)
    return `/uploads/${filename}`
  }

  throw new Error(
    'BLOB_READ_WRITE_TOKEN não configurado. Adicione esta variável de ambiente na Vercel.'
  )
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ erro: 'Não autorizado' }, { status: 401 })

  let formData: FormData
  try {
    formData = await req.formData()
  } catch {
    return NextResponse.json({ erro: 'Erro ao processar o formulário enviado' }, { status: 400 })
  }

  const arquivo = formData.get('arquivo') as File | null
  const analiseId = formData.get('analiseId') as string | null

  if (!arquivo || typeof arquivo === 'string') {
    return NextResponse.json({ erro: 'Nenhum arquivo enviado' }, { status: 400 })
  }

  // Valida tamanho antes de qualquer I/O
  const limite = obterLimiteArquivo(arquivo.type)
  if (arquivo.size > limite) {
    const limMB = (limite / (1024 * 1024)).toFixed(0)
    return NextResponse.json(
      { erro: `Arquivo muito grande. Limite para este tipo: ${limMB}MB` },
      { status: 413 }
    )
  }

  // Verifica limite de arquivos por análise
  if (analiseId) {
    const quantidade = await prisma.arquivoAnalise.count({ where: { analiseId } })
    if (quantidade >= MAX_ARQUIVOS) {
      return NextResponse.json(
        { erro: `Limite de ${MAX_ARQUIVOS} arquivos por análise atingido` },
        { status: 400 }
      )
    }
  }

  try {
    const url = await salvarArquivo(arquivo)

    if (analiseId) {
      const registro = await prisma.arquivoAnalise.create({
        data: {
          analiseId,
          tipo: arquivo.type,
          nomeArquivo: arquivo.name,
          arquivoUrl: url,
        },
      })
      return NextResponse.json(registro)
    }

    return NextResponse.json({ url, nome: arquivo.name, tipo: arquivo.type })
  } catch (error: any) {
    console.error('[upload] erro:', error?.message)
    return NextResponse.json(
      { erro: error?.message?.includes('BLOB_READ_WRITE_TOKEN')
          ? 'Armazenamento não configurado. Contate o administrador.'
          : 'Erro ao salvar arquivo. Tente novamente.' },
      { status: 500 }
    )
  }
}
