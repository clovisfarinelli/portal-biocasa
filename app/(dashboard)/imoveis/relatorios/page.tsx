'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import LogoBiocasa from '@/components/LogoBiocasa'

// ─── Tipos ───────────────────────────────────────────────────────────────────

interface DadosRelatorio {
  total: number
  porStatus: { status: string; total: number }[]
  porBairro: { bairro: string; total: number }[]
  porCorretor: { corretor: string; total: number }[]
}

interface ImovelImpressao {
  id: string
  codigoRef: string
  dataCadastro: string
  logradouro: string
  numero: string | null
  complemento: string | null
  bairro: string
  cidade: string
  valorVenda: number | null
  valorLocacao: number | null
  modalidade: string
  tipo: string
  captador: string | null
  unidadeId: string
  unidade: { nome: string }
}

interface DadosImpressao {
  imoveis: ImovelImpressao[]
  filtrosAplicados: Record<string, string | null>
  total: number
  geradoEm: string
}

interface Unidade {
  id: string
  nome: string
}

// ─── Constantes ──────────────────────────────────────────────────────────────

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

const MODAL_LABELS: Record<string, string> = {
  VENDA: 'Venda',
  LOCACAO: 'Locação',
  AMBOS: 'Ambos',
}

function corDoStatus(s: string) { return STATUS_CORES[s] ?? '#6B7280' }
function labelDoStatus(s: string) { return STATUS_LABELS[s] ?? s }

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatarMoedaBR(v: number | null | undefined): string {
  if (v == null) return 'A consultar'
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function formatarData(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString('pt-BR')
}

function formatarDataHora(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
}

function valorExibido(imovel: ImovelImpressao): string {
  if (imovel.modalidade === 'VENDA') return formatarMoedaBR(imovel.valorVenda)
  if (imovel.modalidade === 'LOCACAO') return formatarMoedaBR(imovel.valorLocacao)
  // AMBOS — mostra venda se existir, senão locação
  return formatarMoedaBR(imovel.valorVenda ?? imovel.valorLocacao)
}

function enderecoCompleto(imovel: ImovelImpressao): string {
  return [imovel.logradouro, imovel.numero, imovel.complemento]
    .filter(Boolean)
    .join(', ')
}

// ─── Gráficos ─────────────────────────────────────────────────────────────────

function DonutChart({ dados }: { dados: { status: string; total: number }[] }) {
  const [hover, setHover] = useState<number | null>(null)
  const total = dados.reduce((s, d) => s + d.total, 0)

  if (total === 0) {
    return <p className="text-escuro-300 text-sm text-center py-8">Sem dados de status</p>
  }

  const cx = 80, cy = 80, r = 65, innerR = 42

  function polarToXY(angleDeg: number, radius: number) {
    const rad = (angleDeg - 90) * (Math.PI / 180)
    return { x: cx + radius * Math.cos(rad), y: cy + radius * Math.sin(rad) }
  }

  let startDeg = 0
  const segments = dados.map((d, i) => {
    const sweep = (d.total / total) * 360
    const endDeg = startDeg + sweep
    const s1 = polarToXY(startDeg, r),  e1 = polarToXY(endDeg, r)
    const s2 = polarToXY(endDeg, innerR), e2 = polarToXY(startDeg, innerR)
    const large = sweep > 180 ? 1 : 0
    const path = [
      `M ${s1.x} ${s1.y}`, `A ${r} ${r} 0 ${large} 1 ${e1.x} ${e1.y}`,
      `L ${s2.x} ${s2.y}`, `A ${innerR} ${innerR} 0 ${large} 0 ${e2.x} ${e2.y}`, 'Z',
    ].join(' ')
    const seg = { path, cor: corDoStatus(d.status), status: d.status, total: d.total, index: i }
    startDeg = endDeg
    return seg
  })

  const hoverSeg = hover !== null ? segments[hover] : null

  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 160 160" className="w-44 h-44">
        {segments.map(s => (
          <path key={s.index} d={s.path} fill={s.cor}
            opacity={hover === null || hover === s.index ? 1 : 0.4}
            onMouseEnter={() => setHover(s.index)} onMouseLeave={() => setHover(null)}
            className="cursor-pointer transition-opacity duration-150"
          />
        ))}
        <text x={cx} y={cy - 6} textAnchor="middle" fontSize="18" fontWeight="bold" fill="white">{total}</text>
        <text x={cx} y={cy + 12} textAnchor="middle" fontSize="9" fill="#9CA3AF">imóveis</text>
      </svg>
      <div className="h-9 flex items-center">
        {hoverSeg && (
          <div className="text-sm text-center px-3 py-1.5" style={{ backgroundColor: '#1A1A2E', borderRadius: 8 }}>
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
        <div className="h-4 rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: cor }} />
      </div>
      <span className="text-sm font-semibold w-8 text-right flex-shrink-0" style={{ color: cor }}>{valor}</span>
    </div>
  )
}

function AbaGraficos({ dados }: { dados: DadosRelatorio }) {
  const maxBairro = dados.porBairro[0]?.total ?? 1
  const maxCorretor = dados.porCorretor[0]?.total ?? 1

  return (
    <>
      <section className="bg-escuro-500 rounded-xl p-6 mb-6">
        <h2 className="text-lg font-semibold text-white mb-5">Carteira por Status</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
          {dados.porStatus.map(s => (
            <div key={s.status} className="rounded-lg p-3 text-center"
              style={{ backgroundColor: `${corDoStatus(s.status)}18`, border: `1px solid ${corDoStatus(s.status)}40` }}>
              <p className="text-2xl font-bold" style={{ color: corDoStatus(s.status) }}>{s.total}</p>
              <p className="text-xs text-escuro-200 mt-0.5 leading-tight">{labelDoStatus(s.status)}</p>
            </div>
          ))}
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-8">
          <div className="flex-shrink-0"><DonutChart dados={dados.porStatus} /></div>
          <div className="flex flex-wrap gap-x-6 gap-y-2">
            {dados.porStatus.map(s => (
              <div key={s.status} className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: corDoStatus(s.status) }} />
                <span className="text-sm text-escuro-200">{labelDoStatus(s.status)}</span>
                <span className="text-sm font-semibold text-white">{s.total}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

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

      <section className="bg-escuro-500 rounded-xl p-6 mb-6">
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

      <section className="bg-escuro-500 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-white mb-5">Fichas</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="card flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-dourado-400/10 border border-dourado-400/30 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-dourado-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <h3 className="text-white font-semibold text-sm">Ficha de Captação</h3>
                <p className="text-escuro-300 text-xs mt-0.5">Formulário em branco para preenchimento à mão</p>
              </div>
            </div>
            <Link href="/imprimir/ficha-captacao" target="_blank"
              className="btn-primary text-sm text-center flex items-center justify-center gap-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              Imprimir
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}

// ─── Aba Impressão ────────────────────────────────────────────────────────────

function AbaImpressao({ perfil }: { perfil: string }) {
  const [modalidade, setModalidade] = useState('')
  const [tipo, setTipo] = useState('')
  const [cidade, setCidade] = useState('')
  const [captador, setCaptador] = useState('')
  const [unidadeId, setUnidadeId] = useState('')
  const [unidades, setUnidades] = useState<Unidade[]>([])
  const [dados, setDados] = useState<DadosImpressao | null>(null)
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  useEffect(() => {
    if (perfil === 'MASTER') {
      fetch('/api/unidades')
        .then(r => r.json())
        .then(d => setUnidades(Array.isArray(d) ? d : []))
        .catch(() => {})
    }
    buscar()
  }, [])

  function buscar() {
    setCarregando(true)
    setErro(null)
    const params = new URLSearchParams()
    if (modalidade) params.set('modalidade', modalidade)
    if (tipo)       params.set('tipo', tipo)
    if (cidade)     params.set('cidade', cidade)
    if (captador)   params.set('captador', captador)
    if (unidadeId)  params.set('unidadeId', unidadeId)

    fetch(`/api/imoveis/relatorios/impressao?${params}`)
      .then(r => r.json())
      .then(d => {
        if (d.erro) setErro(d.erro)
        else setDados(d)
      })
      .catch(() => setErro('Erro ao carregar dados'))
      .finally(() => setCarregando(false))
  }

  // Agrupa por Unidade → Captador → Modalidade
  type GrupoModal = { modalidade: string; imoveis: ImovelImpressao[] }
  type GrupoCap   = { captador: string; modalidades: GrupoModal[] }
  type GrupoUni   = { unidade: string; captadores: GrupoCap[] }

  function agrupar(lista: ImovelImpressao[]): GrupoUni[] {
    const mapUni = new Map<string, Map<string, Map<string, ImovelImpressao[]>>>()
    for (const im of lista) {
      const uni = im.unidade?.nome ?? '(sem unidade)'
      const cap = im.captador ?? '(sem captador)'
      const mod = im.modalidade
      if (!mapUni.has(uni)) mapUni.set(uni, new Map())
      const mapCap = mapUni.get(uni)!
      if (!mapCap.has(cap)) mapCap.set(cap, new Map())
      const mapMod = mapCap.get(cap)!
      if (!mapMod.has(mod)) mapMod.set(mod, [])
      mapMod.get(mod)!.push(im)
    }
    return Array.from(mapUni.entries()).map(([uni, mapCap]) => ({
      unidade: uni,
      captadores: Array.from(mapCap.entries()).map(([cap, mapMod]) => ({
        captador: cap,
        modalidades: Array.from(mapMod.entries()).map(([mod, ims]) => ({ modalidade: mod, imoveis: ims })),
      })),
    }))
  }

  const grupos = dados ? agrupar(dados.imoveis) : []

  const filtrosTexto = dados
    ? Object.entries(dados.filtrosAplicados)
        .filter(([, v]) => v)
        .map(([k, v]) => {
          const labels: Record<string, string> = {
            modalidade: 'Modalidade', tipo: 'Tipo',
            cidade: 'Cidade', captador: 'Captador', unidadeId: 'Unidade',
          }
          return `${labels[k] ?? k}: ${v}`
        })
        .join(' | ')
    : ''

  const handleImprimir = () => {
    const conteudo = document.getElementById('area-impressao')?.innerHTML
    if (!conteudo) return

    const janela = window.open('', '_blank', 'width=800,height=600')
    if (!janela) return

    janela.document.write(`
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="UTF-8" />
        <title>Relatório de Imóveis — Biocasa</title>
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; }

          body {
            font-family: Arial, sans-serif;
            color: #000;
            background: #fff;
          }

          @page {
            size: A4 portrait;
            margin: 1.5cm;
          }

          .print-hidden { display: none !important; }

          .cabecalho-relatorio {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 8px;
            padding-bottom: 8px;
            border-bottom: 2px solid #000;
          }

          .cabecalho-relatorio .titulo {
            font-size: 14px;
            font-weight: bold;
            text-align: center;
          }

          .cabecalho-relatorio .data {
            font-size: 11px;
            text-align: right;
          }

          .filtros-ativos {
            font-size: 10px;
            color: #555;
            margin-bottom: 12px;
          }

          .grupo-unidade {
            margin-bottom: 20px;
            page-break-inside: avoid;
          }

          .unidade-header {
            font-size: 13px;
            font-weight: bold;
            border-bottom: 2px solid #000;
            padding-bottom: 4px;
            margin-bottom: 8px;
            text-transform: uppercase;
          }

          .grupo-captador {
            margin-bottom: 14px;
            page-break-inside: avoid;
          }

          .captador-header {
            font-size: 11px;
            font-weight: bold;
            margin: 8px 0 4px 0;
          }

          table {
            border-collapse: collapse;
            width: 100%;
            table-layout: fixed;
          }

          colgroup col:nth-child(1) { width: 8%; }
          colgroup col:nth-child(2) { width: 10%; }
          colgroup col:nth-child(3) { width: 42%; }
          colgroup col:nth-child(4) { width: 16%; }
          colgroup col:nth-child(5) { width: 14%; }
          colgroup col:nth-child(6) { width: 10%; }

          th {
            background-color: #f3f3f3;
            font-size: 11px;
            padding: 4px 6px;
            border: 1px solid #ccc;
            text-align: left;
          }

          td {
            font-size: 10px;
            padding: 3px 6px;
            border: 1px solid #ddd;
            vertical-align: top;
          }

          td.endereco {
            word-break: break-word;
            white-space: normal;
          }

          td.nowrap {
            white-space: nowrap;
          }

          .subtotal {
            font-size: 10px;
            text-align: right;
            margin-top: 4px;
            color: #555;
          }

          .total-geral {
            font-size: 12px;
            font-weight: bold;
            text-align: right;
            margin-top: 12px;
            border-top: 2px solid #000;
            padding-top: 6px;
          }
        </style>
      </head>
      <body>
        ${conteudo}
      </body>
      </html>
    `)

    janela.document.close()
    janela.focus()

    setTimeout(() => {
      janela.print()
      janela.close()
    }, 500)
  }

  return (
    <>
      {/* Filtros — ocultos na impressão */}
      <div className="print:hidden bg-escuro-500 rounded-xl p-5 mb-6">
        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-escuro-300">Modalidade</label>
            <select value={modalidade} onChange={e => setModalidade(e.target.value)} className="input-field text-sm w-36">
              <option value="">Todas</option>
              <option value="VENDA">Venda</option>
              <option value="LOCACAO">Locação</option>
              <option value="AMBOS">Ambos</option>
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-escuro-300">Tipo</label>
            <select value={tipo} onChange={e => setTipo(e.target.value)} className="input-field text-sm w-28">
              <option value="">Todos</option>
              <option value="AP">AP</option>
              <option value="CA">CA</option>
              <option value="TE">TE</option>
              <option value="KN">KN</option>
              <option value="CH">CH</option>
              <option value="VL">VL</option>
              <option value="CO">CO</option>
              <option value="LO">LO</option>
              <option value="GR">GR</option>
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-escuro-300">Cidade</label>
            <input value={cidade} onChange={e => setCidade(e.target.value)}
              placeholder="Cidade" className="input-field text-sm w-32" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-escuro-300">Captador</label>
            <input value={captador} onChange={e => setCaptador(e.target.value)}
              placeholder="Captador" className="input-field text-sm w-36" />
          </div>
          {perfil === 'MASTER' && (
            <div className="flex flex-col gap-1">
              <label className="text-xs text-escuro-300">Unidade</label>
              <select value={unidadeId} onChange={e => setUnidadeId(e.target.value)} className="input-field text-sm w-44">
                <option value="">Todas</option>
                {unidades.map(u => <option key={u.id} value={u.id}>{u.nome}</option>)}
              </select>
            </div>
          )}
          <button onClick={buscar} className="btn-primary text-sm px-5 self-end">
            Filtrar
          </button>
          <button onClick={handleImprimir} className="btn-secondary text-sm px-4 self-end flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            Imprimir
          </button>
        </div>
      </div>

      {/* Estado de carregamento / erro */}
      {carregando && (
        <div className="print:hidden flex items-center justify-center py-12">
          <svg className="w-7 h-7 animate-spin text-dourado-400" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        </div>
      )}
      {erro && <p className="print:hidden text-red-400 text-sm mb-4">{erro}</p>}

      {/* Área imprimível */}
      {dados && !carregando && (
        <div id="area-impressao" className="bg-white text-black rounded-xl p-6">

          {/* Cabeçalho */}
          <div className="flex items-center justify-between pb-3 border-b border-gray-300 mb-2">
            <LogoBiocasa />
            <p className="font-bold text-base text-center flex-1 mx-4">Relatório de Imóveis Cadastrados</p>
            <p className="text-xs text-gray-500 text-right whitespace-nowrap">
              Emitido em:<br />{formatarDataHora(dados.geradoEm)}
            </p>
          </div>

          {/* Filtros ativos */}
          {filtrosTexto && (
            <p className="text-xs text-gray-500 mb-4">Filtros: {filtrosTexto}</p>
          )}

          {/* Grupos: Unidade → Captador → Modalidade */}
          {grupos.length === 0 ? (
            <p className="text-gray-500 text-sm py-8 text-center">Nenhum imóvel encontrado para os filtros selecionados.</p>
          ) : (
            grupos.map(gu => (
              <div key={gu.unidade} className="grupo-unidade mb-6">
                <p className="unidade-header text-sm font-bold uppercase border-b-2 border-black pb-1 mb-3">
                  UNIDADE: {gu.unidade}
                </p>

                {gu.captadores.map(gc =>
                  gc.modalidades.map(gm => (
                    <div key={`${gc.captador}-${gm.modalidade}`} className="grupo-captador mb-4">
                      <p className="captador-header text-xs font-bold mb-1">
                        Captador: {gc.captador} — Modalidade: {MODAL_LABELS[gm.modalidade] ?? gm.modalidade}
                      </p>
                      <table style={{ borderCollapse: 'collapse', width: '100%', tableLayout: 'fixed' }}>
                        <colgroup>
                          <col style={{ width: '8%' }} />
                          <col style={{ width: '10%' }} />
                          <col style={{ width: '42%' }} />
                          <col style={{ width: '16%' }} />
                          <col style={{ width: '14%' }} />
                          <col style={{ width: '10%' }} />
                        </colgroup>
                        <thead>
                          <tr>
                            <th style={{ whiteSpace: 'nowrap' }}>Código</th>
                            <th style={{ whiteSpace: 'nowrap' }}>Dt. Cadastro</th>
                            <th>Endereço</th>
                            <th style={{ whiteSpace: 'nowrap' }}>Bairro</th>
                            <th style={{ whiteSpace: 'nowrap' }}>Cidade</th>
                            <th style={{ whiteSpace: 'nowrap', textAlign: 'right' }}>Valor</th>
                          </tr>
                        </thead>
                        <tbody>
                          {gm.imoveis.map(im => (
                            <tr key={im.id}>
                              <td className="nowrap">{im.codigoRef}</td>
                              <td className="nowrap">{formatarData(im.dataCadastro)}</td>
                              <td className="endereco">{enderecoCompleto(im)}</td>
                              <td className="nowrap">{im.bairro}</td>
                              <td className="nowrap">{im.cidade}</td>
                              <td className="nowrap" style={{ textAlign: 'right' }}>{valorExibido(im)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      <p className="subtotal text-xs text-gray-500 text-right mt-1">
                        Subtotal: {gm.imoveis.length} imóvel{gm.imoveis.length !== 1 ? 'is' : ''}
                      </p>
                    </div>
                  ))
                )}
              </div>
            ))
          )}

          {/* Rodapé */}
          <p className="total-geral text-sm font-bold text-right border-t border-gray-400 pt-3 mt-4">
            Total geral: {dados.total} imóvel{dados.total !== 1 ? 'is' : ''}
          </p>
        </div>
      )}
    </>
  )
}

// ─── Página principal ─────────────────────────────────────────────────────────

export default function RelatoriosImoveisPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [aba, setAba] = useState<'graficos' | 'impressao'>('graficos')
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

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Relatórios — Imóveis</h1>
          <Link href="/imoveis"
            className="text-sm text-escuro-300 hover:text-dourado-400 transition-colors mt-0.5 inline-block">
            ← Voltar para Imóveis
          </Link>
        </div>
        {dados && (
          <div className="text-right">
            <p className="text-escuro-300 text-sm">Total da carteira</p>
            <p className="text-3xl font-bold text-dourado-400">{dados.total}</p>
            <p className="text-escuro-300 text-xs">imóvel{dados.total !== 1 ? 'is' : ''}</p>
          </div>
        )}
      </div>

      {/* Abas */}
      <div className="flex border-b border-escuro-400 mb-6 print:hidden">
        <button
          onClick={() => setAba('graficos')}
          className={`px-5 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
            aba === 'graficos'
              ? 'border-dourado-400 text-dourado-400'
              : 'border-transparent text-gray-400 hover:text-white'
          }`}
        >
          📊 Gráficos
        </button>
        <button
          onClick={() => setAba('impressao')}
          className={`px-5 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
            aba === 'impressao'
              ? 'border-dourado-400 text-dourado-400'
              : 'border-transparent text-gray-400 hover:text-white'
          }`}
        >
          🖨️ Relatório de Imóveis
        </button>
      </div>

      {/* Conteúdo */}
      {aba === 'graficos' && dados && <AbaGraficos dados={dados} />}
      {aba === 'impressao' && <AbaImpressao perfil={perfil ?? ''} />}
    </div>
  )
}
