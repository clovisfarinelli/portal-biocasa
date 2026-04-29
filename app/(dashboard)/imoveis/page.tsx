'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
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
  KITNET: 'Kitnet', STUDIO: 'Studio', PADRAO: 'Padrão',
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

export default function ImoveisPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const perfil = (session?.user as any)?.perfil as string | undefined

  const [imoveis, setImoveis] = useState<Imovel[]>([])
  const [total, setTotal] = useState(0)
  const [pagina, setPagina] = useState(1)
  const [carregando, setCarregando] = useState(true)
  const [excluindoId, setExcluindoId] = useState<string | null>(null)

  // Filtros
  const [busca, setBusca] = useState('')
  const [finalidade, setFinalidade] = useState('')
  const [tipo, setTipo] = useState('')
  const [modalidade, setModalidade] = useState('')
  const [situacao, setSituacao] = useState('')
  const [cidade, setCidade] = useState('')

  // Filtros aplicados (só buscam ao clicar Filtrar)
  const [filtrosAtivos, setFiltrosAtivos] = useState({
    busca: '', finalidade: '', tipo: '', modalidade: '', situacao: '', cidade: '',
  })

  const podeEscrever = ['MASTER', 'PROPRIETARIO', 'ASSISTENTE'].includes(perfil ?? '')
  const podeExcluir = perfil === 'MASTER'
  const totalPaginas = Math.ceil(total / 20)

  const buscarImoveis = useCallback(async (filtros: typeof filtrosAtivos, pg: number) => {
    setCarregando(true)
    const params = new URLSearchParams()
    params.set('pagina', String(pg))
    if (filtros.busca) params.set('busca', filtros.busca)
    if (filtros.finalidade) params.set('finalidade', filtros.finalidade)
    if (filtros.tipo) params.set('tipo', filtros.tipo)
    if (filtros.modalidade) params.set('modalidade', filtros.modalidade)
    if (filtros.situacao) params.set('situacao', filtros.situacao)
    if (filtros.cidade) params.set('cidade', filtros.cidade)

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
    setPagina(1)
    setFiltrosAtivos({ busca, finalidade, tipo, modalidade, situacao, cidade })
  }

  function limparFiltros() {
    setBusca(''); setFinalidade(''); setTipo(''); setModalidade(''); setSituacao(''); setCidade('')
    setPagina(1)
    setFiltrosAtivos({ busca: '', finalidade: '', tipo: '', modalidade: '', situacao: '', cidade: '' })
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

  const tiposResiencial = ['', 'CASA', 'APARTAMENTO', 'TERRENO', 'CHACARA']
  const tiposComercial = ['', 'SALA', 'LOJA', 'CASA_COMERCIAL', 'GALPAO']
  const tiposDisponiveis = finalidade === 'RESIDENCIAL' ? tiposResiencial
    : finalidade === 'COMERCIAL' ? tiposComercial
    : [...tiposResiencial, ...tiposComercial.slice(1)]

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
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-3">
          <input
            value={busca}
            onChange={e => setBusca(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && aplicarFiltros()}
            placeholder="Buscar por ref, nome, bairro..."
            className="input-field lg:col-span-2 text-sm"
          />
          <select value={finalidade} onChange={e => { setFinalidade(e.target.value); setTipo('') }} className="input-field text-sm">
            <option value="">Finalidade</option>
            <option value="RESIDENCIAL">Residencial</option>
            <option value="COMERCIAL">Comercial</option>
          </select>
          <select value={tipo} onChange={e => setTipo(e.target.value)} className="input-field text-sm">
            <option value="">Tipo</option>
            {tiposDisponiveis.filter(Boolean).map(t => (
              <option key={t} value={t}>{LABEL_TIPO[t] ?? t}</option>
            ))}
          </select>
          <select value={modalidade} onChange={e => setModalidade(e.target.value)} className="input-field text-sm">
            <option value="">Modalidade</option>
            <option value="VENDA">Venda</option>
            <option value="LOCACAO">Locação</option>
            <option value="AMBOS">Ambos</option>
          </select>
          <select value={situacao} onChange={e => setSituacao(e.target.value)} className="input-field text-sm">
            <option value="">Situação</option>
            <option value="DISPONIVEL">Disponível</option>
            <option value="VENDIDO">Vendido</option>
            <option value="ALUGADO">Alugado</option>
          </select>
        </div>
        <div className="flex items-center gap-3">
          <input
            value={cidade}
            onChange={e => setCidade(e.target.value)}
            placeholder="Cidade"
            className="input-field text-sm w-48"
          />
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
              Cadastrar primeiro imóvel
            </Link>
          )}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-6">
            {imoveis.map(imovel => {
              const foto = fotoPrincipal(imovel.fotos)
              const valorDisplay = imovel.modalidade === 'LOCACAO'
                ? (imovel.valorLocacao ? `${formatarMoeda(imovel.valorLocacao)}/mês` : null)
                : (imovel.valorVenda ? formatarMoeda(imovel.valorVenda) : null)

              return (
                <div key={imovel.id} className="card p-0 overflow-hidden flex flex-col hover:border-escuro-300 transition-colors">
                  {/* Foto */}
                  <div className="relative aspect-[4/3] bg-escuro-700 flex-shrink-0">
                    {foto ? (
                      <img src={`/api/imoveis/fotos/download?url=${encodeURIComponent(foto)}`} alt={imovel.codigoRef} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <svg className="w-12 h-12 text-escuro-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}
                    {/* Badges no canto */}
                    <div className="absolute top-2 left-2 flex flex-col gap-1">
                      <BadgeSituacao situacao={imovel.situacao} />
                    </div>
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
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <span className="text-dourado-400 font-bold text-sm">{imovel.codigoRef}</span>
                      <span className="text-escuro-300 text-xs">{LABEL_MODALIDADE[imovel.modalidade] ?? imovel.modalidade}</span>
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
                    {valorDisplay && (
                      <p className="text-white font-semibold text-sm mb-3">{valorDisplay}</p>
                    )}

                    {/* Botões */}
                    <div className="flex gap-2 mt-auto">
                      <Link
                        href={`/imoveis/${imovel.id}`}
                        className="flex-1 text-center py-1.5 rounded-lg bg-escuro-700 hover:bg-escuro-600 border border-escuro-400 text-xs text-escuro-100 hover:text-white transition-colors"
                      >
                        Ver
                      </Link>
                      {podeEscrever && (
                        <Link
                          href={`/imoveis/${imovel.id}/editar`}
                          className="flex-1 text-center py-1.5 rounded-lg bg-dourado-400/10 hover:bg-dourado-400/20 border border-dourado-400/40 text-xs text-dourado-400 transition-colors"
                        >
                          Editar
                        </Link>
                      )}
                      {podeExcluir && (
                        <button
                          onClick={() => excluir(imovel.id, imovel.codigoRef)}
                          disabled={excluindoId === imovel.id}
                          className="px-2.5 py-1.5 rounded-lg bg-red-900/20 hover:bg-red-900/40 border border-red-800/40 text-red-400 transition-colors disabled:opacity-50"
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
              )
            })}
          </div>

          {/* Paginação */}
          {totalPaginas > 1 && (
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => setPagina(p => Math.max(1, p - 1))}
                disabled={pagina === 1}
                className="btn-secondary text-sm px-4 disabled:opacity-40"
              >
                ← Anterior
              </button>
              <span className="text-escuro-200 text-sm">
                Página {pagina} de {totalPaginas}
              </span>
              <button
                onClick={() => setPagina(p => Math.min(totalPaginas, p + 1))}
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
