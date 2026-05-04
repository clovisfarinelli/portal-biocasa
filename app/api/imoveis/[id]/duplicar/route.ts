import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { registrarLog } from '@/lib/logs'
import { ipDaRequisicao } from '@/lib/rateLimit'
import { gerarSlugImovel } from '@/lib/slug'

const PERFIS_ESCRITA = ['MASTER', 'PROPRIETARIO', 'ASSISTENTE']

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ erro: 'Não autorizado' }, { status: 401 })

  const usuario = session.user as any
  if (!PERFIS_ESCRITA.includes(usuario.perfil)) {
    return NextResponse.json({ erro: 'Sem permissão para duplicar imóveis' }, { status: 403 })
  }

  const original = await prisma.imovel.findUnique({ where: { id: params.id } })
  if (!original) return NextResponse.json({ erro: 'Imóvel não encontrado' }, { status: 404 })

  if (usuario.perfil !== 'MASTER' && original.unidadeId !== usuario.unidadeId) {
    return NextResponse.json({ erro: 'Sem permissão para duplicar este imóvel' }, { status: 403 })
  }

  // Gera codigoRef único com sufixo -C, -C2, -C3...
  let novoCodigoRef = `${original.codigoRef}-C`
  let sufixo = 2
  while (await prisma.imovel.findUnique({ where: { codigoRef: novoCodigoRef }, select: { id: true } })) {
    novoCodigoRef = `${original.codigoRef}-C${sufixo++}`
  }

  const novoNome = original.nome ? `${original.nome} (cópia)` : null
  const novoSlug = gerarSlugImovel(novoCodigoRef, original.tipo, original.bairro, original.cidade)

  const { id: _id, slug: _slug, fotos: _fotos, dataCadastro: _dataCadastro, ...campos } = original as any

  try {
    const novo = await prisma.imovel.create({
      data: {
        ...campos,
        codigoRef: novoCodigoRef,
        nome: novoNome,
        slug: novoSlug,
        fotos: null,
        publicarSite: false,
        publicarPortais: false,
        destaque: false,
      },
    })

    await registrarLog({
      acao: 'imovel_criado',
      recurso: 'imovel',
      usuarioId: usuario.id,
      detalhes: `duplicado de ${original.codigoRef} → ${novoCodigoRef}`,
      ip: ipDaRequisicao(req),
    })

    return NextResponse.json({ id: novo.id, codigoRef: novo.codigoRef }, { status: 201 })
  } catch (err: any) {
    return NextResponse.json({ erro: 'Erro ao duplicar imóvel' }, { status: 500 })
  }
}
