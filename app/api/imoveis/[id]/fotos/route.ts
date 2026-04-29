import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { put, del } from '@vercel/blob'
import sharp from 'sharp'

const PERFIS_ESCRITA = ['MASTER', 'PROPRIETARIO', 'ASSISTENTE']

interface FotoItem {
  url: string
  ordem: number
  principal: boolean
}

async function logErro(usuarioId: string | null, mensagem: string, detalhes?: string) {
  try {
    await prisma.logErro.create({ data: { usuarioId, mensagem, detalhes } })
  } catch {}
}

function parseFotos(fotosJson: string | null): FotoItem[] {
  if (!fotosJson) return []
  try {
    return JSON.parse(fotosJson)
  } catch {
    return []
  }
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ erro: 'Não autorizado' }, { status: 401 })

  const usuario = session.user as any

  if (!PERFIS_ESCRITA.includes(usuario.perfil)) {
    return NextResponse.json({ erro: 'Sem permissão para adicionar fotos' }, { status: 403 })
  }

  const imovel = await prisma.imovel.findUnique({ where: { id: params.id } })
  if (!imovel) return NextResponse.json({ erro: 'Imóvel não encontrado' }, { status: 404 })

  if (usuario.perfil !== 'MASTER' && imovel.unidadeId !== usuario.unidadeId) {
    return NextResponse.json({ erro: 'Acesso negado' }, { status: 403 })
  }

  let formData: FormData
  try {
    formData = await req.formData()
  } catch {
    return NextResponse.json({ erro: 'Erro ao ler o arquivo enviado' }, { status: 400 })
  }

  const arquivo = formData.get('foto') as File | null
  if (!arquivo) return NextResponse.json({ erro: 'Nenhum arquivo enviado (campo "foto")' }, { status: 400 })

  if (!arquivo.type.startsWith('image/')) {
    return NextResponse.json({ erro: 'Apenas imagens são aceitas' }, { status: 400 })
  }

  try {
    const buffer = Buffer.from(await arquivo.arrayBuffer())

    // Comprime para WebP 1920px max, qualidade 80
    const webpBuffer = await sharp(buffer)
      .resize(1920, 1920, { fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 80 })
      .toBuffer()

    const nomeArquivo = `imoveis/${params.id}/${Date.now()}.webp`
    const blob = await put(nomeArquivo, webpBuffer, {
      access: 'public',
      contentType: 'image/webp',
    })

    const fotos = parseFotos(imovel.fotos)
    const novaFoto: FotoItem = {
      url: blob.url,
      ordem: fotos.length,
      principal: fotos.length === 0,
    }
    fotos.push(novaFoto)

    await prisma.imovel.update({
      where: { id: params.id },
      data: { fotos: JSON.stringify(fotos) },
    })

    return NextResponse.json({ foto: novaFoto, fotos }, { status: 201 })
  } catch (err: any) {
    await logErro(usuario.id, `[imoveis/${params.id}/fotos/POST] Erro no upload`, err?.message)
    return NextResponse.json({ erro: 'Erro ao fazer upload da foto' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ erro: 'Não autorizado' }, { status: 401 })

  const usuario = session.user as any

  if (!PERFIS_ESCRITA.includes(usuario.perfil)) {
    return NextResponse.json({ erro: 'Sem permissão para remover fotos' }, { status: 403 })
  }

  const imovel = await prisma.imovel.findUnique({ where: { id: params.id } })
  if (!imovel) return NextResponse.json({ erro: 'Imóvel não encontrado' }, { status: 404 })

  if (usuario.perfil !== 'MASTER' && imovel.unidadeId !== usuario.unidadeId) {
    return NextResponse.json({ erro: 'Acesso negado' }, { status: 403 })
  }

  const body = await req.json().catch(() => ({}))
  const urlFoto: string = body?.url
  if (!urlFoto) return NextResponse.json({ erro: 'Campo "url" obrigatório' }, { status: 400 })

  const fotos = parseFotos(imovel.fotos)
  const index = fotos.findIndex((f) => f.url === urlFoto)
  if (index === -1) return NextResponse.json({ erro: 'Foto não encontrada neste imóvel' }, { status: 404 })

  try {
    await del(urlFoto)
  } catch (err: any) {
    // Se o arquivo não existe no Blob, continua para remover do JSON mesmo assim
    await logErro(usuario.id, `[imoveis/${params.id}/fotos/DELETE] Erro ao remover do Blob`, err?.message)
  }

  const fotosAtualizadas = fotos.filter((_, i) => i !== index)

  // Se a foto removida era principal, promove a primeira da lista
  if (fotos[index].principal && fotosAtualizadas.length > 0) {
    fotosAtualizadas[0].principal = true
  }

  // Renumera ordens
  fotosAtualizadas.forEach((f, i) => { f.ordem = i })

  await prisma.imovel.update({
    where: { id: params.id },
    data: { fotos: fotosAtualizadas.length > 0 ? JSON.stringify(fotosAtualizadas) : null },
  })

  return NextResponse.json({ fotos: fotosAtualizadas })
}
