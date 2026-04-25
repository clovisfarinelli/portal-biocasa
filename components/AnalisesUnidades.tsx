'use client'

import { useState, useEffect, useCallback } from 'react'
import { Session } from 'next-auth'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { formatarMoeda } from '@/lib/utils'

interface Mensagem { role: 'user' | 'model'; content: string }

interface Analise {
  id: string
  criadoEm: string
  inscricaoImobiliaria?: string
  margemAlvo?: number
  statusValidacao: string
  custoBrl: number
  tokensInput: number
  tokensOutput: number
  cidade?: { nome: string }
  usuario?: { nome: string }
  unidade?: { nome: string }
  conteudoConversa?: Mensagem[]
}

interface Unidade { id: string; nome: string }
interface UsuarioOpt { id: string; nome: string; perfil: string }

const COR_STATUS: Record<string, string> = {
  PENDENTE:  'text-yellow-300 bg-yellow-900/30 border-yellow-800',
  VALIDA:    'text-green-300 bg-green-900/30 border-green-800',
  INVALIDA:  'text-red-300 bg-red-900/30 border-red-800',
}

function gerarMeses(): { valor: string; label: string }[] {
  const hoje = new Date()
  const meses = []
  for (let i = 0; i < 12; i++) {
    const d = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1)
    const valor = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    const label = d.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
    meses.push({ valor, label: label.charAt(0).toUpperCase() + label.slice(1) })
  }
  return meses
}

export default function AnalisesUnidades({ session }: { session: Session }) {
  const [analises, setAnalises] = useState<Analise[]>([])
  const [total, setTotal] = useState(0)
  const [pagina, setPagina] = useState(1)
  const [carregando, setCarregando] = useState(true)

  const [unidades, setUnidades] = useState<Unidade[]>([])
  const [usuarios, setUsuarios] = useState<UsuarioOpt[]>([])

  const [filtroUnidade, setFiltroUnidade] = useState('')
  const [filtroMes, setFiltroMes] = useState('')
  const [filtroUsuario, setFiltroUsuario] = useState('')

  const [modalAnalise, setModalAnalise] = useState<Analise | null>(null)
  const [carregandoModal, setCarregandoModal] = useState(false)

  const meses = gerarMeses()
  const POR_PAGINA = 50

  // Carrega dados de suporte
  useEffect(() => {
    fetch('/api/unidades').then(r => r.json()).then(data => setUnidades(data.map((u: any) => ({ id: u.id, nome: u.nome }))))
    fetch('/api/usuarios').then(r => r.json()).then(data => setUsuarios(Array.isArray(data) ? data : []))
  }, [])

  const carregarAnalises = useCallback(async (pg = 1) => {
    setCarregando(true)
    const params = new URLSearchParams({ pagina: String(pg), porPagina: String(POR_PAGINA) })
    if (filtroUnidade) params.set('unidadeId', filtroUnidade)
    if (filtroMes) params.set('mes', filtroMes)
    if (filtroUsuario) params.set('usuarioId', filtroUsuario)

    const res = await fetch(`/api/analises?${params}`)
    if (res.ok) {
      const data = await res.json()
      setAnalises(data.analises ?? [])
      setTotal(data.total ?? 0)
    }
    setCarregando(false)
  }, [filtroUnidade, filtroMes, filtroUsuario])

  useEffect(() => {
    setPagina(1)
    carregarAnalises(1)
  }, [filtroUnidade, filtroMes, filtroUsuario])

  async function abrirAnalise(analise: Analise) {
    setCarregandoModal(true)
    setModalAnalise({ ...analise, conteudoConversa: undefined })
    const res = await fetch(`/api/analises/${analise.id}`)
    if (res.ok) {
      const data = await res.json()
      setModalAnalise({ ...analise, conteudoConversa: data.conteudoConversa ?? [] })
    }
    setCarregandoModal(false)
  }

  const totalPaginas = Math.ceil(total / POR_PAGINA)
  const especialistas = usuarios.filter(u => u.perfil === 'ESPECIALISTA' || u.perfil === 'PROPRIETARIO')

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Análises das Unidades</h1>
        <p className="text-escuro-200 text-sm mt-1">Todas as análises do sistema — {total} registros</p>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-3 mb-5">
        <select
          value={filtroUnidade}
          onChange={e => setFiltroUnidade(e.target.value)}
          className="input-field w-auto text-sm py-2"
        >
          <option value="">Todas as unidades</option>
          {unidades.map(u => <option key={u.id} value={u.id}>{u.nome}</option>)}
        </select>

        <select
          value={filtroMes}
          onChange={e => setFiltroMes(e.target.value)}
          className="input-field w-auto text-sm py-2"
        >
          <option value="">Todos os períodos</option>
          {meses.map(m => <option key={m.valor} value={m.valor}>{m.label}</option>)}
        </select>

        <select
          value={filtroUsuario}
          onChange={e => setFiltroUsuario(e.target.value)}
          className="input-field w-auto text-sm py-2"
        >
          <option value="">Todos os analistas</option>
          {especialistas.map(u => <option key={u.id} value={u.id}>{u.nome} ({u.perfil})</option>)}
        </select>

        {(filtroUnidade || filtroMes || filtroUsuario) && (
          <button
            onClick={() => { setFiltroUnidade(''); setFiltroMes(''); setFiltroUsuario('') }}
            className="text-xs text-escuro-300 hover:text-white px-3 py-2 rounded-lg border border-escuro-500 hover:border-escuro-400 transition-colors"
          >
            Limpar filtros
          </button>
        )}
      </div>

      {/* Tabela */}
      <div className="card overflow-hidden p-0">
        {carregando ? (
          <div className="p-10 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-dourado-400 mx-auto" />
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-escuro-500 bg-escuro-700">
                    {['Inscrição / Cidade', 'Data', 'Analista', 'Unidade', 'Status', 'Custo'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-escuro-200 uppercase tracking-wider whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-escuro-500">
                  {analises.map(a => (
                    <tr
                      key={a.id}
                      onClick={() => abrirAnalise(a)}
                      className="hover:bg-escuro-500/40 cursor-pointer transition-colors"
                    >
                      <td className="px-4 py-3">
                        <p className="text-sm text-white font-medium">{a.inscricaoImobiliaria ?? '—'}</p>
                        <p className="text-xs text-escuro-300">{a.cidade?.nome ?? 'Sem cidade'}</p>
                      </td>
                      <td className="px-4 py-3 text-sm text-escuro-200 whitespace-nowrap">
                        {new Date(a.criadoEm).toLocaleDateString('pt-BR')}
                        <p className="text-xs text-escuro-400">{new Date(a.criadoEm).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</p>
                      </td>
                      <td className="px-4 py-3 text-sm text-escuro-200">{a.usuario?.nome ?? '—'}</td>
                      <td className="px-4 py-3 text-sm text-escuro-200">{a.unidade?.nome ?? '—'}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-1 rounded-full border font-medium ${COR_STATUS[a.statusValidacao] ?? ''}`}>
                          {a.statusValidacao}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-dourado-400 font-semibold whitespace-nowrap">
                        {formatarMoeda(a.custoBrl)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {analises.length === 0 && (
                <div className="p-10 text-center text-escuro-300 text-sm">Nenhuma análise encontrada</div>
              )}
            </div>

            {/* Paginação */}
            {totalPaginas > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-escuro-500">
                <span className="text-xs text-escuro-300">
                  Página {pagina} de {totalPaginas} · {total} análises
                </span>
                <div className="flex gap-2">
                  <button
                    disabled={pagina === 1}
                    onClick={() => { const p = pagina - 1; setPagina(p); carregarAnalises(p) }}
                    className="btn-secondary text-xs px-3 py-1.5 disabled:opacity-40"
                  >
                    Anterior
                  </button>
                  <button
                    disabled={pagina >= totalPaginas}
                    onClick={() => { const p = pagina + 1; setPagina(p); carregarAnalises(p) }}
                    className="btn-secondary text-xs px-3 py-1.5 disabled:opacity-40"
                  >
                    Próxima
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modal de conversa */}
      {modalAnalise && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-start justify-end" onClick={() => setModalAnalise(null)}>
          <div
            className="w-full max-w-2xl h-full bg-escuro-600 border-l border-escuro-500 flex flex-col shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            {/* Header modal */}
            <div className="flex items-start justify-between px-5 py-4 border-b border-escuro-500 flex-shrink-0">
              <div>
                <h2 className="text-base font-semibold text-white">
                  {modalAnalise.inscricaoImobiliaria ?? 'Análise'}
                </h2>
                <p className="text-xs text-escuro-300 mt-0.5">
                  {modalAnalise.cidade?.nome} · {modalAnalise.usuario?.nome} · {modalAnalise.unidade?.nome}
                </p>
                <p className="text-xs text-escuro-400 mt-0.5">
                  {new Date(modalAnalise.criadoEm).toLocaleString('pt-BR')} · {formatarMoeda(modalAnalise.custoBrl)}
                  {' · '}
                  <span className={`text-xs font-medium ${COR_STATUS[modalAnalise.statusValidacao]?.split(' ')[0]}`}>
                    {modalAnalise.statusValidacao}
                  </span>
                </p>
              </div>
              <button
                onClick={() => setModalAnalise(null)}
                className="p-1.5 rounded-lg hover:bg-escuro-500 text-escuro-300 hover:text-white transition-colors flex-shrink-0 ml-3"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Conversa */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
              {carregandoModal ? (
                <div className="flex items-center justify-center h-32">
                  <div className="animate-spin rounded-full h-7 w-7 border-t-2 border-dourado-400" />
                </div>
              ) : modalAnalise.conteudoConversa?.length === 0 ? (
                <p className="text-escuro-300 text-sm italic">Conversa vazia</p>
              ) : (
                modalAnalise.conteudoConversa?.map((msg, i) => (
                  <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                    <div className={`w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold ${
                      msg.role === 'user' ? 'bg-dourado-400/20 text-dourado-400 border border-dourado-400/40' : 'bg-escuro-400 text-escuro-100'
                    }`}>
                      {msg.role === 'user' ? 'U' : 'IA'}
                    </div>
                    <div className={`max-w-[85%] rounded-xl px-3 py-2.5 text-sm ${
                      msg.role === 'user'
                        ? 'bg-dourado-400/10 border border-dourado-400/20 text-white rounded-tr-sm'
                        : 'bg-escuro-500 border border-escuro-400 text-escuro-100 rounded-tl-sm'
                    }`}>
                      {msg.role === 'model' ? (
                        <div className="markdown-content prose-sm">
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                        </div>
                      ) : (
                        <p className="whitespace-pre-wrap">{msg.content}</p>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
