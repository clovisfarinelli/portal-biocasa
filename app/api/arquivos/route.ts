import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { obterLimiteArquivo } from '@/lib/utils'

const MAX_ARQUIVOS = 10

// GET: diagnóstico de configuração (remover após resolver o problema)
export async function GET() {
  const token = process.env.BLOB_READ_WRITE_TOKEN ?? ''
  return NextResponse.json({
    blob_token_presente: !!token,
    blob_token_prefixo: token ? token.slice(0, 20) + '...' : 'AUSENTE',
    node_env: process.env.NODE_ENV,
    runtime: 'nodejs',
  })
}

async function salvarArquivoBlob(
  conteudo: Buffer,
  pathname: string,
  contentType: string
): Promise<string> {
  const { put } = await import('@vercel/blob')
  const blob = await put(pathname, conteudo, {
    access: 'public',
    contentType: contentType || 'application/octet-stream',
    addRandomSuffix: false,
  })
  return blob.url
}

async function salvarArquivoLocal(arquivo: File): Promise<string> {
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

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ erro: 'Não autorizado' }, { status: 401 })

  // ── Parse do multipart ──────────────────────────────────────────────────
  let formData: FormData
  try {
    formData = await req.formData()
  } catch (e: any) {
    console.error('[upload] falha ao parsear formData:', e?.message)
    return NextResponse.json(
      { erro: 'Erro ao receber o arquivo. Verifique o tamanho e tente novamente.' },
      { status: 400 }
    )
  }

  const arquivo = formData.get('arquivo') as File | null
  const analiseId = formData.get('analiseId') as string | null

  if (!arquivo || typeof arquivo === 'string') {
    return NextResponse.json({ erro: 'Nenhum arquivo foi recebido pelo servidor' }, { status: 400 })
  }

  console.log('[upload] recebido:', arquivo.name, arquivo.type, arquivo.size, 'bytes')

  // ── Validação de tamanho ────────────────────────────────────────────────
  const limite = obterLimiteArquivo(arquivo.type)
  if (arquivo.size > limite) {
    const limMB = (limite / (1024 * 1024)).toFixed(0)
    return NextResponse.json(
      { erro: `Arquivo muito grande. Limite para este tipo: ${limMB}MB` },
      { status: 413 }
    )
  }

  // ── Limite de arquivos por análise ──────────────────────────────────────
  if (analiseId) {
    const quantidade = await prisma.arquivoAnalise.count({ where: { analiseId } })
    if (quantidade >= MAX_ARQUIVOS) {
      return NextResponse.json(
        { erro: `Limite de ${MAX_ARQUIVOS} arquivos por análise atingido` },
        { status: 400 }
      )
    }
  }

  // ── Salva o arquivo ─────────────────────────────────────────────────────
  let url: string
  try {
    const token = process.env.BLOB_READ_WRITE_TOKEN

    if (token) {
      // Converte para Buffer — mais compatível que passar File diretamente
      const buffer = Buffer.from(await arquivo.arrayBuffer())
      const safeName = arquivo.name.replace(/[^a-zA-Z0-9._-]/g, '_')
      const pathname = `analises/${Date.now()}-${safeName}`
      url = await salvarArquivoBlob(buffer, pathname, arquivo.type)
      console.log('[upload] salvo no Vercel Blob:', url)
    } else if (process.env.NODE_ENV === 'development') {
      url = await salvarArquivoLocal(arquivo)
      console.log('[upload] salvo localmente:', url)
    } else {
      return NextResponse.json(
        { erro: 'BLOB_READ_WRITE_TOKEN não configurado nas variáveis de ambiente da Vercel.' },
        { status: 503 }
      )
    }
  } catch (error: any) {
    // Loga o erro COMPLETO para aparecer nos logs da Vercel
    console.error('[upload] ERRO AO SALVAR:', {
      nome: error?.constructor?.name,
      mensagem: error?.message,
      codigo: error?.code,
      status: error?.status,
      stack: error?.stack?.split('\n').slice(0, 5).join(' | '),
    })

    // Retorna o erro real para facilitar o diagnóstico
    const mensagemErro = process.env.NODE_ENV === 'development'
      ? `[DEV] ${error?.constructor?.name}: ${error?.message}`
      : formatarErroBlobParaUsuario(error)

    return NextResponse.json({ erro: mensagemErro }, { status: 500 })
  }

  // ── Registra no banco se há analiseId ───────────────────────────────────
  if (analiseId) {
    try {
      const registro = await prisma.arquivoAnalise.create({
        data: {
          analiseId,
          tipo: arquivo.type,
          nomeArquivo: arquivo.name,
          arquivoUrl: url,
        },
      })
      return NextResponse.json(registro)
    } catch (dbErr: any) {
      console.error('[upload] erro ao registrar no banco:', dbErr?.message)
      // Arquivo já foi salvo no blob, retorna a URL mesmo assim
      return NextResponse.json({ url, nome: arquivo.name, tipo: arquivo.type })
    }
  }

  return NextResponse.json({ url, nome: arquivo.name, tipo: arquivo.type })
}

function formatarErroBlobParaUsuario(error: any): string {
  const nome = error?.constructor?.name ?? ''
  const msg: string = error?.message ?? ''

  if (nome === 'BlobAccessError' || msg.includes('Access denied') || msg.includes('valid token')) {
    return 'Token do Vercel Blob inválido ou expirado. Verifique a variável BLOB_READ_WRITE_TOKEN.'
  }
  if (nome === 'BlobStoreNotFoundError' || msg.includes('store')) {
    return 'Blob Store não encontrado. Verifique se o store foi criado na Vercel e está ativo.'
  }
  if (nome === 'BlobContentTypeNotAllowedError' || msg.includes('contentType')) {
    return 'Tipo de arquivo não permitido pelo Blob Store.'
  }
  if (nome === 'BlobFileTooLargeError' || msg.includes('too large')) {
    return 'Arquivo excede o limite máximo do Vercel Blob.'
  }
  if (nome === 'BlobPathnameMismatchError') {
    return 'Erro de configuração do pathname. Contate o suporte.'
  }
  if (nome === 'BlobUnknownError') {
    return `Erro desconhecido no Vercel Blob: ${msg.slice(0, 100)}`
  }
  return `Erro ao salvar arquivo: ${msg.slice(0, 150)}`
}
