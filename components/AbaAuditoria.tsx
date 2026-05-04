'use client'

import { useState, useEffect, useCallback } from 'react'

// ─── tipos ───────────────────────────────────────────────────────────────────

interface LogEntry {
  id:        string
  acao:      string
  recurso:   string | null
  detalhes:  string | null
  ip:        string | null
  criadoEm:  string
  usuario:   {
    id:       string
    nome:     string
    email:    string
    perfil:   string
    unidade:  { nome: string } | null
  } | null
}

interface Opcao { id: string; nome: string }

interface Resposta {
  logs:      LogEntry[]
  total:     number
  pagina:    number
  porPagina: number
  usuarios:  (Opcao & { email: string })[]
  unidades:  Opcao[]
}

// ─── configuração visual de cada ação ────────────────────────────────────────

const CONFIG_ACAO: Record<string, { label: string; cor: string; icone: string; sensivel?: true }> = {
  login:                 { label: 'Login',               cor: 'text-emerald-400 bg-emerald-400/10', icone: '→' },
  logout:                { label: 'Logout',              cor: 'text-slate-400 bg-slate-400/10',     icone: '←' },
  analise_criada:        { label: 'Análise gerada',      cor: 'text-violet-400 bg-violet-400/10',   icone: '🔍' },
  arquivo_enviado:       { label: 'Arquivo enviado',     cor: 'text-sky-400 bg-sky-400/10',         icone: '📎' },
  usuario_criado:        { label: 'Usuário criado',      cor: 'text-blue-400 bg-blue-400/10',       icone: '👤' },
  convite_enviado:       { label: 'Convite enviado',     cor: 'text-blue-300 bg-blue-300/10',       icone: '✉️' },
  usuario_desativado:    { label: 'Usuário desativado',  cor: 'text-red-400 bg-red-400/10',         icone: '🚫', sensivel: true },
  usuario_reativado:     { label: 'Usuário reativado',   cor: 'text-amber-400 bg-amber-400/10',     icone: '✅' },
  configuracao_alterada: { label: 'Config. alterada',    cor: 'text-orange-400 bg-orange-400/10',   icone: '⚙️', sensivel: true },
  imovel_criado:         { label: 'Imóvel cadastrado',   cor: 'text-teal-400 bg-teal-400/10',       icone: '🏠' },
  imovel_editado:        { label: 'Imóvel editado',      cor: 'text-teal-300 bg-teal-300/10',       icone: '✏️' },
  imovel_excluido:       { label: 'Imóvel excluído',     cor: 'text-red-400 bg-red-400/10',         icone: '🗑️', sensivel: true },
  exportacao:            { label: 'Exportação',          cor: 'text-rose-400 bg-rose-400/10',       icone: '📤', sensivel: true },
}

const ACOES_OPCOES = Object.entries(CONFIG_ACAO).map(([id, c]) => ({ id, label: c.label }))

function badgeAcao(acao: string) {
  const cfg = CONFIG_ACAO[acao] ?? { label: acao, cor: 'text-escuro-300 bg-escuro-500', icone: '•' }
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${cfg.cor}`}>
      <span>{cfg.icone}</span>
      {cfg.label}
      {cfg.sensivel && <span className="ml-0.5 text-red-400 font-bold">!</span>}
    </span>
  )
}

function badgePerfil(perfil: string) {
  const cores: Record<string, string> = {
    MASTER:      'text-dourado-400 bg-dourado-400/10',
    PROPRIETARIO:'text-amber-300 bg-amber-300/10',
    ASSISTENTE:  'text-sky-400 bg-sky-400/10',
    ESPECIALISTA:'text-violet-400 bg-violet-400/10',
    CORRETOR:    'text-teal-400 bg-teal-400/10',
  }
  return (
    <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${cores[perfil] ?? 'text-escuro-300 bg-escuro-500'}`}>
      {perfil}
    </span>
  )
}

function formatarData(iso: string) {
  const d = new Date(iso)
  return d.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

// ─── componente principal ─────────────────────────────────────────────────────

export default function AbaAuditoria() {
  const [dados,      setDados]     = useState<Resposta | null>(null)
  const [carregando, setCarregando] = useState(true)
  const [pagina,     setPagina]    = useState(1)

  const [filtros, setFiltros] = useState({
    usuarioId:  '',
    unidadeId:  '',
    acao:       '',
    recurso:    '',
    dataInicio: '',
    dataFim:    '',
  })

  const buscar = useCallback(async (pg = 1) => {
    setCarregando(true)
    const params = new URLSearchParams({ pagina: String(pg) })
    if (filtros.usuarioId)  params.set('usuarioId',  filtros.usuarioId)
    if (filtros.unidadeId)  params.set('unidadeId',  filtros.unidadeId)
    if (filtros.acao)       params.set('acao',        filtros.acao)
    if (filtros.recurso)    params.set('recurso',     filtros.recurso)
    if (filtros.dataInicio) params.set('dataInicio',  filtros.dataInicio)
    if (filtros.dataFim)    params.set('dataFim',     filtros.dataFim)

    try {
      const res = await fetch(`/api/logs?${params}`)
      if (res.ok) setDados(await res.json())
    } finally {
      setCarregando(false)
    }
  }, [filtros])

  useEffect(() => {
    setPagina(1)
    buscar(1)
  }, [filtros, buscar])

  function mudarPagina(nova: number) {
    setPagina(nova)
    buscar(nova)
  }

  function limparFiltros() {
    setFiltros({ usuarioId: '', unidadeId: '', acao: '', recurso: '', dataInicio: '', dataFim: '' })
  }

  const totalPaginas = dados ? Math.ceil(dados.total / dados.porPagina) : 0
  const filtroAtivo  = Object.values(filtros).some(v => v !== '')

  return (
    <div className="p-6 space-y-5">

      {/* cabeçalho */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-white font-semibold text-lg">Auditoria</h2>
          <p className="text-escuro-300 text-sm mt-0.5">
            Registro de todas as ações do sistema
            {dados && <span className="ml-1 text-escuro-400">— {dados.total.toLocaleString('pt-BR')} evento{dados.total !== 1 ? 's' : ''}</span>}
          </p>
        </div>
        {filtroAtivo && (
          <button
            onClick={limparFiltros}
            className="text-xs text-escuro-300 hover:text-white border border-escuro-500 hover:border-escuro-400 px-3 py-1.5 rounded-lg transition-colors"
          >
            Limpar filtros
          </button>
        )}
      </div>

      {/* filtros */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* usuário */}
        <select
          value={filtros.usuarioId}
          onChange={e => setFiltros(f => ({ ...f, usuarioId: e.target.value }))}
          className="col-span-2 bg-escuro-500 border border-escuro-400 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-dourado-400"
        >
          <option value="">Todos os usuários</option>
          {dados?.usuarios.map(u => (
            <option key={u.id} value={u.id}>{u.nome}</option>
          ))}
        </select>

        {/* unidade */}
        <select
          value={filtros.unidadeId}
          onChange={e => setFiltros(f => ({ ...f, unidadeId: e.target.value }))}
          className="bg-escuro-500 border border-escuro-400 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-dourado-400"
        >
          <option value="">Todas as unidades</option>
          {dados?.unidades.map(u => (
            <option key={u.id} value={u.id}>{u.nome}</option>
          ))}
        </select>

        {/* ação */}
        <select
          value={filtros.acao}
          onChange={e => setFiltros(f => ({ ...f, acao: e.target.value }))}
          className="bg-escuro-500 border border-escuro-400 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-dourado-400"
        >
          <option value="">Todas as ações</option>
          {ACOES_OPCOES.map(a => (
            <option key={a.id} value={a.id}>{a.label}</option>
          ))}
        </select>

        {/* data início */}
        <input
          type="date"
          value={filtros.dataInicio}
          onChange={e => setFiltros(f => ({ ...f, dataInicio: e.target.value }))}
          className="bg-escuro-500 border border-escuro-400 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-dourado-400"
        />

        {/* data fim */}
        <input
          type="date"
          value={filtros.dataFim}
          onChange={e => setFiltros(f => ({ ...f, dataFim: e.target.value }))}
          className="bg-escuro-500 border border-escuro-400 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-dourado-400"
        />
      </div>

      {/* tabela / timeline */}
      <div className="bg-escuro-600 border border-escuro-500 rounded-xl overflow-hidden">
        {carregando ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-7 h-7 border-2 border-dourado-400 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : !dados || dados.logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-escuro-300">
            <svg className="w-10 h-10 mb-3 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <p className="text-sm">Nenhum evento encontrado</p>
            {filtroAtivo && <p className="text-xs mt-1 text-escuro-400">Tente ajustar os filtros</p>}
          </div>
        ) : (
          <div className="divide-y divide-escuro-500">
            {dados.logs.map((log, i) => {
              const sensivel = CONFIG_ACAO[log.acao]?.sensivel
              return (
                <div
                  key={log.id}
                  className={`flex items-start gap-4 px-5 py-3.5 hover:bg-escuro-500/40 transition-colors ${
                    sensivel ? 'border-l-2 border-red-500/40' : ''
                  }`}
                >
                  {/* data */}
                  <div className="flex-shrink-0 w-36 text-xs text-escuro-300 pt-0.5">
                    {formatarData(log.criadoEm)}
                  </div>

                  {/* ação */}
                  <div className="flex-shrink-0 w-44">
                    {badgeAcao(log.acao)}
                  </div>

                  {/* usuário */}
                  <div className="flex-1 min-w-0">
                    {log.usuario ? (
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm text-white font-medium truncate">{log.usuario.nome}</span>
                        {badgePerfil(log.usuario.perfil)}
                        {log.usuario.unidade && (
                          <span className="text-xs text-escuro-300">{log.usuario.unidade.nome}</span>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs text-escuro-400 italic">sistema</span>
                    )}
                    {log.detalhes && (
                      <p className="text-xs text-escuro-300 mt-0.5 truncate max-w-sm" title={log.detalhes}>
                        {log.detalhes}
                      </p>
                    )}
                  </div>

                  {/* IP */}
                  {log.ip && (
                    <div className="flex-shrink-0 text-xs text-escuro-400 font-mono pt-0.5">
                      {log.ip}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* paginação */}
      {totalPaginas > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-escuro-300">
            Página {pagina} de {totalPaginas} · {dados?.total.toLocaleString('pt-BR')} eventos
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => mudarPagina(pagina - 1)}
              disabled={pagina <= 1}
              className="px-3 py-1.5 text-xs border border-escuro-500 rounded-lg text-white disabled:opacity-40 hover:border-escuro-400 transition-colors"
            >
              Anterior
            </button>
            <button
              onClick={() => mudarPagina(pagina + 1)}
              disabled={pagina >= totalPaginas}
              className="px-3 py-1.5 text-xs border border-escuro-500 rounded-lg text-white disabled:opacity-40 hover:border-escuro-400 transition-colors"
            >
              Próxima
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
