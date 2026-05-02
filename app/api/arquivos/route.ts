import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { obterLimiteArquivo } from '@/lib/utils'
import { checarRateLimit, ipDaRequisicao, respostaLimiteExcedido } from '@/lib/rateLimit'
import { registrarLog } from '@/lib/logs'

const MAX_ARQUIVOS = 10

// GET: diagnóstico de configuração (pode remover após deploy estável)
export async function GET() {
  const token = process.env.BLOB_READ_WRITE_TOKEN ?? ''
  return NextResponse.json({
    blob_token_presente: !!token,
    blob_token_prefixo: token ? token.slice(0, 24) + '...' : 'AUSENTE',
    node_env: process.env.NODE_ENV,
  })
}

async function salvarArquivoBlob(conteudo: Buffer, pathname: string, contentType: string): Promise<string> {
  const { put } = await import('@vercel/blob')
  const blob = await put(pathname, conteudo, {
    access: 'private',           // store privado — necessário para portal-biocasa-blob
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
  const ip = ipDaRequisicao(req)
  if (!checarRateLimit(`arquivos:${ip}`, 30, 60_000)) return respostaLimiteExcedido()

  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ erro: 'Não autorizado' }, { status: 401 })

  let formData: FormData
  try {
    formData = await req.formData()
  } catch (e: any) {
    console.error('[upload] falha ao parsear formData:', e?.message)
    return NextResponse.json({ erro: 'Erro ao receber o arquivo. Tente novamente.' }, { status: 400 })
  }

  const arquivo = formData.get('arquivo') as File | null
  const analiseId = formData.get('analiseId') as string | null

  if (!arquivo || typeof arquivo === 'string') {
    return NextResponse.json({ erro: 'Nenhum arquivo foi recebido pelo servidor' }, { status: 400 })
  }

  console.log('[upload] recebido:', arquivo.name, arquivo.type, arquivo.size, 'bytes')

  const limite = obterLimiteArquivo(arquivo.type)
  if (arquivo.size > limite) {
    return NextResponse.json(
      { erro: `Arquivo muito grande. Limite: ${(limite / 1024 / 1024).toFixed(0)}MB` },
      { status: 413 }
    )
  }

  if (analiseId) {
    const quantidade = await prisma.arquivoAnalise.count({ where: { analiseId } })
    if (quantidade >= MAX_ARQUIVOS) {
      return NextResponse.json({ erro: `Limite de ${MAX_ARQUIVOS} arquivos por análise atingido` }, { status: 400 })
    }
  }

  let url: string
  try {
    const token = process.env.BLOB_READ_WRITE_TOKEN
    if (token) {
      const buffer = Buffer.from(await arquivo.arrayBuffer())
      const safeName = arquivo.name.replace(/[^a-zA-Z0-9._-]/g, '_')
      const pathname = `analises/${Date.now()}-${safeName}`
      url = await salvarArquivoBlob(buffer, pathname, arquivo.type)
      console.log('[upload] salvo no Vercel Blob (privado):', url)
    } else if (process.env.NODE_ENV === 'development') {
      url = await salvarArquivoLocal(arquivo)
      console.log('[upload] salvo localmente:', url)
    } else {
      return NextResponse.json({ erro: 'BLOB_READ_WRITE_TOKEN não configurado.' }, { status: 503 })
    }
  } catch (error: any) {
    const nome = error?.constructor?.name ?? 'Error'
    const msg: string = error?.message ?? ''
    console.error('[upload] ERRO:', nome, msg, error?.stack?.split('\n')[1])

    const erroUsuario =
      nome === 'BlobAccessError' || msg.includes('Access denied')
        ? 'Token do Vercel Blob inválido. Verifique BLOB_READ_WRITE_TOKEN.'
        : nome === 'BlobStoreNotFoundError' || msg.includes('store')
        ? 'Blob Store não encontrado. Verifique se está conectado ao projeto na Vercel.'
        : nome === 'BlobContentTypeNotAllowedError'
        ? 'Tipo de arquivo bloqueado pelo Blob Store.'
        : `Erro ao salvar (${nome}): ${msg.slice(0, 100)}`

    return NextResponse.json({ erro: erroUsuario }, { status: 500 })
  }

  const usuario = session.user as any

  if (analiseId) {
    try {
      const registro = await prisma.arquivoAnalise.create({
        data: { analiseId, tipo: arquivo.type, nomeArquivo: arquivo.name, arquivoUrl: url },
      })
      await registrarLog({
        acao: 'arquivo_enviado',
        usuarioId: usuario.id,
        detalhes: `analiseId: ${analiseId}, arquivo: ${arquivo.name}`,
        ip: ipDaRequisicao(req),
      })
      return NextResponse.json({ ...registro, nomeArquivo: arquivo.name, tipo: arquivo.type })
    } catch (dbErr: any) {
      console.error('[upload] erro ao gravar no banco:', dbErr?.message)
    }
  }

  await registrarLog({
    acao: 'arquivo_enviado',
    usuarioId: usuario.id,
    detalhes: `arquivo: ${arquivo.name}`,
    ip: ipDaRequisicao(req),
  })

  return NextResponse.json({ url, nome: arquivo.name, tipo: arquivo.type })
}
