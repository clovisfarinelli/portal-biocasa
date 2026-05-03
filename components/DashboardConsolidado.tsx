'use client'

import { useEffect, useState } from 'react'

type Metrica = {
  id: string
  nome: string
  analisesMes: number
  limiteAnalises: number
  analisesNoPeriodo: number
  custoNoPeriodo: number
  imoveisCadastrados: number
  usuariosAtivos: number
}

type PontoMensal = {
  mes: string
  label: string
  analises: number
  custo: number
}

type Dados = {
  metricas: Metrica[]
  evolucaoMensal: PontoMensal[]
}

const OPCOES_PERIODO = [
  { label: '1 mês',   value: 1  },
  { label: '3 meses', value: 3  },
  { label: '6 meses', value: 6  },
  { label: '12 meses', value: 12 },
]

export default function DashboardConsolidado() {
  const [dados, setDados]               = useState<Dados | null>(null)
  const [carregando, setCarregando]     = useState(true)
  const [erro, setErro]                 = useState<string | null>(null)
  const [unidadeId, setUnidadeId]       = useState('')
  const [meses, setMeses]               = useState(6)
  const [todasUnidades, setTodasUnidades] = useState<{ id: string; nome: string }[]>([])

  useEffect(() => {
    let cancelado = false

    async function carregar() {
      setCarregando(true)
      setErro(null)
      try {
        const params = new URLSearchParams({ meses: String(meses) })
        if (unidadeId) params.set('unidadeId', unidadeId)
        const res = await fetch(`/api/dashboard-consolidado?${params}`)
        const data = await res.json()
        if (cancelado) return
        if (!res.ok) throw new Error(data.erro ?? 'Erro ao carregar dados')
        setDados(data)
        if (!unidadeId) setTodasUnidades(data.metricas.map((m: Metrica) => ({ id: m.id, nome: m.nome })))
      } catch (e: any) {
        if (!cancelado) setErro(e.message)
      } finally {
        if (!cancelado) setCarregando(false)
      }
    }

    carregar()
    return () => { cancelado = true }
  }, [unidadeId, meses])

  const totais = dados ? {
    analises: dados.metricas.reduce((s, m) => s + m.analisesNoPeriodo, 0),
    custo:    dados.metricas.reduce((s, m) => s + m.custoNoPeriodo, 0),
    imoveis:  dados.metricas.reduce((s, m) => s + m.imoveisCadastrados, 0),
    usuarios: dados.metricas.reduce((s, m) => s + m.usuariosAtivos, 0),
  } : null

  const maxAnalises = dados ? Math.max(...dados.evolucaoMensal.map(m => m.analises), 1) : 1
  const maxCusto    = dados ? Math.max(...dados.evolucaoMensal.map(m => m.custo), 0.01) : 0.01

  if (erro) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 font-medium mb-2">Erro ao carregar dados</p>
          <p className="text-escuro-300 text-sm mb-4">{erro}</p>
          <button
            onClick={() => setMeses(m => m)}
            className="text-dourado-400 underline text-sm"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">

      {/* Cabeçalho + Filtros */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white">Dashboard Consolidado</h1>
          <p className="text-escuro-300 text-sm mt-0.5">Visão geral de todas as unidades</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {todasUnidades.length > 1 && (
            <select
              value={unidadeId}
              onChange={e => setUnidadeId(e.target.value)}
              className="text-sm bg-escuro-500 border border-escuro-400 text-white rounded-lg px-3 py-2 focus:outline-none focus:border-dourado-400"
            >
              <option value="">Todas as unidades</option>
              {todasUnidades.map(u => (
                <option key={u.id} value={u.id}>{u.nome}</option>
              ))}
            </select>
          )}
          <div className="flex bg-escuro-500 border border-escuro-400 rounded-lg overflow-hidden">
            {OPCOES_PERIODO.map(op => (
              <button
                key={op.value}
                onClick={() => setMeses(op.value)}
                className={`px-3 py-2 text-xs font-medium transition-colors ${
                  meses === op.value
                    ? 'bg-dourado-400 text-escuro-600'
                    : 'text-escuro-200 hover:text-white'
                }`}
              >
                {op.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {carregando ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-dourado-400 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : totais && dados ? (
        <>
          {/* Cards de totais */}
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
            <CardMetrica
              titulo="Análises no período"
              valor={totais.analises}
              sub={`últimos ${meses} ${meses === 1 ? 'mês' : 'meses'}`}
              icone={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />}
            />
            <CardMetrica
              titulo="Custo de IA"
              valor={`R$ ${totais.custo.toFixed(2)}`}
              sub={`últimos ${meses} ${meses === 1 ? 'mês' : 'meses'}`}
              icone={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />}
            />
            <CardMetrica
              titulo="Imóveis cadastrados"
              valor={totais.imoveis}
              sub="total ativo"
              icone={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />}
            />
            <CardMetrica
              titulo="Usuários ativos"
              valor={totais.usuarios}
              sub="total"
              icone={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />}
            />
          </div>

          {/* Tabela por unidade (apenas quando há mais de 1) */}
          {dados.metricas.length > 1 && (
            <div className="card overflow-x-auto">
              <h2 className="text-white font-semibold mb-4">Por unidade</h2>
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-escuro-300 text-left border-b border-escuro-500">
                    <th className="pb-3 font-medium pr-4">Unidade</th>
                    <th className="pb-3 font-medium text-right pr-4">Análises (período)</th>
                    <th className="pb-3 font-medium text-right pr-4">Mês atual</th>
                    <th className="pb-3 font-medium text-right pr-4">Limite</th>
                    <th className="pb-3 font-medium text-right pr-4">Custo IA</th>
                    <th className="pb-3 font-medium text-right pr-4">Imóveis</th>
                    <th className="pb-3 font-medium text-right">Usuários</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-escuro-500">
                  {dados.metricas.map(m => (
                    <tr key={m.id} className="text-escuro-100">
                      <td className="py-3 pr-4 font-medium text-white">{m.nome}</td>
                      <td className="py-3 pr-4 text-right">{m.analisesNoPeriodo}</td>
                      <td className="py-3 pr-4 text-right">
                        <span className={m.analisesMes >= m.limiteAnalises ? 'text-red-400 font-semibold' : ''}>
                          {m.analisesMes}
                        </span>
                      </td>
                      <td className="py-3 pr-4 text-right text-escuro-300">{m.limiteAnalises}</td>
                      <td className="py-3 pr-4 text-right">R$ {m.custoNoPeriodo.toFixed(2)}</td>
                      <td className="py-3 pr-4 text-right">{m.imoveisCadastrados}</td>
                      <td className="py-3 text-right">{m.usuariosAtivos}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Gráficos de evolução mensal */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            <GraficoBarras
              titulo="Análises por mês"
              pontos={dados.evolucaoMensal.map(m => ({ label: m.label, valor: m.analises }))}
              max={maxAnalises}
              formatarValor={v => String(v)}
              cor="bg-dourado-400"
            />
            <GraficoBarras
              titulo="Custo de IA por mês (R$)"
              pontos={dados.evolucaoMensal.map(m => ({ label: m.label, valor: m.custo }))}
              max={maxCusto}
              formatarValor={v => `R$ ${v.toFixed(2)}`}
              cor="bg-blue-500"
            />
          </div>
        </>
      ) : null}
    </div>
  )
}

function CardMetrica({
  titulo, valor, sub, icone,
}: {
  titulo: string
  valor: string | number
  sub: string
  icone: React.ReactNode
}) {
  return (
    <div className="card">
      <div className="flex items-start justify-between mb-3">
        <p className="text-escuro-300 text-xs uppercase tracking-wider leading-tight pr-2">{titulo}</p>
        <div className="w-8 h-8 rounded-lg bg-dourado-400/10 flex items-center justify-center flex-shrink-0">
          <svg className="w-4 h-4 text-dourado-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            {icone}
          </svg>
        </div>
      </div>
      <p className="text-2xl font-bold text-white">{valor}</p>
      <p className="text-escuro-300 text-xs mt-1">{sub}</p>
    </div>
  )
}

function GraficoBarras({
  titulo, pontos, max, formatarValor, cor,
}: {
  titulo: string
  pontos: { label: string; valor: number }[]
  max: number
  formatarValor: (v: number) => string
  cor: string
}) {
  return (
    <div className="card">
      <h2 className="text-white font-semibold mb-4">{titulo}</h2>
      <div className="flex items-end gap-1.5" style={{ height: '120px' }}>
        {pontos.map((p, i) => (
          <div key={i} className="flex-1 flex flex-col items-center justify-end gap-1 h-full min-w-0">
            {p.valor > 0 && (
              <span className="text-escuro-300 text-xs truncate w-full text-center">
                {formatarValor(p.valor)}
              </span>
            )}
            <div
              className={`w-full ${cor} rounded-t`}
              style={{ height: `${Math.max((p.valor / max) * 80, p.valor > 0 ? 4 : 0)}%` }}
            />
            <span className="text-escuro-400 text-xs whitespace-nowrap overflow-hidden">{p.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
