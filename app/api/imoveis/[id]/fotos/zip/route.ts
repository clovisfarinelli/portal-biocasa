import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import JSZip from 'jszip'

const PERFIS_IMOVEIS = ['MASTER', 'PROPRIETARIO', 'ASSISTENTE', 'CORRETOR']

interface FotoItem { url: string; ordem: number; principal: boolean }

async function logErro(usuarioId: string | null, mensagem: string, detalhes?: string) {
  try {
    await prisma.logErro.create({ data: { usuarioId, mensagem, detalhes } })
  } catch {}
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ erro: 'Não autorizado' }, { status: 401 })

  const usuario = session.user as any
  if (!PERFIS_IMOVEIS.includes(usuario.perfil)) {
    return NextResponse.json({ erro: 'Acesso negado' }, { status: 403 })
  }

  const imovel = await prisma.imovel.findUnique({ where: { id: params.id } })
  if (!imovel) return NextResponse.json({ erro: 'Imóvel não encontrado' }, { status: 404 })

  if (usuario.perfil !== 'MASTER' && imovel.unidadeId !== usuario.unidadeId) {
    return NextResponse.json({ erro: 'Acesso negado' }, { status: 403 })
  }

  const fotos: FotoItem[] = imovel.fotos
    ? (() => { try { return JSON.parse(imovel.fotos) } catch { return [] } })()
    : []

  if (fotos.length === 0) {
    return NextResponse.json({ erro: 'Nenhuma foto cadastrada' }, { status: 404 })
  }

  const token = process.env.BLOB_READ_WRITE_TOKEN
  if (!token) {
    return NextResponse.json({ erro: 'Token de armazenamento não configurado' }, { status: 503 })
  }

  const zip = new JSZip()

  await Promise.all(
    fotos.map(async (foto) => {
      try {
        const res = await fetch(foto.url, {
          headers: { authorization: `Bearer ${token}` },
        })
        if (!res.ok) return
        const buffer = await res.arrayBuffer()
        zip.file(`${imovel.codigoRef}_${foto.ordem + 1}.webp`, buffer)
      } catch (err: any) {
        await logErro(usuario.id, `[imoveis/${params.id}/fotos/zip] Erro ao baixar foto`, err?.message)
      }
    })
  )

  const zipBuffer = await zip.generateAsync({ type: 'arraybuffer' })

  return new NextResponse(zipBuffer, {
    status: 200,
    headers: {
      'content-type': 'application/zip',
      'content-disposition': `attachment; filename="${imovel.codigoRef}-fotos.zip"`,
    },
  })
}
