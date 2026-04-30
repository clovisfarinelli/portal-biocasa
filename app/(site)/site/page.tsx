import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { formatarMoeda } from '@/lib/utils'

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

function extrairFotoCapa(fotos: string | null): string | null {
  if (!fotos) return null
  try {
    const arr = JSON.parse(fotos)
    return arr.find((f: any) => f.principal)?.url ?? arr[0]?.url ?? null
  } catch { return null }
}

export default async function SiteHomePage() {
  let destaques = await prisma.imovel.findMany({
    where: { situacao: 'DISPONIVEL', destaque: true },
    take: 6,
    orderBy: { dataCadastro: 'desc' },
    select: {
      codigoRef: true, tipo: true, subtipo: true, modalidade: true, locacaoPacote: true,
      bairro: true, cidade: true, valorVenda: true, valorLocacao: true,
      areaUtil: true, dormitorios: true, vagasGaragem: true, fotos: true,
    },
  })

  if (destaques.length === 0) {
    destaques = await prisma.imovel.findMany({
      where: { situacao: 'DISPONIVEL' },
      take: 6,
      orderBy: { dataCadastro: 'desc' },
      select: {
        codigoRef: true, tipo: true, subtipo: true, modalidade: true, locacaoPacote: true,
        bairro: true, cidade: true, valorVenda: true, valorLocacao: true,
        areaUtil: true, dormitorios: true, vagasGaragem: true, fotos: true,
      },
    })
  }

  return (
    <>
      {/* Hero */}
      <section
        className="py-20 sm:py-28 px-4"
        style={{ background: 'linear-gradient(160deg, #ffffff 0%, #f0f2f5 100%)' }}
      >
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-3xl sm:text-5xl font-bold text-[#1A1A2E] leading-tight mb-4">
            Encontre o imóvel ideal{' '}
            <span style={{ color: '#C9A84C' }}>em Santos</span>
          </h1>
          <p className="text-gray-500 text-lg sm:text-xl mb-10">
            Apartamentos, casas, terrenos e muito mais para venda e locação.
          </p>

          {/* Barra de busca */}
          <form
            action="/imoveis"
            method="get"
            className="bg-white rounded-2xl shadow-lg p-4 flex flex-col sm:flex-row gap-3"
          >
            <select
              name="tipo"
              className="flex-1 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-700 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#C9A84C]/50"
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
              name="modalidade"
              className="flex-1 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-700 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#C9A84C]/50"
            >
              <option value="">Venda ou Locação</option>
              <option value="VENDA">Venda</option>
              <option value="LOCACAO">Locação</option>
            </select>

            <button
              type="submit"
              className="px-8 py-3 rounded-xl font-semibold text-white text-sm transition-opacity hover:opacity-90 flex-shrink-0"
              style={{ background: '#C9A84C' }}
            >
              Buscar
            </button>
          </form>
        </div>
      </section>

      {/* Destaques */}
      {destaques.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-[#1A1A2E]">
              Imóveis em Destaque
            </h2>
            <Link
              href="/imoveis"
              className="text-sm font-medium hover:opacity-80 transition-opacity"
              style={{ color: '#C9A84C' }}
            >
              Ver todos →
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {destaques.map(imovel => {
              const fotoCapa = extrairFotoCapa(imovel.fotos)
              const badge = BADGE_MODALIDADE[imovel.modalidade]
              const tipoLabel = `${LABEL_TIPO[imovel.tipo] ?? imovel.tipo}${imovel.subtipo ? ` ${LABEL_SUBTIPO[imovel.subtipo] ?? imovel.subtipo}` : ''}`

              return (
                <Link
                  key={imovel.codigoRef}
                  href={`/imoveis/${imovel.codigoRef}`}
                  className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow flex flex-col"
                >
                  {/* Foto */}
                  <div className="relative w-full h-48 bg-gray-100 flex-shrink-0 overflow-hidden">
                    {fotoCapa ? (
                      <img
                        src={fotoUrl(fotoCapa)}
                        alt={tipoLabel}
                        className="w-full h-full object-cover object-center"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <svg className="w-12 h-12 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                        </svg>
                      </div>
                    )}
                    {badge && (
                      <span className={`absolute top-2 left-2 text-xs font-semibold px-2 py-1 rounded-lg ${badge.bg} ${badge.text}`}>
                        {badge.label}
                      </span>
                    )}
                  </div>

                  {/* Info */}
                  <div className="p-4 flex flex-col flex-1">
                    <p className="text-xs text-gray-400 mb-1">{imovel.bairro} · {imovel.cidade}</p>
                    <p className="font-semibold text-[#1A1A2E] mb-3 leading-snug">{tipoLabel}</p>

                    {/* Características */}
                    <div className="flex flex-wrap gap-3 text-xs text-gray-500 mb-4">
                      {imovel.areaUtil && (
                        <span className="flex items-center gap-1">
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-5h-4m4 0v4m0-4l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                          </svg>
                          {imovel.areaUtil}m²
                        </span>
                      )}
                      {imovel.dormitorios && imovel.dormitorios !== 'KIT_STUDIO' && (
                        <span className="flex items-center gap-1">
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                          </svg>
                          {imovel.dormitorios === '4_MAIS' ? '4+' : imovel.dormitorios} quarto{imovel.dormitorios !== '1' ? 's' : ''}
                        </span>
                      )}
                      {imovel.vagasGaragem && imovel.vagasGaragem !== 'SEM_VAGA' && (
                        <span className="flex items-center gap-1">
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          {imovel.vagasGaragem === '3_MAIS' ? '3+' : imovel.vagasGaragem === 'MOTOS' ? 'Motos' : imovel.vagasGaragem} vaga{imovel.vagasGaragem !== '1' && imovel.vagasGaragem !== 'MOTOS' ? 's' : ''}
                        </span>
                      )}
                    </div>

                    {/* Preço */}
                    <div className="mt-auto space-y-0.5">
                      {(imovel.modalidade === 'VENDA' || imovel.modalidade === 'AMBOS') && imovel.valorVenda && (
                        <p className="text-base font-bold" style={{ color: '#C9A84C' }}>
                          {formatarMoeda(imovel.valorVenda)}
                        </p>
                      )}
                      {(imovel.modalidade === 'LOCACAO' || imovel.modalidade === 'AMBOS') && imovel.valorLocacao && (
                        <p className={`font-semibold ${imovel.modalidade === 'AMBOS' ? 'text-sm text-gray-600' : 'text-base'}`} style={imovel.modalidade !== 'AMBOS' ? { color: '#C9A84C' } : {}}>
                          {formatarMoeda(imovel.valorLocacao)}/mês
                          {imovel.locacaoPacote && (
                            <span className="ml-2 text-xs font-medium bg-green-100 text-green-700 px-1.5 py-0.5 rounded">Pacote</span>
                          )}
                        </p>
                      )}
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>

          <div className="text-center mt-10">
            <Link
              href="/imoveis"
              className="inline-flex items-center gap-2 px-8 py-3 rounded-xl font-semibold text-white text-sm transition-opacity hover:opacity-90"
              style={{ background: '#C9A84C' }}
            >
              Ver todos os imóveis
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </Link>
          </div>
        </section>
      )}
    </>
  )
}
