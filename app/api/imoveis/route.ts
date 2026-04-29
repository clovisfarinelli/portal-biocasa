import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

// Perfis com acesso ao módulo de imóveis
const PERFIS_IMOVEIS = ['MASTER', 'PROPRIETARIO', 'ASSISTENTE', 'CORRETOR']
const PERFIS_ESCRITA = ['MASTER', 'PROPRIETARIO', 'ASSISTENTE']

async function autenticar(req: NextRequest) {
  // Aceita x-api-key para integração n8n (somente GET)
  const apiKey = req.headers.get('x-api-key')
  if (apiKey && apiKey === process.env.API_KEY_N8N) {
    return { tipo: 'apikey' as const }
  }

  const session = await getServerSession(authOptions)
  if (!session) return null

  const usuario = session.user as any
  return { tipo: 'session' as const, usuario }
}

async function logErro(usuarioId: string | null, mensagem: string, detalhes?: string) {
  try {
    await prisma.logErro.create({ data: { usuarioId, mensagem, detalhes } })
  } catch {}
}

const schemaFiltros = z.object({
  finalidade: z.string().optional(),
  tipo: z.string().optional(),
  cidade: z.string().optional(),
  modalidade: z.string().optional(),
  situacao: z.string().optional(),
  quartos: z.string().optional(),
  valor_min: z.string().optional(),
  valor_max: z.string().optional(),
  destaque: z.string().optional(),
  publicar_site: z.string().optional(),
  unidadeId: z.string().optional(),
  pagina: z.string().optional(),
  busca: z.string().optional(),
})

export async function GET(req: NextRequest) {
  const auth = await autenticar(req)
  if (!auth) return NextResponse.json({ erro: 'Não autorizado' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const filtrosRaw = Object.fromEntries(searchParams.entries())
  const filtros = schemaFiltros.parse(filtrosRaw)

  const pagina = parseInt(filtros.pagina ?? '1')
  const porPagina = 20
  const skip = (pagina - 1) * porPagina

  const where: any = {}

  // Restrição por unidade para usuários com sessão
  if (auth.tipo === 'session') {
    const { usuario } = auth
    if (!PERFIS_IMOVEIS.includes(usuario.perfil)) {
      return NextResponse.json({ erro: 'Acesso negado' }, { status: 403 })
    }
    if (usuario.perfil !== 'MASTER') {
      where.unidadeId = usuario.unidadeId
    }
  }

  // Filtros opcionais
  if (filtros.finalidade) where.finalidade = filtros.finalidade
  if (filtros.tipo) where.tipo = filtros.tipo
  if (filtros.cidade) where.cidade = { contains: filtros.cidade, mode: 'insensitive' }
  if (filtros.modalidade) where.modalidade = filtros.modalidade
  if (filtros.situacao) where.situacao = filtros.situacao
  if (filtros.quartos) where.dormitorios = filtros.quartos
  if (filtros.destaque === 'true') where.destaque = true
  if (filtros.publicar_site === 'true') where.publicarSite = true
  if (filtros.unidadeId && auth.tipo === 'session' && (auth.usuario as any).perfil === 'MASTER') {
    where.unidadeId = filtros.unidadeId
  }

  if (filtros.busca) {
    const b = filtros.busca
    const andBusca = {
      OR: [
        { codigoRef: { contains: b, mode: 'insensitive' as const } },
        { nome: { contains: b, mode: 'insensitive' as const } },
        { bairro: { contains: b, mode: 'insensitive' as const } },
        { proprietario: { contains: b, mode: 'insensitive' as const } },
      ],
    }
    where.AND = [andBusca]
  }

  if (filtros.valor_min || filtros.valor_max) {
    const condicaoValor = {
      OR: [
        {
          valorVenda: {
            ...(filtros.valor_min ? { gte: parseFloat(filtros.valor_min) } : {}),
            ...(filtros.valor_max ? { lte: parseFloat(filtros.valor_max) } : {}),
          },
        },
        {
          valorLocacao: {
            ...(filtros.valor_min ? { gte: parseFloat(filtros.valor_min) } : {}),
            ...(filtros.valor_max ? { lte: parseFloat(filtros.valor_max) } : {}),
          },
        },
      ],
    }
    where.AND = [...(where.AND ?? []), condicaoValor]
  }

  const [imoveis, total] = await Promise.all([
    prisma.imovel.findMany({
      where,
      orderBy: { dataCadastro: 'desc' },
      skip,
      take: porPagina,
      include: { unidade: { select: { nome: true } } },
    }),
    prisma.imovel.count({ where }),
  ])

  return NextResponse.json({ imoveis, total, pagina, porPagina })
}

const schemaCriarImovel = z.object({
  codigoRef: z.string().min(1),
  nome: z.string().optional(),
  finalidade: z.string().min(1),
  tipo: z.string().min(1),
  subtipo: z.string().optional(),
  logradouro: z.string().min(1),
  numero: z.string().optional(),
  complemento: z.string().optional(),
  bairro: z.string().min(1),
  cidade: z.string().min(1),
  estado: z.string().default('SP'),
  cep: z.string().optional(),
  edificio: z.string().optional(),
  andar: z.number().int().optional(),
  acesso: z.string().optional(),
  proprietario: z.string().optional(),
  telProprietario: z.string().optional(),
  captador: z.string().optional(),
  parceria: z.boolean().default(false),
  nomeParceiro: z.string().optional(),
  modalidade: z.string().min(1),
  valorVenda: z.number().optional(),
  valorLocacao: z.number().optional(),
  valorCondominio: z.number().optional(),
  valorIptu: z.number().optional(),
  areaUtil: z.number().optional(),
  areaTotal: z.number().optional(),
  dormitorios: z.string().optional(),
  suites: z.string().optional(),
  totalBanheiros: z.string().optional(),
  vagasGaragem: z.string().optional(),
  tipoGaragem: z.string().optional(),
  situacaoImovel: z.string().optional(),
  dependencia: z.boolean().default(false),
  vistaMar: z.boolean().default(false),
  tipoVistaMar: z.string().optional(),
  facilidadesImovel: z.string().optional(),
  facilidadesImovelOutros: z.string().optional(),
  facilidadesCond: z.string().optional(),
  facilidadesCondOutros: z.string().optional(),
  aceitaPermuta: z.boolean().default(false),
  aceitaFinanc: z.boolean().default(false),
  documentacaoOk: z.boolean().default(false),
  exclusividade: z.boolean().default(false),
  publicarSite: z.boolean().default(false),
  publicarPortais: z.boolean().default(false),
  destaque: z.boolean().default(false),
  linkSite: z.string().optional(),
  linkExterno: z.string().optional(),
  codIptu: z.string().optional(),
  codMatricula: z.string().optional(),
  descricao: z.string().optional(),
  obsInternas: z.string().optional(),
  percComissao: z.number().optional(),
  situacao: z.string().default('DISPONIVEL'),
  unidadeId: z.string().optional(),
})

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ erro: 'Não autorizado' }, { status: 401 })

  const usuario = session.user as any

  if (!PERFIS_ESCRITA.includes(usuario.perfil)) {
    return NextResponse.json({ erro: 'Sem permissão para cadastrar imóveis' }, { status: 403 })
  }

  let dados: z.infer<typeof schemaCriarImovel>
  try {
    const body = await req.json()
    dados = schemaCriarImovel.parse(body)
  } catch (err: any) {
    return NextResponse.json({ erro: `Dados inválidos: ${err?.message?.slice(0, 200)}` }, { status: 400 })
  }

  // ASSISTENTE e PROPRIETARIO sempre usam sua própria unidade
  const unidadeId =
    usuario.perfil === 'MASTER' ? (dados.unidadeId ?? usuario.unidadeId) : usuario.unidadeId

  if (!unidadeId) {
    return NextResponse.json({ erro: 'Unidade não definida' }, { status: 400 })
  }

  // Gera link_site baseado no código de referência
  const linkSite = dados.linkSite ?? `/imovel/${dados.codigoRef.toLowerCase()}`

  try {
    const imovel = await prisma.imovel.create({
      data: {
        ...dados,
        unidadeId,
        linkSite,
      },
      include: { unidade: { select: { nome: true } } },
    })
    return NextResponse.json(imovel, { status: 201 })
  } catch (err: any) {
    const msg = err?.message ?? String(err)

    if (msg.includes('Unique constraint') && msg.includes('codigoRef')) {
      return NextResponse.json({ erro: 'Código de referência já cadastrado' }, { status: 409 })
    }

    await logErro(usuario.id, '[imoveis/POST] Erro ao criar imóvel', msg)
    return NextResponse.json({ erro: 'Erro ao cadastrar imóvel' }, { status: 500 })
  }
}
