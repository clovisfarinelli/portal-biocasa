'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { formatarMoeda } from '@/lib/utils'

interface Imovel {
  id: string
  codigoRef: string
  nome: string | null
  finalidade: string
  tipo: string
  subtipo: string | null
  bairro: string
  cidade: string
  estado: string
  modalidade: string
  valorVenda: number | null
  valorLocacao: number | null
  locacaoPacote: boolean
  valorCondominio: number | null
  valorIptu: number | null
  areaUtil: number | null
  areaTotal: number | null
  dormitorios: string | null
  suites: string | null
  vagasGaragem: string | null
  situacao: string
  destaque: boolean
  publicarSite: boolean
  fotos: string | null
  unidade?: { nome: string }
}

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
const LABEL_MODALIDADE: Record<string, string> = {
  VENDA: 'Venda', LOCACAO: 'Locação', AMBOS: 'Venda / Locação',
}

function fotoPrincipal(fotos: string | null): string | null {
  if (!fotos) return null
  try {
    const arr = JSON.parse(fotos)
    return arr.find((f: any) => f.principal)?.url ?? arr[0]?.url ?? null
  } catch { return null }
}

function BadgeSituacao({ situacao }: { situacao: string }) {
  const cores: Record<string, string> = {
    DISPONIVEL: 'bg-green-900/40 text-green-300 border-green-700/50',
    VENDIDO: 'bg-red-900/40 text-red-300 border-red-700/50',
    ALUGADO: 'bg-blue-900/40 text-blue-300 border-blue-700/50',
  }
  const labels: Record<string, string> = {
    DISPONIVEL: 'Disponível', VENDIDO: 'Vendido', ALUGADO: 'Alugado',
  }
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded border ${cores[situacao] ?? 'bg-escuro-400 text-white border-escuro-300'}`}>
      {labels[situacao] ?? situacao}
    </span>
  )
}

function ImoveisContent() {
  const { data: session } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const perfil = (session?.user as any)?.perfil as string | undefined

  const [imoveis, setImoveis] = useState<Imovel[]>([])
  const [total, setTotal] = useState(0)
  const [pagina, setPagina] = useState(() => Math.max(1, Number(searchParams.get('pagina') ?? '1')))
  const [carregando, setCarregando] = useState(true)
  const [excluindoId, setExcluindoId] = useState<string | null>(null)
  const [duplicandoId, setDuplicandoId] = useState<string | null>(null)

  // Filtros — inicializados da URL para preservar estado ao voltar
  const [busca, setBusca] = useState(() => searchParams.get('busca') ?? '')
  const [modalidade, setModalidade] = useState(() => searchParams.get('modalidade') ?? 'VENDA')
  const [cidade, setCidade] = useState(() => searchParams.get('cidade') ?? '')
  const [bairro, setBairro] = useState(() => searchParams.get('bairro') ?? '')
  const [tipo, setTipo] = useState(() => searchParams.get('tipo') ?? 'APARTAMENTO')
  const [dormitorios, setDormitorios] = useState(() => searchParams.get('dormitorios') ?? '')
  const [faixaValor, setFaixaValor] = useState(() => searchParams.get('faixaValor') ?? '')
  const [ordenar, setOrdenar] = useState(() => searchParams.get('ordenar') ?? '')

  // Filtros aplicados (só buscam ao clicar Filtrar)
  const [filtrosAtivos, setFiltrosAtivos] = useState(() => ({
    busca: searchParams.get('busca') ?? '',
    modalidade: searchParams.get('modalidade') ?? 'VENDA',
    cidade: searchParams.get('cidade') ?? '',
    bairro: searchParams.get('bairro') ?? '',
    tipo: searchParams.get('tipo') ?? 'APARTAMENTO',
    dormitorios: searchParams.get('dormitorios') ?? '',
    faixaValor: searchParams.get('faixaValor') ?? '',
    ordenar: searchParams.get('ordenar') ?? '',
  }))

  const podeEscrever = ['MASTER', 'PROPRIETARIO', 'ASSISTENTE'].includes(perfil ?? '')
  const podeExcluir = perfil === 'MASTER'
  const totalPaginas = Math.ceil(total / 20)

  function buildFiltroParams(filtros: typeof filtrosAtivos, pg: number): string {
    const p = new URLSearchParams()
    if (filtros.busca) p.set('busca', filtros.busca)
    if (filtros.modalidade) p.set('modalidade', filtros.modalidade)
    if (filtros.tipo) p.set('tipo', filtros.tipo)
    if (filtros.cidade) p.set('cidade', filtros.cidade)
    if (filtros.bairro) p.set('bairro', filtros.bairro)
    if (filtros.dormitorios) p.set('dormitorios', filtros.dormitorios)
    if (filtros.faixaValor) p.set('faixaValor', filtros.faixaValor)
    if (filtros.ordenar) p.set('ordenar', filtros.ordenar)
    if (pg > 1) p.set('pagina', String(pg))
    return p.toString()
  }

  const buscarImoveis = useCallback(async (filtros: typeof filtrosAtivos, pg: number) => {
    setCarregando(true)
    const params = new URLSearchParams()
    params.set('pagina', String(pg))
    if (filtros.busca) params.set('busca', filtros.busca)
    if (filtros.tipo) params.set('tipo', filtros.tipo)
    if (filtros.modalidade) params.set('modalidade', filtros.modalidade)
    if (filtros.cidade) params.set('cidade', filtros.cidade)
    if (filtros.bairro) params.set('bairro', filtros.bairro)
    if (filtros.dormitorios) params.set('dormitorios', filtros.dormitorios)
    if (filtros.faixaValor) {
      const faixas: Record<string, { min?: number; max?: number }> = {
        ate300: { max: 300000 },
        '300a500': { min: 300000, max: 500000 },
        '500a700': { min: 500000, max: 700000 },
        acima700: { min: 700000 },
      }
      const faixa = faixas[filtros.faixaValor]
      if (faixa?.min) params.set('valor_min', String(faixa.min))
      if (faixa?.max) params.set('valor_max', String(faixa.max))
    }
    if (filtros.ordenar) params.set('ordenar', filtros.ordenar)

    try {
      const res = await fetch(`/api/imoveis?${params}`)
      if (res.ok) {
        const data = await res.json()
        setImoveis(data.imoveis)
        setTotal(data.total)
      }
    } finally {
      setCarregando(false)
    }
  }, [])

  useEffect(() => {
    buscarImoveis(filtrosAtivos, pagina)
  }, [filtrosAtivos, pagina])

  function aplicarFiltros() {
    const novosFiltros = { busca, modalidade, cidade, bairro, tipo, dormitorios, faixaValor, ordenar }
    setPagina(1)
    setFiltrosAtivos(novosFiltros)
    const qs = buildFiltroParams(novosFiltros, 1)
    router.replace(`/imoveis${qs ? '?' + qs : ''}`, { scroll: false })
  }

  function limparFiltros() {
    const vazio = { busca: '', modalidade: '', cidade: '', bairro: '', tipo: '', dormitorios: '', faixaValor: '', ordenar: '' }
    setBusca(''); setModalidade(''); setCidade(''); setBairro(''); setTipo(''); setDormitorios(''); setFaixaValor(''); setOrdenar('')
    setPagina(1)
    setFiltrosAtivos(vazio)
    router.replace('/imoveis', { scroll: false })
  }

  function mudarPagina(novaPagina: number) {
    setPagina(novaPagina)
    const qs = buildFiltroParams(filtrosAtivos, novaPagina)
    router.replace(`/imoveis${qs ? '?' + qs : ''}`, { scroll: false })
  }

  async function duplicar(id: string, codigo: string) {
    if (!confirm(`Duplicar o imóvel ${codigo}? Uma cópia será criada sem fotos.`)) return
    setDuplicandoId(id)
    try {
      const res = await fetch(`/api/imoveis/${id}/duplicar`, { method: 'POST' })
      if (res.ok) {
        const data = await res.json()
        router.push(`/imoveis/${data.id}`)
      } else {
        const data = await res.json()
        alert(data.erro ?? 'Erro ao duplicar imóvel')
      }
    } finally {
      setDuplicandoId(null)
    }
  }

  async function excluir(id: string, codigo: string) {
    if (!confirm(`Excluir permanentemente o imóvel ${codigo}?`)) return
    setExcluindoId(id)
    try {
      const res = await fetch(`/api/imoveis/${id}`, { method: 'DELETE' })
      if (res.ok) {
        setImoveis(prev => prev.filter(i => i.id !== id))
        setTotal(prev => prev - 1)
      }
    } finally {
      setExcluindoId(null)
    }
  }

  const voltarQs = buildFiltroParams(filtrosAtivos, pagina)
  const voltarBase = `/imoveis${voltarQs ? '?' + voltarQs : ''}`
  const comVoltar = (href: string) =>
    voltarQs ? `${href}?voltar=${encodeURIComponent(voltarBase)}` : href

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Imóveis</h1>
          <p className="text-sm text-escuro-300 mt-0.5">{total} imóvel{total !== 1 ? 'is' : ''} encontrado{total !== 1 ? 's' : ''}</p>
        </div>
        {podeEscrever && (
          <Link href="/imoveis/novo" className="btn-primary flex items-center gap-2 text-sm">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Novo Imóvel
          </Link>
        )}
      </div>

      {/* Filtros */}
      <div className="card mb-6">
        {/* Linha 1 */}
        <div className="flex flex-wrap gap-3 mb-3">
          <select value={modalidade} onChange={e => setModalidade(e.target.value)} className="input-field text-sm w-36">
            <option value="">Modalidade</option>
            <option value="VENDA">Venda</option>
            <option value="LOCACAO">Locação</option>
            <option value="AMBOS">Ambos</option>
          </select>
          <select value={tipo} onChange={e => setTipo(e.target.value)} className="input-field text-sm w-44">
            <option value="">Tipo</option>
            <option value="APARTAMENTO">Apartamento</option>
            <option value="CASA">Casa</option>
            <option value="TERRENO">Terreno</option>
            <option value="CHACARA">Chácara</option>
            <option value="LOJA">Loja</option>
            <option value="SALA">Sala</option>
            <option value="CASA_COMERCIAL">Casa Comercial</option>
            <option value="GALPAO">Galpão</option>
          </select>
          <select value={dormitorios} onChange={e => setDormitorios(e.target.value)} className="input-field text-sm w-36">
            <option value="">Dormitórios</option>
            <option value="KIT_STUDIO">Kitnet/Studio</option>
            <option value="1">1</option>
            <option value="2">2</option>
            <option value="3">3</option>
            <option value="4_MAIS">4+</option>
          </select>
          <select value={faixaValor} onChange={e => setFaixaValor(e.target.value)} className="input-field text-sm w-52">
            <option value="">Faixa de Valor</option>
            <option value="ate300">Até R$ 300 mil</option>
            <option value="300a500">R$ 300 mil a R$ 500 mil</option>
            <option value="500a700">R$ 500 mil a R$ 700 mil</option>
            <option value="acima700">Acima de R$ 700 mil</option>
          </select>
          <input
            value={cidade}
            onChange={e => setCidade(e.target.value)}
            placeholder="Cidade"
            className="input-field text-sm w-36"
          />
          <input
            value={bairro}
            onChange={e => setBairro(e.target.value)}
            placeholder="Bairro"
            className="input-field text-sm w-36"
          />
        </div>
        {/* Linha 2 */}
        <div className="flex gap-3">
          <input
            value={busca}
            onChange={e => setBusca(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && aplicarFiltros()}
            placeholder="Buscar por ref, nome, endereço..."
            className="input-field text-sm flex-1"
          />
          <select value={ordenar} onChange={e => setOrdenar(e.target.value)} className="input-field text-sm w-40">
            <option value="">Mais Recente</option>
            <option value="maior_valor">Maior Valor</option>
            <option value="menor_valor">Menor Valor</option>
          </select>
          <button onClick={aplicarFiltros} className="btn-primary text-sm px-5">
            Filtrar
          </button>
          <button onClick={limparFiltros} className="btn-secondary text-sm">
            Limpar
          </button>
        </div>
      </div>

      {/* Conteúdo */}
      {carregando ? (
        <div className="flex items-center justify-center py-20">
          <svg className="w-8 h-8 animate-spin text-dourado-400" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        </div>
      ) : imoveis.length === 0 ? (
        <div className="text-center py-20">
          <svg className="w-16 h-16 text-escuro-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          <p className="text-escuro-200 text-lg">Nenhum imóvel encontrado</p>
          {podeEscrever && (
            <Link href="/imoveis/novo" className="btn-primary inline-flex items-center gap-2 text-sm mt-4">
              Cadastrar Novo Imóvel
            </Link>
          )}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-6">
            {imoveis.map(imovel => {
              const foto = fotoPrincipal(imovel.fotos)
              const filtroMod = filtrosAtivos.modalidade

              let valorVendaDisplay: number | null = null
              let valorLocacaoDisplay: number | null = null

              if (imovel.modalidade === 'VENDA') {
                valorVendaDisplay = imovel.valorVenda
              } else if (imovel.modalidade === 'LOCACAO') {
                valorLocacaoDisplay = imovel.valorLocacao
              } else {
                // AMBOS — exibir conforme filtro ativo
                if (filtroMod === 'VENDA') {
                  valorVendaDisplay = imovel.valorVenda
                } else if (filtroMod === 'LOCACAO') {
                  valorLocacaoDisplay = imovel.valorLocacao
                } else {
                  valorVendaDisplay = imovel.valorVenda
                  valorLocacaoDisplay = imovel.valorLocacao
                }
              }

              const mostrandoLocacaoNoCard = valorLocacaoDisplay !== null
              const ocultarCondIptu = imovel.locacaoPacote && mostrandoLocacaoNoCard

              const area = imovel.areaUtil ?? imovel.areaTotal
              const caracteristicas: string[] = []
              if (imovel.dormitorios) {
                const d = imovel.dormitorios
                caracteristicas.push(
                  d === 'KIT_STUDIO' ? 'Kit/Studio' : d === '4_MAIS' ? '4+ Dorms' : `${d} Dorm${d !== '1' ? 's' : ''}`
                )
              }
              if (imovel.suites && imovel.suites !== 'NAO_TEM') {
                const s = imovel.suites
                caracteristicas.push(s === '3_MAIS' ? '3+ Suítes' : `${s} Suíte${s !== '1' ? 's' : ''}`)
              }
              if (imovel.vagasGaragem && imovel.vagasGaragem !== 'SEM_VAGA') {
                const v = imovel.vagasGaragem
                caracteristicas.push(
                  v === '3_MAIS' ? '3+ Vagas' : v === 'MOTOS' ? 'Motos' : `${v} Vaga${v !== '1' ? 's' : ''}`
                )
              }
              if (area) caracteristicas.push(`${area}m²`)

              return (
                <div key={imovel.id} className="card p-0 overflow-hidden flex flex-col hover:border-escuro-300 transition-colors">
                  {/* Foto */}
                  <div className="relative w-full h-48 bg-escuro-700 flex-shrink-0 overflow-hidden">
                    {foto ? (
                      <img src={`/api/imoveis/fotos/download?url=${encodeURIComponent(foto)}`} alt={imovel.codigoRef} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <svg className="w-12 h-12 text-escuro-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}
                    <div className="absolute top-2 right-2 flex gap-1">
                      {imovel.destaque && (
                        <span title="Destaque" className="bg-dourado-400 text-escuro-700 rounded p-0.5">
                          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        </span>
                      )}
                      {imovel.publicarSite && (
                        <span title="No site" className="bg-blue-700/80 text-blue-100 rounded p-0.5">
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9" />
                          </svg>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Info */}
                  <div className="p-3 flex-1 flex flex-col">
                    <div className="flex items-start justify-between gap-2 mb-0.5">
                      <span className="text-dourado-400 font-bold text-sm">{imovel.codigoRef}</span>
                      <span className="text-escuro-300 text-xs flex-shrink-0">{LABEL_MODALIDADE[imovel.modalidade] ?? imovel.modalidade}</span>
                    </div>
                    {imovel.nome && (
                      <p className="text-white text-sm font-medium truncate mb-0.5">{imovel.nome}</p>
                    )}
                    <p className="text-escuro-200 text-xs mb-0.5">
                      {LABEL_TIPO[imovel.tipo] ?? imovel.tipo}
                      {imovel.subtipo ? ` · ${LABEL_SUBTIPO[imovel.subtipo] ?? imovel.subtipo}` : ''}
                    </p>
                    <p className="text-escuro-300 text-xs truncate mb-2">
                      {imovel.bairro}, {imovel.cidade} - {imovel.estado}
                    </p>

                    {valorVendaDisplay && (
                      <p className="text-white font-bold text-base mb-0.5">{formatarMoeda(valorVendaDisplay)}</p>
                    )}
                    {valorLocacaoDisplay && (
                      <p className={`font-bold mb-1 flex items-center gap-2 ${valorVendaDisplay ? 'text-escuro-200 text-sm' : 'text-white text-base'}`}>
                        {formatarMoeda(valorLocacaoDisplay)}/mês
                        {imovel.locacaoPacote && (
                          <span className="text-xs font-semibold px-1.5 py-0.5 rounded border bg-blue-900/40 text-blue-300 border-blue-700/50">
                            Pacote
                          </span>
                        )}
                      </p>
                    )}

                    {!ocultarCondIptu && (imovel.valorCondominio || imovel.valorIptu) && (
                      <p className="text-escuro-200 text-xs mb-1.5 flex gap-3">
                        {imovel.valorCondominio ? <span>Cond: {formatarMoeda(imovel.valorCondominio)}</span> : null}
                        {imovel.valorIptu ? <span>IPTU: {formatarMoeda(imovel.valorIptu)}</span> : null}
                      </p>
                    )}

                    {caracteristicas.length > 0 && (
                      <p className="text-escuro-300 text-xs mb-2 flex flex-wrap gap-x-2.5">
                        {caracteristicas.map((c, i) => <span key={i}>{c}</span>)}
                      </p>
                    )}

                    {/* Rodapé: badge + botões */}
                    <div className="flex items-center justify-between gap-2 mt-auto pt-2 border-t border-escuro-600">
                      <BadgeSituacao situacao={imovel.situacao} />
                      <div className="flex gap-1.5">
                        <Link
                          href={comVoltar(`/imoveis/${imovel.id}`)}
                          className="py-1 px-2.5 rounded-lg bg-escuro-700 hover:bg-escuro-600 border border-escuro-400 text-xs text-escuro-100 hover:text-white transition-colors"
                        >
                          Ver
                        </Link>
                        {podeEscrever && (
                          <Link
                            href={comVoltar(`/imoveis/${imovel.id}/editar`)}
                            className="py-1 px-2.5 rounded-lg bg-dourado-400/10 hover:bg-dourado-400/20 border border-dourado-400/40 text-xs text-dourado-400 transition-colors"
                          >
                            Editar
                          </Link>
                        )}
                        {podeEscrever && (
                          <button
                            onClick={() => duplicar(imovel.id, imovel.codigoRef)}
                            disabled={duplicandoId === imovel.id}
                            className="py-1 px-2 rounded-lg bg-escuro-700 hover:bg-escuro-600 border border-escuro-400 text-escuro-100 hover:text-white transition-colors disabled:opacity-50"
                            title="Duplicar"
                          >
                            {duplicandoId === imovel.id ? (
                              <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                              </svg>
                            ) : (
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5a3.375 3.375 0 00-3.375-3.375H9.75" />
                              </svg>
                            )}
                          </button>
                        )}
                        {podeExcluir && (
                          <button
                            onClick={() => excluir(imovel.id, imovel.codigoRef)}
                            disabled={excluindoId === imovel.id}
                            className="py-1 px-2 rounded-lg bg-red-900/20 hover:bg-red-900/40 border border-red-800/40 text-red-400 transition-colors disabled:opacity-50"
                            title="Excluir"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Paginação */}
          {totalPaginas > 1 && (
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => mudarPagina(Math.max(1, pagina - 1))}
                disabled={pagina === 1}
                className="btn-secondary text-sm px-4 disabled:opacity-40"
              >
                ← Anterior
              </button>
              <span className="text-escuro-200 text-sm">
                Página {pagina} de {totalPaginas}
              </span>
              <button
                onClick={() => mudarPagina(Math.min(totalPaginas, pagina + 1))}
                disabled={pagina === totalPaginas}
                className="btn-secondary text-sm px-4 disabled:opacity-40"
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

export default function ImoveisPage() {
  return (
    <Suspense>
      <ImoveisContent />
    </Suspense>
  )
}
