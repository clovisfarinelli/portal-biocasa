'use client'

import { useState, useEffect } from 'react'

// ─── tipos ────────────────────────────────────────────────────────────────────

interface Unidade {
  id:            string
  nome:          string
  estado:        string
  limiteAnalises: number
  analisesMes:   number
  ativo:         boolean
  proprietario:  { id: string; nome: string; email: string; ativo: boolean } | null
}

// ─── helpers ──────────────────────────────────────────────────────────────────

function Spinner() {
  return <div className="w-4 h-4 border-2 border-dourado-400 border-t-transparent rounded-full animate-spin" />
}

function StatusPill({ ativo }: { ativo: boolean }) {
  return (
    <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${
      ativo ? 'bg-emerald-400/10 text-emerald-400' : 'bg-red-400/10 text-red-400'
    }`}>
      {ativo ? 'Ativa' : 'Inativa'}
    </span>
  )
}

// ─── seção: configurações gerais ─────────────────────────────────────────────

function SecaoGeral() {
  const [cambio,      setCambio]      = useState('')
  const [limiteFotos, setLimiteFotos] = useState('')
  const [salvando,    setSalvando]    = useState(false)
  const [carregando,  setCarregando]  = useState(true)
  const [ok,          setOk]          = useState(false)
  const [erro,        setErro]        = useState('')

  useEffect(() => {
    fetch('/api/configuracoes')
      .then(r => r.json())
      .then(d => {
        setCambio(d.cambio_dolar_real ?? '5.50')
        setLimiteFotos(d.limite_fotos_imovel ?? '20')
        setCarregando(false)
      })
      .catch(() => setCarregando(false))
  }, [])

  async function salvar() {
    const valorCambio = parseFloat(cambio.replace(',', '.'))
    const valorLimite = parseInt(limiteFotos)
    if (isNaN(valorCambio) || valorCambio <= 0) { setErro('Câmbio inválido'); return }
    if (isNaN(valorLimite) || valorLimite < 1)  { setErro('Limite de fotos inválido'); return }
    setErro(''); setSalvando(true)
    try {
      const res = await fetch('/api/configuracoes', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cambio_dolar_real:    String(valorCambio),
          limite_fotos_imovel:  String(valorLimite),
        }),
      })
      if (!res.ok) throw new Error()
      setOk(true)
      setTimeout(() => setOk(false), 2500)
    } catch {
      setErro('Falha ao salvar')
    } finally {
      setSalvando(false)
    }
  }

  return (
    <div className="bg-escuro-600 border border-escuro-500 rounded-xl p-6">
      <h3 className="text-white font-semibold mb-1">Configurações Gerais</h3>
      <p className="text-escuro-300 text-sm mb-5">Parâmetros globais do sistema</p>

      <div className="max-w-xs space-y-4">
        <div>
          <label className="block text-sm text-escuro-200 mb-1.5">
            Taxa de câmbio USD → BRL
          </label>
          {carregando ? (
            <div className="h-9 bg-escuro-500 rounded-lg animate-pulse" />
          ) : (
            <div className="relative w-36">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-escuro-300 text-sm">R$</span>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={cambio}
                onChange={e => { setCambio(e.target.value); setOk(false); setErro('') }}
                className="w-full bg-escuro-500 border border-escuro-400 text-white text-sm rounded-lg pl-9 pr-3 py-2 focus:outline-none focus:border-dourado-400"
              />
            </div>
          )}
          {erro && <p className="text-red-400 text-xs mt-1">{erro}</p>}
          {ok  && <p className="text-emerald-400 text-xs mt-1">Câmbio atualizado com sucesso</p>}
          <p className="text-escuro-400 text-xs mt-2">
            Usado para converter o custo das análises de USD para BRL.
          </p>
        </div>

        <div>
          <label className="block text-sm text-escuro-200 mb-1.5">
            Limite de fotos por imóvel
          </label>
          {carregando ? (
            <div className="h-9 w-32 bg-escuro-500 rounded-lg animate-pulse" />
          ) : (
            <input
              type="number"
              min="1"
              max="200"
              value={limiteFotos}
              onChange={e => { setLimiteFotos(e.target.value); setOk(false); setErro('') }}
              className="w-24 bg-escuro-500 border border-escuro-400 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-dourado-400 text-center"
            />
          )}
          <p className="text-escuro-400 text-xs mt-2">
            Máximo de fotos que podem ser enviadas por imóvel. Padrão: 20.
          </p>
        </div>

        <div className="pt-2">
          <button
            onClick={salvar}
            disabled={salvando || carregando}
            className="flex items-center gap-2 px-4 py-2 bg-dourado-400 text-escuro-700 text-sm font-medium rounded-lg hover:bg-dourado-300 disabled:opacity-60 transition-colors"
          >
            {salvando ? <Spinner /> : null}
            Salvar configurações
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── seção: unidades ──────────────────────────────────────────────────────────

function SecaoUnidades() {
  const [unidades,   setUnidades]   = useState<Unidade[]>([])
  const [carregando, setCarregando] = useState(true)
  // limites editados: { [id]: valor_string }
  const [limites,    setLimites]    = useState<Record<string, string>>({})
  // salvando por id
  const [salvando,   setSalvando]   = useState<Record<string, boolean>>({})
  const [feedback,   setFeedback]   = useState<Record<string, { ok?: boolean; erro?: string }>>({})

  useEffect(() => {
    fetch('/api/unidades')
      .then(r => r.json())
      .then((d: Unidade[]) => {
        setUnidades(d)
        const limInicial: Record<string, string> = {}
        d.forEach(u => { limInicial[u.id] = String(u.limiteAnalises) })
        setLimites(limInicial)
        setCarregando(false)
      })
      .catch(() => setCarregando(false))
  }, [])

  async function salvarLimite(id: string) {
    const valor = parseInt(limites[id])
    if (isNaN(valor) || valor < 1) {
      setFeedback(f => ({ ...f, [id]: { erro: 'Valor inválido' } }))
      return
    }
    setSalvando(s => ({ ...s, [id]: true }))
    setFeedback(f => ({ ...f, [id]: {} }))
    try {
      const res = await fetch(`/api/unidades/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ limiteAnalises: valor }),
      })
      if (!res.ok) throw new Error()
      setUnidades(us => us.map(u => u.id === id ? { ...u, limiteAnalises: valor } : u))
      setFeedback(f => ({ ...f, [id]: { ok: true } }))
      setTimeout(() => setFeedback(f => ({ ...f, [id]: {} })), 2000)
    } catch {
      setFeedback(f => ({ ...f, [id]: { erro: 'Falha ao salvar' } }))
    } finally {
      setSalvando(s => ({ ...s, [id]: false }))
    }
  }

  async function toggleAtivo(u: Unidade) {
    setSalvando(s => ({ ...s, [u.id]: true }))
    try {
      const res = await fetch(`/api/unidades/${u.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ativo: !u.ativo }),
      })
      if (!res.ok) throw new Error()
      setUnidades(us => us.map(x => x.id === u.id ? { ...x, ativo: !u.ativo } : x))
    } catch {
      setFeedback(f => ({ ...f, [u.id]: { erro: 'Falha ao alterar status' } }))
    } finally {
      setSalvando(s => ({ ...s, [u.id]: false }))
    }
  }

  return (
    <div className="bg-escuro-600 border border-escuro-500 rounded-xl overflow-hidden">
      <div className="px-6 py-5 border-b border-escuro-500">
        <h3 className="text-white font-semibold">Unidades</h3>
        <p className="text-escuro-300 text-sm mt-0.5">Limites de análises e status de cada unidade</p>
      </div>

      {carregando ? (
        <div className="flex items-center justify-center py-12">
          <Spinner />
        </div>
      ) : unidades.length === 0 ? (
        <p className="text-center text-escuro-300 text-sm py-10">Nenhuma unidade cadastrada</p>
      ) : (
        <div className="divide-y divide-escuro-500">
          {unidades.map(u => {
            const pct = u.limiteAnalises > 0 ? Math.min(100, Math.round(u.analisesMes / u.limiteAnalises * 100)) : 0
            const corBarra = pct >= 90 ? 'bg-red-500' : pct >= 70 ? 'bg-amber-500' : 'bg-emerald-500'
            const fb = feedback[u.id] ?? {}

            return (
              <div key={u.id} className="px-6 py-4">
                {/* cabeçalho da unidade */}
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-white font-medium">{u.nome}</span>
                      <StatusPill ativo={u.ativo} />
                    </div>
                    {u.proprietario && (
                      <p className="text-xs text-escuro-300 mt-0.5 truncate">
                        {u.proprietario.nome} · {u.proprietario.email}
                      </p>
                    )}
                  </div>

                  <button
                    onClick={() => toggleAtivo(u)}
                    disabled={salvando[u.id]}
                    className={`flex-shrink-0 text-xs px-3 py-1.5 rounded-lg border transition-colors disabled:opacity-50 ${
                      u.ativo
                        ? 'border-red-500/40 text-red-400 hover:bg-red-500/10'
                        : 'border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10'
                    }`}
                  >
                    {u.ativo ? 'Desativar' : 'Reativar'}
                  </button>
                </div>

                {/* limite + barra de consumo */}
                <div className="mt-3 flex items-end gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between text-xs text-escuro-300 mb-1">
                      <span>Análises este mês</span>
                      <span className={pct >= 90 ? 'text-red-400 font-medium' : ''}>{u.analisesMes} / {u.limiteAnalises}</span>
                    </div>
                    <div className="h-1.5 bg-escuro-500 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full transition-all ${corBarra}`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>

                  {/* input de limite */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <label className="text-xs text-escuro-300 whitespace-nowrap">Limite:</label>
                    <input
                      type="number"
                      min="1"
                      value={limites[u.id] ?? ''}
                      onChange={e => { setLimites(l => ({ ...l, [u.id]: e.target.value })); setFeedback(f => ({ ...f, [u.id]: {} })) }}
                      className="w-20 bg-escuro-500 border border-escuro-400 text-white text-sm rounded-lg px-2 py-1 text-center focus:outline-none focus:border-dourado-400"
                    />
                    <button
                      onClick={() => salvarLimite(u.id)}
                      disabled={salvando[u.id] || String(u.limiteAnalises) === limites[u.id]}
                      className="text-xs px-3 py-1 bg-dourado-400/10 text-dourado-400 border border-dourado-400/30 rounded-lg hover:bg-dourado-400/20 disabled:opacity-40 transition-colors"
                    >
                      {salvando[u.id] ? '...' : 'OK'}
                    </button>
                  </div>
                </div>

                {/* feedback inline */}
                {fb.erro && <p className="text-red-400 text-xs mt-1">{fb.erro}</p>}
                {fb.ok   && <p className="text-emerald-400 text-xs mt-1">Limite atualizado</p>}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─── componente principal ─────────────────────────────────────────────────────

export default function AbaConfiguracoes() {
  return (
    <div className="p-6 space-y-5">
      <div>
        <h2 className="text-white font-semibold text-lg">Configurações</h2>
        <p className="text-escuro-300 text-sm mt-0.5">Parâmetros globais e limites por unidade</p>
      </div>
      <SecaoGeral />
      <SecaoUnidades />
    </div>
  )
}
