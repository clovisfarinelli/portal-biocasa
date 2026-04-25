import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { put } from '@vercel/blob'
import { obterLimiteArquivo } from '@/lib/utils'

const MAX_ARQUIVOS = 10

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ erro: 'Não autorizado' }, { status: 401 })

  const formData = await req.formData()
  const arquivo = formData.get('arquivo') as File
  const analiseId = formData.get('analiseId') as string | null

  if (!arquivo) {
    return NextResponse.json({ erro: 'Nenhum arquivo enviado' }, { status: 400 })
  }

  // Valida tamanho
  const limite = obterLimiteArquivo(arquivo.type)
  if (arquivo.size > limite) {
    const limiteFormatado = (limite / (1024 * 1024)).toFixed(0)
    return NextResponse.json(
      { erro: `Arquivo muito grande. Limite para este tipo: ${limiteFormatado}MB` },
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

  const blob = await put(`analises/${Date.now()}-${arquivo.name}`, arquivo, {
    access: 'public',
  })

  if (analiseId) {
    const arquivoRegistro = await prisma.arquivoAnalise.create({
      data: {
        analiseId,
        tipo: arquivo.type,
        nomeArquivo: arquivo.name,
        arquivoUrl: blob.url,
      },
    })
    return NextResponse.json(arquivoRegistro)
  }

  return NextResponse.json({ url: blob.url, nome: arquivo.name, tipo: arquivo.type })
}
