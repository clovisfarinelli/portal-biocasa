'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function BuscaHero() {
  const router = useRouter()
  const [expandido, setExpandido] = useState(false)

  const [modalidade, setModalidade] = useState('')
  const [tipo, setTipo] = useState('')
  const [busca, setBusca] = useState('')
  const [cidade, setCidade] = useState('')
  const [bairro, setBairro] = useState('')
  const [quartosMin, setQuartosMin] = useState('')
  const [suitesMin, setSuitesMin] = useState('')
  const [vagasMin, setVagasMin] = useState('')
  const [valorMax, setValorMax] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const params = new URLSearchParams()
    if (modalidade) params.set('modalidade', modalidade)
    if (tipo) params.set('tipo', tipo)
    if (busca.trim()) params.set('busca', busca.trim())
    if (cidade.trim()) params.set('cidade', cidade.trim())
    if (bairro.trim()) params.set('bairro', bairro.trim())
    if (quartosMin) params.set('quartos_min', quartosMin)
    if (suitesMin) params.set('suites_min', suitesMin)
    if (vagasMin) params.set('vagas_min', vagasMin)
    if (valorMax) params.set('valor_max', valorMax)
    const qs = params.toString()
    router.push(qs ? `/imoveis?${qs}` : '/imoveis')
  }

  const inputCls = 'flex-1 min-w-0 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-700 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#C9A84C]/50'
  const inputSecCls = 'border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-700 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#C9A84C]/40 w-full'

  return (
    <section
      className="relative flex items-center justify-center min-h-[calc(100vh-4rem)] bg-cover bg-center px-4 py-16"
      style={{ backgroundImage: "url('/hero-bg.png')" }}
    >
      {/* Overlay escuro */}
      <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.45)' }} />

      {/* Conteúdo */}
      <div className="relative z-10 w-full max-w-4xl mx-auto text-center">
        {/* Título */}
        <h1 className="text-5xl sm:text-7xl lg:text-8xl font-black text-white leading-none tracking-tight mb-3 drop-shadow-lg">
          BIOCASA<sup className="text-2xl sm:text-4xl font-bold align-super ml-0.5">®</sup>
        </h1>
        <p className="text-white/90 text-lg sm:text-2xl font-light tracking-[0.2em] uppercase mb-10 drop-shadow">
          A Imobiliária do Futuro!
        </p>

        {/* Formulário de busca */}
        <form
          onSubmit={handleSubmit}
          className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-4"
        >
          {/* Bloco principal */}
          <div className="flex flex-col sm:flex-row flex-wrap gap-3">
            <select
              value={modalidade}
              onChange={e => setModalidade(e.target.value)}
              className={inputCls}
            >
              <option value="">Venda ou Locação</option>
              <option value="VENDA">Venda</option>
              <option value="LOCACAO">Locação</option>
            </select>

            <select
              value={tipo}
              onChange={e => setTipo(e.target.value)}
              className={inputCls}
            >
              <option value="">Tipo de Imóvel</option>
              <option value="APARTAMENTO">Apartamento</option>
              <option value="CASA">Casa</option>
              <option value="TERRENO">Terreno</option>
              <option value="CHACARA">Chácara</option>
              <option value="SALA">Sala</option>
              <option value="LOJA">Loja</option>
              <option value="CASA_COMERCIAL">Casa Comercial</option>
              <option value="GALPAO">Galpão</option>
            </select>

            <input
              value={busca}
              onChange={e => setBusca(e.target.value)}
              placeholder="Condomínio, bairro ou cidade..."
              className={`${inputCls} sm:min-w-56`}
            />

            <div className="flex gap-2 flex-shrink-0 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => setExpandido(v => !v)}
                className="flex-1 sm:flex-none px-4 py-3 rounded-xl text-sm font-medium text-gray-600 border border-gray-200 hover:bg-gray-50 transition-colors whitespace-nowrap"
              >
                {expandido ? '− Menos filtros' : '+ Mais filtros'}
              </button>
              <button
                type="submit"
                className="flex-1 sm:flex-none px-6 py-3 rounded-xl font-semibold text-white text-sm transition-opacity hover:opacity-90 whitespace-nowrap"
                style={{ background: '#C9A84C' }}
              >
                Encontrar Imóvel
              </button>
            </div>
          </div>

          {/* Bloco secundário (expansível) */}
          {expandido && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-4 pt-4 border-t border-gray-100">
              <input
                value={cidade}
                onChange={e => setCidade(e.target.value)}
                placeholder="Cidade"
                className={inputSecCls}
              />
              <input
                value={bairro}
                onChange={e => setBairro(e.target.value)}
                placeholder="Bairro"
                className={inputSecCls}
              />
              <select
                value={quartosMin}
                onChange={e => setQuartosMin(e.target.value)}
                className={inputSecCls}
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
                className={inputSecCls}
              >
                <option value="">Suítes</option>
                <option value="1">1+</option>
                <option value="2">2+</option>
                <option value="3">3+</option>
              </select>
              <select
                value={vagasMin}
                onChange={e => setVagasMin(e.target.value)}
                className={inputSecCls}
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
                className={inputSecCls}
              />
            </div>
          )}
        </form>
      </div>
    </section>
  )
}
