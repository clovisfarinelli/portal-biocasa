'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { formatarMoeda } from '@/lib/utils'

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface ImovelPublico {
  id: string
  codigoRef: string
  nome: string | null
  tipo: string
  subtipo: string | null
  modalidade: string
  locacaoPacote: boolean
  bairro: string
  cidade: string
  estado: string
  valorVenda: number | null
  valorLocacao: number | null
  areaUtil: number | null
  areaTotal: number | null
  dormitorios: string | null
  totalBanheiros: string | null
  vagasGaragem: string | null
  descricao: string | null
  fotoCapa: string | null
  destaque: boolean
}

// ─── Constantes ───────────────────────────────────────────────────────────────

const LABEL_TIPO: Record<string, string> = {
  CASA: 'Casa', APARTAMENTO: 'Apartamento', TERRENO: 'Terreno', CHACARA: 'Chácara',
  SALA: 'Sala', LOJA: 'Loja', CASA_COMERCIAL: 'Casa Comercial', GALPAO: 'Galpão',
}
const LABEL_SUBTIPO: Record<string, string> = {
  ISOLADA: 'Isolada', SOBRADO: 'Sobrado', SOBREPOSTA_ALTA: 'Sob. Alta',
  SOBREPOSTA_BAIXA: 'Sob. Baixa', VILLAGGIO: 'Villaggio',
  KITNET_STUDIO: 'Kitnet/Studio', KITNET: 'Kitnet/Studio', STUDIO: 'Kitnet/Studio',
  PADRAO: 'Padrão', TERREO: 'Térreo',
}
const BADGE_MODALIDADE: Record<string, { bg: string; text: string; label: string }> = {
  VENDA: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Venda' },
  LOCACAO: { bg: 'bg-purple-100', text: 'text-purple-700', label: 'Locação' },
  AMBOS: { bg: 'bg-amber-100', text: 'text-amber-800', label: 'Venda e Locação' },
}

function fotoUrl(url: string) {
  return `/api/imoveis/publico/fotos?url=${encodeURIComponent(url)}`
}

// ─── Card ─────────────────────────────────────────────────────────────────────

function CardImovel({ imovel }: { imovel: ImovelPublico }) {
  const badge = BADGE_MODALIDADE[imovel.modalidade]
  const tipoLabel = `${LABEL_TIPO[imovel.tipo] ?? imovel.tipo}${imovel.subtipo ? ` ${LABEL_SUBTIPO[imovel.subtipo] ?? imovel.subtipo}` : ''}`
  const mostrarVenda = imovel.modalidade === 'VENDA' || imovel.modalidade === 'AMBOS'
  const mostrarLocacao = imovel.modalidade === 'LOCACAO' || imovel.modalidade === 'AMBOS'

  return (
    <Link
      href={`/imoveis/${imovel.codigoRef}`}
      className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow flex flex-col"
    >
      {/* Foto */}
      <div className="relative w-full h-48 bg-gray-100 flex-shrink-0 overflow-hidden">
        {imovel.fotoCapa ? (
          <img
            src={fotoUrl(imovel.fotoCapa)}
            alt={tipoLabel}
            className="w-full h-full object-cover object-center"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <svg className="w-12 h-12 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}
        {badge && (
          <span className={`absolute top-2 left-2 text-xs font-semibold px-2 py-1 rounded-lg ${badge.bg} ${badge.text}`}>
            {badge.label}
          </span>
        )}
        {imovel.destaque && (
          <span className="absolute top-2 right-2 text-xs font-semibold px-2 py-1 rounded-lg bg-[#C9A84C] text-white">
            Destaque
          </span>
        )}
      </div>

      {/* Informações */}
      <div className="p-4 flex flex-col flex-1">
        <p className="text-xs text-gray-400 mb-1">{imovel.bairro} · {imovel.cidade}</p>
        <p className="font-semibold text-[#1A1A2E] mb-3 leading-snug">{tipoLabel}</p>

        {/* Características */}
        <div className="flex flex-wrap gap-x-3 gap-y-1.5 text-xs text-gray-500 mb-4">
          {imovel.areaUtil && (
            <span className="flex items-center gap-1">
              <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-5h-4m4 0v4m0-4l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
              </svg>
              {imovel.areaUtil}m²
            </span>
          )}
          {imovel.dormitorios && imovel.dormitorios !== 'KIT_STUDIO' && (
            <span className="flex items-center gap-1">
              <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
              </svg>
              {imovel.dormitorios === '4_MAIS' ? '4+' : imovel.dormitorios} quarto{imovel.dormitorios !== '1' ? 's' : ''}
            </span>
          )}
          {imovel.totalBanheiros && (
            <span className="flex items-center gap-1">
              <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              {imovel.totalBanheiros} banheiro{Number(imovel.totalBanheiros) !== 1 ? 's' : ''}
            </span>
          )}
          {imovel.vagasGaragem && imovel.vagasGaragem !== 'SEM_VAGA' && (
            <span className="flex items-center gap-1">
              <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              {imovel.vagasGaragem === '3_MAIS' ? '3+' : imovel.vagasGaragem === 'MOTOS' ? 'Motos' : imovel.vagasGaragem} vaga{imovel.vagasGaragem !== '1' && imovel.vagasGaragem !== 'MOTOS' ? 's' : ''}
            </span>
          )}
        </div>

        {/* Preço */}
        <div className="mt-auto space-y-0.5">
          {mostrarVenda && imovel.valorVenda && (
            <p className="font-bold text-base" style={{ color: '#C9A84C' }}>
              {formatarMoeda(imovel.valorVenda)}
            </p>
          )}
          {mostrarLocacao && imovel.valorLocacao && (
            <p className={`font-semibold ${imovel.modalidade === 'AMBOS' ? 'text-sm text-gray-600' : 'text-base'}`}
              style={imovel.modalidade !== 'AMBOS' ? { color: '#C9A84C' } : {}}>
              {formatarMoeda(imovel.valorLocacao)}/mês
              {imovel.locacaoPacote && (
                <span className="ml-2 text-xs font-medium bg-green-100 text-green-700 px-1.5 py-0.5 rounded">
                  Pacote
                </span>
              )}
            </p>
          )}
        </div>
      </div>
    </Link>
  )
}

// ─── Página de Listagem ───────────────────────────────────────────────────────

function ListagemContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [imoveis, setImoveis] = useState<ImovelPublico[]>([])
  const [total, setTotal] = useState(0)
  const [paginas, setPaginas] = useState(1)
  const [carregando, setCarregando] = useState(true)

  const [tipo, setTipo] = useState(() => searchParams.get('tipo') ?? '')
  const [modalidade, setModalidade] = useState(() => searchParams.get('modalidade') ?? '')
  const [busca, setBusca] = useState(() => searchParams.get('busca') ?? '')
  const [cidade, setCidade] = useState(() => searchParams.get('cidade') ?? '')
  const [bairro, setBairro] = useState(() => searchParams.get('bairro') ?? '')
  const [quartosMin, setQuartosMin] = useState(() => searchParams.get('quartos_min') ?? '')
  const [suitesMin, setSuitesMin] = useState(() => searchParams.get('suites_min') ?? '')
  const [vagasMin, setVagasMin] = useState(() => searchParams.get('vagas_min') ?? '')
  const [valorMax, setValorMax] = useState(() => searchParams.get('valor_max') ?? '')
  const [pagina, setPagina] = useState(() => Number(searchParams.get('pagina') || 1))

  const buscar = useCallback(async (pg = pagina) => {
    setCarregando(true)
    try {
      const params = new URLSearchParams()
      if (tipo) params.set('tipo', tipo)
      if (modalidade) params.set('modalidade', modalidade)
      if (busca.trim()) params.set('busca', busca.trim())
      if (cidade) params.set('cidade', cidade)
      if (bairro) params.set('bairro', bairro)
      if (quartosMin) params.set('quartos_min', quartosMin)
      if (suitesMin) params.set('suites_min', suitesMin)
      if (vagasMin) params.set('vagas_min', vagasMin)
      if (valorMax) params.set('valor_max', valorMax)
      params.set('pagina', String(pg))

      const res = await fetch(`/api/imoveis/publico?${params}`)
      const data = await res.json()
      setImoveis(data.imoveis ?? [])
      setTotal(data.total ?? 0)
      setPaginas(data.paginas ?? 1)
    } finally {
      setCarregando(false)
    }
  }, [tipo, modalidade, busca, cidade, bairro, quartosMin, suitesMin, vagasMin, valorMax, pagina])

  useEffect(() => { buscar(pagina) }, []) // eslint-disable-line react-hooks/exhaustive-deps

  function aplicarFiltros() {
    const params = new URLSearchParams()
    if (tipo) params.set('tipo', tipo)
    if (modalidade) params.set('modalidade', modalidade)
    if (busca.trim()) params.set('busca', busca.trim())
    if (cidade) params.set('cidade', cidade.trim())
    if (bairro) params.set('bairro', bairro.trim())
    if (quartosMin) params.set('quartos_min', quartosMin)
    if (suitesMin) params.set('suites_min', suitesMin)
    if (vagasMin) params.set('vagas_min', vagasMin)
    if (valorMax) params.set('valor_max', valorMax)
    params.set('pagina', '1')
    setPagina(1)
    router.replace(`/imoveis?${params}`, { scroll: false })
    buscar(1)
  }

  function limparFiltros() {
    setTipo(''); setModalidade(''); setBusca(''); setCidade(''); setBairro('')
    setQuartosMin(''); setSuitesMin(''); setVagasMin(''); setValorMax(''); setPagina(1)
    router.replace('/imoveis', { scroll: false })
    setCarregando(true)
    fetch('/api/imoveis/publico?pagina=1').then(r => r.json()).then(data => {
      setImoveis(data.imoveis ?? [])
      setTotal(data.total ?? 0)
      setPaginas(data.paginas ?? 1)
      setCarregando(false)
    })
  }

  function mudarPagina(nova: number) {
    setPagina(nova)
    const params = new URLSearchParams(searchParams.toString())
    params.set('pagina', String(nova))
    router.replace(`/imoveis?${params}`, { scroll: false })
    buscar(nova)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <h1 className="text-2xl font-bold text-[#1A1A2E] mb-6">Imóveis disponíveis</h1>

      {/* Filtros */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-8">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mb-3">
          <select
            value={tipo}
            onChange={e => setTipo(e.target.value)}
            className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-700 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#C9A84C]/40"
          >
            <option value="">Todos os tipos</option>
            <option value="APARTAMENTO">Apartamento</option>
            <option value="CASA">Casa</option>
            <option value="TERRENO">Terreno</option>
            <option value="CHACARA">Chácara</option>
            <option value="SALA">Sala</option>
            <option value="LOJA">Loja</option>
            <option value="CASA_COMERCIAL">Casa Comercial</option>
            <option value="GALPAO">Galpão</option>
          </select>

          <select
            value={modalidade}
            onChange={e => setModalidade(e.target.value)}
            className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-700 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#C9A84C]/40"
          >
            <option value="">Venda ou Locação</option>
            <option value="VENDA">Venda</option>
            <option value="LOCACAO">Locação</option>
          </select>

          <input
            value={busca}
            onChange={e => setBusca(e.target.value)}
            placeholder="Condomínio, bairro ou cidade..."
            className="col-span-2 border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-700 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#C9A84C]/40"
          />

          <input
            value={cidade}
            onChange={e => setCidade(e.target.value)}
            placeholder="Cidade"
            className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-700 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#C9A84C]/40"
          />

          <input
            value={bairro}
            onChange={e => setBairro(e.target.value)}
            placeholder="Bairro"
            className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-700 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#C9A84C]/40"
          />

          <select
            value={quartosMin}
            onChange={e => setQuartosMin(e.target.value)}
            className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-700 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#C9A84C]/40"
          >
            <option value="">Quartos</option>
            <option value="1">1+</option>
            <option value="2">2+</option>
            <option value="3">3+</option>
            <option value="4">4+</option>
          </select>

          <select
            value={suitesMin}
            onChange={e => setSuitesMin(e.target.value)}
            className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-700 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#C9A84C]/40"
          >
            <option value="">Suítes</option>
            <option value="1">1+</option>
            <option value="2">2+</option>
            <option value="3">3+</option>
          </select>

          <select
            value={vagasMin}
            onChange={e => setVagasMin(e.target.value)}
            className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-700 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#C9A84C]/40"
          >
            <option value="">Vagas</option>
            <option value="1">1+</option>
            <option value="2">2+</option>
            <option value="3">3+</option>
          </select>

          <input
            type="number"
            value={valorMax}
            onChange={e => setValorMax(e.target.value)}
            placeholder="Valor máx. (R$)"
            className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-700 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#C9A84C]/40"
          />
        </div>

        <div className="flex gap-2">
          <button
            onClick={aplicarFiltros}
            className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90"
            style={{ background: '#C9A84C' }}
          >
            Filtrar
          </button>
          <button
            onClick={limparFiltros}
            className="px-6 py-2.5 rounded-xl text-sm font-semibold text-gray-600 border border-gray-200 hover:bg-gray-50 transition-colors"
          >
            Limpar filtros
          </button>
        </div>
      </div>

      {/* Resultado */}
      {carregando ? (
        <div className="flex items-center justify-center py-24">
          <div className="w-8 h-8 border-2 border-[#C9A84C] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : imoveis.length === 0 ? (
        <div className="text-center py-24 text-gray-400">
          <svg className="w-16 h-16 mx-auto mb-4 text-gray-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          <p className="text-lg font-medium">Nenhum imóvel encontrado com esses filtros.</p>
          <p className="text-sm mt-1">Tente ajustar ou limpar os filtros.</p>
        </div>
      ) : (
        <>
          <p className="text-sm text-gray-500 mb-4">{total} imóvel{total !== 1 ? 'is' : ''} encontrado{total !== 1 ? 's' : ''}</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {imoveis.map(imovel => <CardImovel key={imovel.id} imovel={imovel} />)}
          </div>

          {/* Paginação */}
          {paginas > 1 && (
            <div className="flex items-center justify-center gap-2 mt-10">
              <button
                onClick={() => mudarPagina(pagina - 1)}
                disabled={pagina <= 1}
                className="px-4 py-2 rounded-xl text-sm font-medium border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                ← Anterior
              </button>
              <span className="text-sm text-gray-500 px-2">
                Página {pagina} de {paginas}
              </span>
              <button
                onClick={() => mudarPagina(pagina + 1)}
                disabled={pagina >= paginas}
                className="px-4 py-2 rounded-xl text-sm font-medium border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Próxima →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default function ImoveisPublicoPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center py-24">
        <div className="w-8 h-8 border-2 border-[#C9A84C] border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <ListagemContent />
    </Suspense>
  )
}
