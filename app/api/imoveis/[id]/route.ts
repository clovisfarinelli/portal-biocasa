import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const PERFIS_LEITURA = ['MASTER', 'PROPRIETARIO', 'ASSISTENTE', 'CORRETOR']
const PERFIS_ESCRITA = ['MASTER', 'PROPRIETARIO', 'ASSISTENTE']

async function logErro(usuarioId: string | null, mensagem: string, detalhes?: string) {
  try {
    await prisma.logErro.create({ data: { usuarioId, mensagem, detalhes } })
  } catch {}
}

async function buscarImovelAutorizado(id: string, usuarioId: string, perfil: string, unidadeId: string | null) {
  const imovel = await prisma.imovel.findUnique({ where: { id } })
  if (!imovel) return null

  if (perfil !== 'MASTER' && imovel.unidadeId !== unidadeId) return null

  return imovel
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ erro: 'Não autorizado' }, { status: 401 })

  const usuario = session.user as any

  if (!PERFIS_LEITURA.includes(usuario.perfil)) {
    return NextResponse.json({ erro: 'Acesso negado' }, { status: 403 })
  }

  const imovel = await buscarImovelAutorizado(params.id, usuario.id, usuario.perfil, usuario.unidadeId)
  if (!imovel) return NextResponse.json({ erro: 'Imóvel não encontrado' }, { status: 404 })

  const imovelCompleto = await prisma.imovel.findUnique({
    where: { id: params.id },
    include: { unidade: { select: { id: true, nome: true } } },
  })

  return NextResponse.json(imovelCompleto)
}

const schemaAtualizarImovel = z.object({
  codigoRef: z.string().optional(),
  nome: z.string().optional(),
  finalidade: z.string().optional(),
  tipo: z.string().optional(),
  subtipo: z.string().optional(),
  logradouro: z.string().optional(),
  numero: z.string().optional(),
  complemento: z.string().optional(),
  bairro: z.string().optional(),
  cidade: z.string().optional(),
  estado: z.string().optional(),
  cep: z.string().optional(),
  edificio: z.string().optional(),
  andar: z.number().int().optional(),
  acesso: z.string().optional(),
  proprietario: z.string().optional(),
  telProprietario: z.string().optional(),
  captador: z.string().optional(),
  parceria: z.boolean().optional(),
  nomeParceiro: z.string().optional(),
  modalidade: z.string().optional(),
  valorVenda: z.number().optional().nullable(),
  valorLocacao: z.number().optional().nullable(),
  valorCondominio: z.number().optional().nullable(),
  valorIptu: z.number().optional().nullable(),
  areaUtil: z.number().optional().nullable(),
  areaTotal: z.number().optional().nullable(),
  dormitorios: z.string().optional(),
  suites: z.string().optional(),
  totalBanheiros: z.string().optional(),
  vagasGaragem: z.string().optional(),
  tipoGaragem: z.string().optional(),
  situacaoImovel: z.string().optional(),
  dependencia: z.boolean().optional(),
  vistaMar: z.boolean().optional(),
  tipoVistaMar: z.string().optional(),
  facilidadesImovel: z.string().optional(),
  facilidadesImovelOutros: z.string().optional(),
  facilidadesCond: z.string().optional(),
  facilidadesCondOutros: z.string().optional(),
  aceitaPermuta: z.boolean().optional(),
  aceitaFinanc: z.boolean().optional(),
  documentacaoOk: z.boolean().optional(),
  exclusividade: z.boolean().optional(),
  publicarSite: z.boolean().optional(),
  publicarPortais: z.boolean().optional(),
  destaque: z.boolean().optional(),
  linkSite: z.string().optional(),
  linkExterno: z.string().optional(),
  codIptu: z.string().optional(),
  codMatricula: z.string().optional(),
  descricao: z.string().optional(),
  obsInternas: z.string().optional(),
  percComissao: z.number().optional().nullable(),
  situacao: z.string().optional(),
  fotos: z.string().optional().nullable(),
}).strict()

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ erro: 'Não autorizado' }, { status: 401 })

  const usuario = session.user as any

  if (!PERFIS_ESCRITA.includes(usuario.perfil)) {
    return NextResponse.json({ erro: 'Sem permissão para editar imóveis' }, { status: 403 })
  }

  const imovel = await buscarImovelAutorizado(params.id, usuario.id, usuario.perfil, usuario.unidadeId)
  if (!imovel) return NextResponse.json({ erro: 'Imóvel não encontrado' }, { status: 404 })

  let dados: z.infer<typeof schemaAtualizarImovel>
  try {
    const body = await req.json()
    dados = schemaAtualizarImovel.parse(body)
  } catch (err: any) {
    return NextResponse.json({ erro: `Dados inválidos: ${err?.message?.slice(0, 200)}` }, { status: 400 })
  }

  try {
    const atualizado = await prisma.imovel.update({
      where: { id: params.id },
      data: dados,
      include: { unidade: { select: { id: true, nome: true } } },
    })
    return NextResponse.json(atualizado)
  } catch (err: any) {
    await logErro(usuario.id, `[imoveis/${params.id}/PUT] Erro ao atualizar`, err?.message)
    return NextResponse.json({ erro: 'Erro ao atualizar imóvel' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ erro: 'Não autorizado' }, { status: 401 })

  const usuario = session.user as any

  if (usuario.perfil !== 'MASTER') {
    return NextResponse.json({ erro: 'Apenas MASTER pode excluir imóveis' }, { status: 403 })
  }

  const imovel = await prisma.imovel.findUnique({ where: { id: params.id } })
  if (!imovel) return NextResponse.json({ erro: 'Imóvel não encontrado' }, { status: 404 })

  try {
    await prisma.imovel.delete({ where: { id: params.id } })
    return NextResponse.json({ mensagem: 'Imóvel excluído com sucesso' })
  } catch (err: any) {
    await logErro(usuario.id, `[imoveis/${params.id}/DELETE] Erro ao excluir`, err?.message)
    return NextResponse.json({ erro: 'Erro ao excluir imóvel' }, { status: 500 })
  }
}
