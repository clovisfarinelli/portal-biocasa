import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect, notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import GaleriaFotos from '@/components/imoveis/GaleriaFotos'
import CopiarFichaButton from '@/components/imoveis/CopiarFichaButton'
import CopiarTextoButton from '@/components/imoveis/CopiarTextoButton'
import { formatarMoeda } from '@/lib/utils'

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

function Linha({ label, valor }: { label: string; valor?: string | null | number | boolean }) {
  if (valor === undefined || valor === null || valor === '' || valor === false) return null
  const v = typeof valor === 'boolean' ? 'Sim' : String(valor)
  return (
    <div className="flex gap-2 py-1.5 border-b border-escuro-600 last:border-0">
      <span className="text-escuro-300 text-sm min-w-36 shrink-0">{label}</span>
      <span className="text-white text-sm break-words">{v}</span>
    </div>
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

  const labelFacilImovel: Record<string, string> = {
    ARMARIOS_QUARTOS: 'Armários Quartos', COZ_PLANEJADA: 'Coz. Planejada',
    VENTILADOR_TETO: 'Ventilador Teto', AR_CONDICIONADO: 'Ar Condicionado',
    VARANDA_GOURMET: 'Varanda Gourmet', CHURRASQUEIRA: 'Churrasqueira',
    OUTROS: imovel.facilidadesImovelOutros ?? 'Outros',
  }
  const labelFacilCond: Record<string, string> = {
    PISCINA: 'Piscina', ACADEMIA: 'Academia', SALAO_FESTAS: 'Salão de Festas',
    SALAO_JOGOS: 'Salão de Jogos', PLAYGROUND: 'Playground',
    OUTROS: imovel.facilidadesCondOutros ?? 'Outros',
  }

  // Texto para WhatsApp
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
    (imovel.linkExterno || imovel.linkSite) ? `🔗 ${imovel.linkExterno ?? imovel.linkSite}` : null,
  ].filter(Boolean).join('\n')

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
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
        <div className="flex items-center gap-3">
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
            <a
              href={`/api/imoveis/${imovel.id}/fotos/zip`}
              download
              className="btn-secondary flex items-center gap-2 text-sm"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Baixar Fotos
            </a>
          )}
          <CopiarFichaButton texto={fichaWhatsApp} />
        </div>
      </div>

      {/* Seção 1 — Dados Comerciais */}
      <div className="card mb-4">
        <h3 className="text-base font-semibold text-dourado-400 border-b border-escuro-400 pb-2 mb-4">Dados Comerciais</h3>
        <Linha label="Código Ref." valor={imovel.codigoRef} />
        <Linha label="Nome" valor={imovel.nome} />
        <Linha label="Finalidade" valor={imovel.finalidade === 'RESIDENCIAL' ? 'Residencial' : 'Comercial'} />
        <Linha label="Tipo" valor={`${LABEL_TIPO[imovel.tipo] ?? imovel.tipo}${imovel.subtipo ? ` · ${LABEL_SUBTIPO[imovel.subtipo] ?? imovel.subtipo}` : ''}`} />
        <Linha label="Modalidade" valor={imovel.modalidade === 'VENDA' ? 'Venda' : imovel.modalidade === 'LOCACAO' ? 'Locação' : 'Venda + Locação'} />
        {mostrarVenda && <Linha label="Valor Venda" valor={imovel.valorVenda ? formatarMoeda(imovel.valorVenda) : null} />}
        {mostrarLocacao && <Linha label="Valor Locação" valor={imovel.valorLocacao ? `${formatarMoeda(imovel.valorLocacao)}/mês` : null} />}
        <Linha label="Área Útil" valor={imovel.areaUtil ? `${imovel.areaUtil} m²` : null} />
        <Linha label="Área Total" valor={imovel.areaTotal ? `${imovel.areaTotal} m²` : null} />
        <Linha label="Dormitórios" valor={imovel.dormitorios ? (LABEL_DORMITORIOS[imovel.dormitorios] ?? imovel.dormitorios) : null} />
        <Linha label="Suítes" valor={imovel.suites ? (LABEL_SUITES[imovel.suites] ?? imovel.suites) : null} />
        <Linha label="Banheiros" valor={imovel.totalBanheiros} />
        <Linha label="Garagem" valor={imovel.vagasGaragem ? `${LABEL_VAGAS[imovel.vagasGaragem] ?? imovel.vagasGaragem} vaga(s)${imovel.tipoGaragem ? ` · ${LABEL_GARAGEM[imovel.tipoGaragem] ?? imovel.tipoGaragem}` : ''}` : null} />
        <Linha label="Aceita Permuta" valor={imovel.aceitaPermuta || undefined} />
        <Linha label="Aceita Financiamento" valor={imovel.aceitaFinanc || undefined} />
        <Linha label="Documentação OK" valor={imovel.documentacaoOk || undefined} />
      </div>

      {/* Seção 2 — Dados do Imóvel */}
      <div className="card mb-4">
        <h3 className="text-base font-semibold text-dourado-400 border-b border-escuro-400 pb-2 mb-4">Dados do Imóvel</h3>
        <Linha label="Logradouro" valor={[imovel.logradouro, imovel.numero, imovel.complemento].filter(Boolean).join(', ')} />
        <Linha label="Bairro" valor={imovel.bairro} />
        <Linha label="Cidade / Estado" valor={`${imovel.cidade} - ${imovel.estado}`} />
        <Linha label="CEP" valor={imovel.cep} />
        <Linha label="Edifício" valor={imovel.edificio} />
        <Linha label="Andar" valor={imovel.andar} />
        <Linha label="Acesso" valor={imovel.acesso === 'TERREO' ? 'Térreo' : imovel.acesso === 'ESCADAS' ? 'Escadas' : imovel.acesso === 'ELEVADOR' ? 'Elevador' : imovel.acesso} />
        <Linha label="Situação Imóvel" valor={imovel.situacaoImovel} />
        <Linha label="Dependência" valor={imovel.dependencia || undefined} />
        <Linha label="Vista Mar" valor={imovel.vistaMar ? `Sim${imovel.tipoVistaMar ? ` · ${imovel.tipoVistaMar === 'FRENTE' ? 'Frente' : 'Lateral'}` : ''}` : null} />
        <Linha label="Condomínio" valor={imovel.valorCondominio ? `${formatarMoeda(imovel.valorCondominio)}/mês` : null} />
        <Linha label="IPTU Mensal" valor={imovel.valorIptu ? formatarMoeda(imovel.valorIptu) : null} />
        {facilImovel.length > 0 && (
          <Linha label="Facilidades" valor={facilImovel.map(f => labelFacilImovel[f] ?? f).join(', ')} />
        )}
        {facilCond.length > 0 && (
          <Linha label="Facilidades Cond." valor={facilCond.map(f => labelFacilCond[f] ?? f).join(', ')} />
        )}
        {imovel.descricao && (
          <div className="py-1.5 border-b border-escuro-600 last:border-0">
            <span className="text-escuro-300 text-sm block mb-1">Descrição</span>
            <p className="text-white text-sm whitespace-pre-wrap leading-relaxed">{imovel.descricao}</p>
          </div>
        )}
      </div>

      {/* Seção 3 — Dados Administrativos */}
      <div className="card mb-4">
        <h3 className="text-base font-semibold text-dourado-400 border-b border-escuro-400 pb-2 mb-4">Dados Administrativos</h3>
        <Linha label="Proprietário" valor={imovel.proprietario} />
        <Linha label="Contato" valor={imovel.telProprietario} />
        <Linha label="Captador" valor={imovel.captador} />
        <Linha label="Parceria" valor={imovel.parceria ? 'Sim' : null} />
        <Linha label="Exclusividade" valor={imovel.exclusividade || undefined} />
        <Linha label="Comissão" valor={imovel.percComissao ? `${imovel.percComissao}%` : null} />
        <Linha label="Publicar no Site" valor={imovel.publicarSite || undefined} />
        <Linha label="Publicar Portais" valor={imovel.publicarPortais || undefined} />
        <Linha label="Destaque" valor={imovel.destaque || undefined} />
        <Linha label="Cód. IPTU" valor={imovel.codIptu} />
        <Linha label="Cód. Matrícula" valor={imovel.codMatricula} />
        {imovel.linkExterno ? (
          <div className="flex gap-2 py-1.5 border-b border-escuro-600 last:border-0">
            <span className="text-escuro-300 text-sm min-w-36 shrink-0">Link Externo</span>
            <span className="text-white text-sm break-all flex items-center">
              {imovel.linkExterno}
              <CopiarTextoButton texto={imovel.linkExterno} />
            </span>
          </div>
        ) : null}
        <Linha label="Link do Site" valor={imovel.linkSite} />
        <Linha label="Unidade" valor={imovel.unidade?.nome} />
        <Linha label="Cadastrado em" valor={new Date(imovel.dataCadastro).toLocaleDateString('pt-BR')} />
        {imovel.obsInternas && (
          <div className="py-1.5 border-b border-escuro-600 last:border-0">
            <span className="text-escuro-300 text-sm block mb-1">Observações Internas</span>
            <p className="text-white text-sm whitespace-pre-wrap">{imovel.obsInternas}</p>
          </div>
        )}
      </div>

      {/* Seção 4 — Fotos (por último) */}
      {fotos.length > 0 && (
        <div className="card mb-4">
          <h3 className="text-base font-semibold text-dourado-400 border-b border-escuro-400 pb-2 mb-4">Fotos</h3>
          <GaleriaFotos imovelId={imovel.id} fotosIniciais={fotos} readOnly />
        </div>
      )}
    </div>
  )
}
