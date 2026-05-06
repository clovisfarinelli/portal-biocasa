'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface DadosRelatorio {
  total: number
  porStatus: { status: string; total: number }[]
  porBairro: { bairro: string; total: number }[]
  porCorretor: { corretor: string; total: number }[]
}

const STATUS_CORES: Record<string, string> = {
  DISPONIVEL: '#C9A84C',
  EM_NEGOCIACAO: '#3B82F6',
  RESERVADO: '#8B5CF6',
  VENDIDO: '#10B981',
  LOCADO: '#06B6D4',
  SUSPENSO: '#6B7280',
}

const STATUS_LABELS: Record<string, string> = {
  DISPONIVEL: 'Disponível',
  EM_NEGOCIACAO: 'Em Negociação',
  RESERVADO: 'Reservado',
  VENDIDO: 'Vendido',
  LOCADO: 'Locado',
  SUSPENSO: 'Suspenso',
}

function corDoStatus(status: string): string {
  return STATUS_CORES[status] ?? '#6B7280'
}

function labelDoStatus(status: string): string {
  return STATUS_LABELS[status] ?? status
}

function DonutChart({ dados }: { dados: { status: string; total: number }[] }) {
  const [hover, setHover] = useState<number | null>(null)
  const total = dados.reduce((s, d) => s + d.total, 0)

  if (total === 0) {
    return <p className="text-escuro-300 text-sm text-center py-8">Sem dados de status</p>
  }

  const cx = 80
  const cy = 80
  const r = 65
  const innerR = 42

  function polarToXY(angleDeg: number, radius: number) {
    const rad = (angleDeg - 90) * (Math.PI / 180)
    return { x: cx + radius * Math.cos(rad), y: cy + radius * Math.sin(rad) }
  }

  let startDeg = 0
  const segments = dados.map((d, i) => {
    const sweep = (d.total / total) * 360
    const endDeg = startDeg + sweep
    const s1 = polarToXY(startDeg, r)
    const e1 = polarToXY(endDeg, r)
    const s2 = polarToXY(endDeg, innerR)
    const e2 = polarToXY(startDeg, innerR)
    const large = sweep > 180 ? 1 : 0
    const path = [
      `M ${s1.x} ${s1.y}`,
      `A ${r} ${r} 0 ${large} 1 ${e1.x} ${e1.y}`,
      `L ${s2.x} ${s2.y}`,
      `A ${innerR} ${innerR} 0 ${large} 0 ${e2.x} ${e2.y}`,
      'Z',
    ].join(' ')
    const seg = { path, cor: corDoStatus(d.status), status: d.status, total: d.total, index: i }
    startDeg = endDeg
    return seg
  })

  const hoverSeg = hover !== null ? segments[hover] : null

  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 160 160" className="w-44 h-44">
        {segments.map((s) => (
          <path
            key={s.index}
            d={s.path}
            fill={s.cor}
            opacity={hover === null || hover === s.index ? 1 : 0.4}
            onMouseEnter={() => setHover(s.index)}
            onMouseLeave={() => setHover(null)}
            className="cursor-pointer transition-opacity duration-150"
          />
        ))}
        <text x={cx} y={cy - 6} textAnchor="middle" fontSize="18" fontWeight="bold" fill="white">
          {total}
        </text>
        <text x={cx} y={cy + 12} textAnchor="middle" fontSize="9" fill="#9CA3AF">
          imóveis
        </text>
      </svg>
      <div className="h-9 flex items-center">
        {hoverSeg && (
          <div
            className="text-sm text-center px-3 py-1.5"
            style={{ backgroundColor: '#1A1A2E', borderRadius: 8 }}
          >
            <span style={{ color: '#C9A84C' }}>{labelDoStatus(hoverSeg.status)}</span>
            <span className="text-white ml-2 font-semibold">{hoverSeg.total}</span>
          </div>
        )}
      </div>
    </div>
  )
}

function BarraHorizontal({ label, valor, max, cor }: { label: string; valor: number; max: number; cor: string }) {
  const pct = max > 0 ? Math.round((valor / max) * 100) : 0
  return (
    <div className="flex items-center gap-3">
      <span className="text-escuro-200 text-sm w-40 truncate flex-shrink-0" title={label}>{label}</span>
      <div className="flex-1 bg-escuro-700 rounded-full h-4 overflow-hidden">
        <div
          className="h-4 rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, backgroundColor: cor }}
        />
      </div>
      <span className="text-sm font-semibold w-8 text-right flex-shrink-0" style={{ color: cor }}>
        {valor}
      </span>
    </div>
  )
}

export default function RelatoriosImoveisPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [dados, setDados] = useState<DadosRelatorio | null>(null)
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState<string | null>(null)

  const perfil = (session?.user as any)?.perfil as string | undefined

  useEffect(() => {
    if (status === 'loading') return
    if (!session || !['MASTER', 'PROPRIETARIO'].includes(perfil ?? '')) {
      router.replace('/chat')
      return
    }

    fetch('/api/imoveis/relatorios')
      .then(r => r.json())
      .then(d => {
        if (d.erro) setErro(d.erro)
        else setDados(d)
      })
      .catch(() => setErro('Erro ao carregar relatórios'))
      .finally(() => setCarregando(false))
  }, [session, status, perfil, router])

  if (status === 'loading' || carregando) {
    return (
      <div className="flex items-center justify-center py-32">
        <svg className="w-8 h-8 animate-spin text-dourado-400" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      </div>
    )
  }

  if (erro) {
    return (
      <div className="p-6 max-w-5xl mx-auto">
        <p className="text-red-400">{erro}</p>
      </div>
    )
  }

  if (!dados) return null

  const maxBairro = dados.porBairro[0]?.total ?? 1
  const maxCorretor = dados.porCorretor[0]?.total ?? 1

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Relatórios — Imóveis</h1>
          <Link
            href="/imoveis"
            className="text-sm text-escuro-300 hover:text-dourado-400 transition-colors mt-0.5 inline-block"
          >
            ← Voltar para Imóveis
          </Link>
        </div>
        <div className="text-right">
          <p className="text-escuro-300 text-sm">Total da carteira</p>
          <p className="text-3xl font-bold text-dourado-400">{dados.total}</p>
          <p className="text-escuro-300 text-xs">imóvel{dados.total !== 1 ? 'is' : ''}</p>
        </div>
      </div>

      {/* Seção 1 — Carteira por Status */}
      <section className="bg-escuro-500 rounded-xl p-6 mb-6">
        <h2 className="text-lg font-semibold text-white mb-5">Carteira por Status</h2>

        {/* Cards de resumo */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
          {dados.porStatus.map(s => (
            <div
              key={s.status}
              className="rounded-lg p-3 text-center"
              style={{
                backgroundColor: `${corDoStatus(s.status)}18`,
                border: `1px solid ${corDoStatus(s.status)}40`,
              }}
            >
              <p className="text-2xl font-bold" style={{ color: corDoStatus(s.status) }}>{s.total}</p>
              <p className="text-xs text-escuro-200 mt-0.5 leading-tight">{labelDoStatus(s.status)}</p>
            </div>
          ))}
        </div>

        {/* Donut + legenda */}
        <div className="flex flex-col sm:flex-row items-center gap-8">
          <div className="flex-shrink-0">
            <DonutChart dados={dados.porStatus} />
          </div>
          <div className="flex flex-wrap gap-x-6 gap-y-2">
            {dados.porStatus.map(s => (
              <div key={s.status} className="flex items-center gap-2">
                <span
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: corDoStatus(s.status) }}
                />
                <span className="text-sm text-escuro-200">{labelDoStatus(s.status)}</span>
                <span className="text-sm font-semibold text-white">{s.total}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Seção 2 — Por Bairro */}
      <section className="bg-escuro-500 rounded-xl p-6 mb-6">
        <h2 className="text-lg font-semibold text-white mb-5">Imóveis por Bairro (Top 10)</h2>
        {dados.porBairro.length === 0 ? (
          <p className="text-escuro-300 text-sm">Nenhum dado disponível.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {dados.porBairro.map(b => (
              <BarraHorizontal key={b.bairro} label={b.bairro} valor={b.total} max={maxBairro} cor="#C9A84C" />
            ))}
          </div>
        )}
      </section>

      {/* Seção 3 — Por Corretor */}
      <section className="bg-escuro-500 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-white mb-5">Imóveis por Corretor</h2>
        {dados.porCorretor.length === 0 ? (
          <p className="text-escuro-300 text-sm">Nenhum imóvel vinculado a corretor ainda.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {dados.porCorretor.map(c => (
              <BarraHorizontal key={c.corretor} label={c.corretor} valor={c.total} max={maxCorretor} cor="#3B82F6" />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
