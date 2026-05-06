import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect, notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import GaleriaFotos from '@/components/imoveis/GaleriaFotos'
import CopiarTextoButton from '@/components/imoveis/CopiarTextoButton'
import CompartilharButton from '@/components/imoveis/CompartilharButton'
import DuplicarButton from '@/components/imoveis/DuplicarButton'
import { formatarMoeda, parsearOutrosArray } from '@/lib/utils'

const LABEL_TIPO: Record<string, string> = {
  CASA: 'Casa', APARTAMENTO: 'Apartamento', TERRENO: 'Terreno', CHACARA: 'Chácara',
  SALA: 'Sala', LOJA: 'Loja', CASA_COMERCIAL: 'Casa Comercial', GALPAO: 'Galpão',
}
const LABEL_SUBTIPO: Record<string, string> = {
  ISOLADA: 'Isolada', SOBRADO: 'Sobrado', SOBREPOSTA_ALTA: 'Sobreposta Alta',
  SOBREPOSTA_BAIXA: 'Sobreposta Baixa', VILLAGGIO: 'Villaggio',
  KITNET_STUDIO: 'Kitnet/Studio', KITNET: 'Kitnet/Studio', STUDIO: 'Kitnet/Studio',
  PADRAO: 'Padrão', TERREO: 'Térreo',
}
const LABEL_DORMITORIOS: Record<string, string> = {
  KIT_STUDIO: 'Kit/Studio', '1': '1', '2': '2', '3': '3', '4_MAIS': '4+',
}
const LABEL_SUITES: Record<string, string> = {
  NAO_TEM: 'Não tem', '1': '1', '2': '2', '3_MAIS': '3+',
}
const LABEL_VAGAS: Record<string, string> = {
  SEM_VAGA: 'Sem vaga', '1': '1', '2': '2', '3_MAIS': '3+', MOTOS: 'Motos',
}
const LABEL_GARAGEM: Record<string, string> = {
  FECHADA: 'Fechada', DEMARCADA: 'Demarcada',
  COLETIVA_SUF: 'Coletiva Suf.', COLETIVA_INSUF: 'Coletiva Insuf.',
}
const LABEL_SITUACAO_IMOVEL: Record<string, string> = {
  MOBILIADO: 'Mobiliado', SEMI_MOBILIADO: 'Semi-Mobiliado', SEM_MOBILIA: 'Sem Mobília',
  EM_REFORMA: 'Em Reforma', NA_PLANTA: 'Na Planta',
}
const LABEL_ACESSO: Record<string, string> = {
  ELEVADOR: 'Elevador', ESCADAS: 'Escadas', RAMPA: 'Rampa', TERREO: 'Térreo',
}

// ─── Helpers de apresentação ─────────────────────────────────────────────────

function Campo({ label, valor }: { label: string; valor?: string | null }) {
  return (
    <div>
      <p className="text-[11px] text-white/50 mb-0.5 uppercase tracking-wide">{label}</p>
      <p className="text-white text-sm">{valor || '—'}</p>
    </div>
  )
}

function BadgeBool({ value, label }: { value: boolean | null | undefined; label: string }) {
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium border ${
      value
        ? 'bg-green-900/40 text-green-300 border-green-700/50'
        : 'bg-escuro-600 text-white/30 border-escuro-500'
    }`}>
      {value ? '✓' : '—'}&nbsp;{label}
    </span>
  )
}

function Chip({ label, ativo }: { label: string; ativo: boolean }) {
  return (
    <span className={`px-2.5 py-1 rounded-full text-xs border ${
      ativo
        ? 'bg-dourado-400/20 text-dourado-400 border-dourado-400/40'
        : 'bg-escuro-600/50 text-white/20 border-escuro-500/50'
    }`}>
      {label}
    </span>
  )
}

function SecTitle({ n, title }: { n?: number; title: string }) {
  return (
    <h3 className="text-xs font-bold text-dourado-400 uppercase tracking-wider border-b border-escuro-400 pb-2 mb-4">
      {n ? `${n}. ` : ''}{title}
    </h3>
  )
}

function BadgeSituacao({ situacao }: { situacao: string }) {
  const cores: Record<string, string> = {
    DISPONIVEL: 'bg-green-900/40 text-green-300 border-green-700/50',
    VENDIDO: 'bg-red-900/40 text-red-300 border-red-700/50',
    ALUGADO: 'bg-blue-900/40 text-blue-300 border-blue-700/50',
  }
  const labels: Record<string, string> = { DISPONIVEL: 'Disponível', VENDIDO: 'Vendido', ALUGADO: 'Alugado' }
  return (
    <span className={`text-sm font-semibold px-3 py-1 rounded-lg border ${cores[situacao] ?? ''}`}>
      {labels[situacao] ?? situacao}
    </span>
  )
}

// ─── Página ──────────────────────────────────────────────────────────────────

export default async function VisualizarImovelPage({
  params,
  searchParams,
}: {
  params: { id: string }
  searchParams: { voltar?: string }
}) {
  const session = await getServerSession(authOptions)
  const usuario = session?.user as any
  const perfil = usuario?.perfil as string

  const perfisPermitidos = ['MASTER', 'PROPRIETARIO', 'ASSISTENTE', 'CORRETOR']
  if (!perfisPermitidos.includes(perfil)) {
    redirect('/chat')
  }

  const imovel = await prisma.imovel.findUnique({
    where: { id: params.id },
    include: { unidade: { select: { id: true, nome: true } } },
  })

  if (!imovel) notFound()

  if (perfil !== 'MASTER' && imovel.unidadeId !== usuario.unidadeId) {
    redirect('/imoveis')
  }

  const podeEditar = ['MASTER', 'PROPRIETARIO', 'ASSISTENTE'].includes(perfil)
  const voltarUrl = (searchParams.voltar && searchParams.voltar.startsWith('/imoveis'))
    ? searchParams.voltar
    : '/imoveis'

  const fotos: { url: string; ordem: number; principal: boolean }[] = imovel.fotos
    ? (() => { try { return JSON.parse(imovel.fotos) } catch { return [] } })()
    : []

  const modalidade = imovel.modalidade
  const mostrarVenda = ['VENDA', 'AMBOS'].includes(modalidade)
  const mostrarLocacao = ['LOCACAO', 'AMBOS'].includes(modalidade)

  const facilImovel: string[] = imovel.facilidadesImovel
    ? (() => { try { return JSON.parse(imovel.facilidadesImovel) } catch { return [] } })()
    : []
  const facilCond: string[] = imovel.facilidadesCond
    ? (() => { try { return JSON.parse(imovel.facilidadesCond) } catch { return [] } })()
    : []

  const tipoLabel = `${LABEL_TIPO[imovel.tipo] ?? imovel.tipo}${imovel.subtipo ? ` ${LABEL_SUBTIPO[imovel.subtipo] ?? imovel.subtipo}` : ''}`

  const valorLabel = mostrarLocacao && imovel.valorLocacao
    ? `Locação: ${formatarMoeda(imovel.valorLocacao)}/mês`
    : mostrarVenda && imovel.valorVenda
      ? `Venda: ${formatarMoeda(imovel.valorVenda)}`
      : ''

  const fichaWhatsApp = [
    `🏠 ${tipoLabel} — ${imovel.bairro}, ${imovel.cidade}`,
    imovel.areaUtil ? `📐 ${imovel.areaUtil}m²${imovel.dormitorios ? ` | ${LABEL_DORMITORIOS[imovel.dormitorios] ?? imovel.dormitorios} dorms` : ''}${imovel.vagasGaragem && imovel.vagasGaragem !== 'SEM_VAGA' ? ` | ${LABEL_VAGAS[imovel.vagasGaragem] ?? imovel.vagasGaragem} vaga(s)` : ''}` : null,
    valorLabel ? `💰 ${valorLabel}` : null,
    `📋 Ref: ${imovel.codigoRef}`,
    (imovel.linkExterno || imovel.slug) ? `🔗 ${imovel.linkExterno ?? `https://imoveis.cf8.com.br/imoveis/${imovel.slug}`}` : null,
  ].filter(Boolean).join('\n')

  const valorExibir = (() => {
    if (modalidade === 'AMBOS') {
      const parts = []
      if (imovel.valorVenda) parts.push(`V: ${formatarMoeda(imovel.valorVenda)}`)
      if (imovel.valorLocacao) parts.push(`L: ${formatarMoeda(imovel.valorLocacao)}/mês`)
      return parts.join(' / ') || null
    }
    if (mostrarVenda) return imovel.valorVenda ? formatarMoeda(imovel.valorVenda) : null
    if (mostrarLocacao) return imovel.valorLocacao ? `${formatarMoeda(imovel.valorLocacao)}/mês` : null
    return null
  })()

  const modalidadeLabel = modalidade === 'VENDA' ? 'Venda' : modalidade === 'LOCACAO' ? 'Locação' : 'Venda + Locação'
  const vistaMarlabel = imovel.tipoVistaMar === 'FRENTE' ? 'Frente' : imovel.tipoVistaMar === 'LATERAL' ? 'Lateral' : null

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">

      {/* ── Header — botões de ação ── */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <Link href={voltarUrl} className="btn-secondary flex items-center gap-2 text-sm">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Lista
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-white">
              {imovel.nome ? `${imovel.nome} — ` : ''}<span className="text-dourado-400">{imovel.codigoRef}</span>
            </h1>
            <p className="text-sm text-escuro-300">
              {tipoLabel} · {imovel.bairro}, {imovel.cidade} - {imovel.estado}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <BadgeSituacao situacao={imovel.situacao} />
          {podeEditar && (
            <Link href={`/imoveis/${imovel.id}/editar?voltar=${encodeURIComponent(voltarUrl)}`} className="btn-primary flex items-center gap-2 text-sm">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Editar
            </Link>
          )}
          {fotos.length > 0 && (
            <a href={`/api/imoveis/${imovel.id}/fotos/zip`} download className="btn-secondary flex items-center gap-2 text-sm">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Baixar Fotos
            </a>
          )}
          {imovel.slug && <CompartilharButton slug={imovel.slug} />}
          {podeEditar && <DuplicarButton imovelId={imovel.id} codigoRef={imovel.codigoRef} />}
          {podeEditar && (
            <Link href={`/imprimir/imoveis/${imovel.id}/ficha`} target="_blank" className="btn-secondary flex items-center gap-2 text-sm">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              Ficha do Imóvel
            </Link>
          )}
        </div>
      </div>

      {/* ── Card Identificação ── */}
      <div className="card mb-4">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div className="flex items-center gap-6 flex-wrap">
            <div>
              <p className="text-[11px] text-white/50 mb-0.5 uppercase tracking-wide">Código Ref.</p>
              <p className="text-dourado-400 font-bold text-lg leading-tight">{imovel.codigoRef}</p>
            </div>
            {imovel.nome && (
              <div>
                <p className="text-[11px] text-white/50 mb-0.5 uppercase tracking-wide">Nome</p>
                <p className="text-white text-base font-medium">{imovel.nome}</p>
              </div>
            )}
            <BadgeSituacao situacao={imovel.situacao} />
          </div>
          <div className="flex gap-8 items-end">
            <Campo label="Unidade" valor={imovel.unidade?.nome} />
            <Campo label="Captador" valor={imovel.captador} />
            {imovel.parceria && (
              <span className="px-2.5 py-1 rounded text-xs font-medium bg-dourado-400/20 text-dourado-400 border border-dourado-400/40">
                Parceria Imobiliária
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── Seção 1 — Dados Comerciais ── */}
      <div className="card mb-4">
        <SecTitle n={1} title="Dados Comerciais" />
        <div className="grid grid-cols-3 gap-x-6 gap-y-5">

          <Campo label="Finalidade" valor={
            imovel.finalidade === 'RESIDENCIAL' ? 'Residencial'
            : imovel.finalidade === 'COMERCIAL' ? 'Comercial'
            : imovel.finalidade === 'RURAL' ? 'Rural'
            : imovel.finalidade
          } />
          <Campo label="Tipo" valor={LABEL_TIPO[imovel.tipo] ?? imovel.tipo} />
          <Campo label="Subtipo" valor={imovel.subtipo ? (LABEL_SUBTIPO[imovel.subtipo] ?? imovel.subtipo) : null} />

          {/* Endereço linha 1: Logradouro 60% | Número 20% | Complemento 20% */}
          <div className="col-span-3 grid grid-cols-5 gap-x-6">
            <div className="col-span-3"><Campo label="Logradouro" valor={imovel.logradouro} /></div>
            <Campo label="Número" valor={imovel.numero} />
            <Campo label="Complemento" valor={imovel.complemento} />
          </div>

          {/* Endereço linha 2: Cidade 30% | Bairro 30% | Estado 15% | CEP 25% */}
          <div className="col-span-3 grid grid-cols-4 gap-x-6">
            <Campo label="Cidade" valor={imovel.cidade} />
            <Campo label="Bairro" valor={imovel.bairro} />
            <Campo label="Estado" valor={imovel.estado} />
            <Campo label="CEP" valor={imovel.cep} />
          </div>

          {/* Proprietário 40% | Contato 30% | Edifício 30% */}
          <Campo label="Proprietário" valor={imovel.proprietario} />
          <Campo label="Contato do Proprietário" valor={imovel.telProprietario} />
          <Campo label="Edifício/Condomínio" valor={imovel.edificio} />

          <Campo label="Modalidade" valor={modalidadeLabel} />
          <Campo label="Valor Venda/Locação" valor={valorExibir} />
          <div className="flex items-end pb-0.5">
            <BadgeBool value={imovel.parceria} label="Parceria Imobiliária" />
          </div>

          <div className="col-span-3 grid grid-cols-4 gap-6">
            <Campo label="Condomínio R$" valor={imovel.valorCondominio ? formatarMoeda(imovel.valorCondominio) : null} />
            <Campo label="IPTU R$" valor={imovel.valorIptu ? formatarMoeda(imovel.valorIptu) : null} />
            <Campo label="Área Útil m²" valor={imovel.areaUtil ? String(imovel.areaUtil) : null} />
            <Campo label="Área Total m²" valor={imovel.areaTotal ? String(imovel.areaTotal) : null} />
          </div>

          <div className="col-span-3 flex gap-3 flex-wrap">
            <BadgeBool value={imovel.aceitaPermuta} label="Aceita Permuta" />
            <BadgeBool value={imovel.documentacaoOk} label="Documentação OK" />
            <BadgeBool value={imovel.aceitaFinanc} label="Aceita Financiamento" />
          </div>
        </div>
      </div>

      {/* ── Seção 2 — Dados do Imóvel ── */}
      <div className="card mb-4">
        <SecTitle n={2} title="Dados do Imóvel" />

        <div className="grid grid-cols-4 gap-x-6 gap-y-5 mb-5">
          <Campo label="Dormitórios" valor={imovel.dormitorios ? (LABEL_DORMITORIOS[imovel.dormitorios] ?? imovel.dormitorios) : null} />
          <Campo label="Suítes" valor={imovel.suites ? (LABEL_SUITES[imovel.suites] ?? imovel.suites) : null} />
          <Campo label="Banheiros" valor={imovel.totalBanheiros} />
          <Campo label="Situação do Imóvel" valor={imovel.situacaoImovel ? (LABEL_SITUACAO_IMOVEL[imovel.situacaoImovel] ?? imovel.situacaoImovel) : null} />

          <Campo label="Vagas" valor={imovel.vagasGaragem ? (LABEL_VAGAS[imovel.vagasGaragem] ?? imovel.vagasGaragem) : null} />
          <Campo label="Tipo de Garagem" valor={imovel.tipoGaragem ? (LABEL_GARAGEM[imovel.tipoGaragem] ?? imovel.tipoGaragem) : null} />
          <div className="flex items-end pb-0.5">
            <BadgeBool value={imovel.dependencia} label="Dependência" />
          </div>
          <div className="flex items-end pb-0.5">
            <BadgeBool value={imovel.vistaMar} label={imovel.vistaMar && vistaMarlabel ? `Vista Mar · ${vistaMarlabel}` : 'Vista Mar'} />
          </div>
        </div>

        <div className="mb-5">
          <p className="text-[11px] text-white/50 mb-2 uppercase tracking-wide">Facilidades do Imóvel</p>
          <div className="flex flex-wrap gap-2">
            {[
              { id: 'ARMARIOS_QUARTOS', label: 'Armários Quartos' },
              { id: 'COZ_PLANEJADA', label: 'Coz. Planejada' },
              { id: 'VENTILADOR_TETO', label: 'Ventilador Teto' },
              { id: 'AR_CONDICIONADO', label: 'Ar Condicionado' },
              { id: 'VARANDA_GOURMET', label: 'Varanda Gourmet' },
              { id: 'CHURRASQUEIRA', label: 'Churrasqueira' },
            ].map(f => (
              <Chip key={f.id} label={f.label} ativo={facilImovel.includes(f.id)} />
            ))}
            {parsearOutrosArray(imovel.facilidadesImovelOutros).map(item => (
              <Chip key={item} label={item} ativo />
            ))}
          </div>
        </div>

        {imovel.descricao && (
          <div>
            <p className="text-[11px] text-white/50 mb-1.5 uppercase tracking-wide">Descrição</p>
            <p className="text-white text-sm whitespace-pre-wrap leading-relaxed">{imovel.descricao}</p>
          </div>
        )}
      </div>

      {/* ── Seção 3 — Dados do Condomínio ── */}
      <div className="card mb-4">
        <SecTitle n={3} title="Dados do Condomínio" />

        <div className="grid grid-cols-3 gap-x-6 gap-y-5 mb-5">
          <Campo label="Acesso" valor={imovel.acesso ? (LABEL_ACESSO[imovel.acesso] ?? imovel.acesso) : null} />
          <Campo label="Andar" valor={imovel.andar != null ? String(imovel.andar) : null} />
          <div />
        </div>

        <div>
          <p className="text-[11px] text-white/50 mb-2 uppercase tracking-wide">Facilidades do Condomínio</p>
          <div className="flex flex-wrap gap-2">
            {[
              { id: 'PISCINA', label: 'Piscina' },
              { id: 'ACADEMIA', label: 'Academia' },
              { id: 'SALAO_FESTAS', label: 'Salão de Festas' },
              { id: 'SALAO_JOGOS', label: 'Salão de Jogos' },
              { id: 'PLAYGROUND', label: 'Playground' },
            ].map(f => (
              <Chip key={f.id} label={f.label} ativo={facilCond.includes(f.id)} />
            ))}
            {parsearOutrosArray(imovel.facilidadesCondOutros).map(item => (
              <Chip key={item} label={item} ativo />
            ))}
          </div>
        </div>
      </div>

      {/* ── Seção 4 — Dados Administrativos ── */}
      <div className="card mb-4">
        <SecTitle title="Dados Administrativos" />
        <div className="grid grid-cols-3 gap-x-6 gap-y-5">

          <div className="flex items-end pb-0.5">
            <BadgeBool value={imovel.exclusividade} label="Exclusividade" />
          </div>
          <Campo label="Comissão" valor={imovel.percComissao ? `${imovel.percComissao}%` : null} />
          <Campo label="Cadastrado em" valor={new Date(imovel.dataCadastro).toLocaleDateString('pt-BR')} />

          <div className="col-span-3 flex gap-3 flex-wrap">
            <BadgeBool value={imovel.publicarSite} label="Publicar no Site" />
            <BadgeBool value={imovel.publicarPortais} label="Publicar Portais" />
            <BadgeBool value={imovel.destaque} label="Destaque" />
          </div>

          <Campo label="Cód. IPTU" valor={imovel.codIptu} />
          <Campo label="Cód. Matrícula" valor={imovel.codMatricula} />
          <div />

          {imovel.linkExterno && (
            <div className="col-span-3">
              <p className="text-[11px] text-white/50 mb-0.5 uppercase tracking-wide">Link Externo</p>
              <div className="flex items-center gap-2">
                <p className="text-white text-sm break-all">{imovel.linkExterno}</p>
                <CopiarTextoButton texto={imovel.linkExterno} />
              </div>
            </div>
          )}

          {(imovel.slug || imovel.linkSite) && (
            <div className="col-span-3">
              <p className="text-[11px] text-white/50 mb-0.5 uppercase tracking-wide">Link do Site</p>
              <p className="text-white text-sm break-all">
                {imovel.slug ? `https://imoveis.cf8.com.br/imoveis/${imovel.slug}` : imovel.linkSite}
              </p>
            </div>
          )}

          {imovel.obsInternas && (
            <div className="col-span-3">
              <p className="text-[11px] text-white/50 mb-1 uppercase tracking-wide">Observações Internas</p>
              <p className="text-white text-sm whitespace-pre-wrap">{imovel.obsInternas}</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Fotos ── */}
      {fotos.length > 0 && (
        <div className="card mb-4">
          <SecTitle title="Fotos" />
          <GaleriaFotos imovelId={imovel.id} fotosIniciais={fotos} readOnly />
        </div>
      )}
    </div>
  )
}
