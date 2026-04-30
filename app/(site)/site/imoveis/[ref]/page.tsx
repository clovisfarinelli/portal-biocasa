import { notFound } from 'next/navigation'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { formatarMoeda } from '@/lib/utils'
import GaleriaPublica from './GaleriaPublica'

// ─── Labels ───────────────────────────────────────────────────────────────────

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
  VENDA: 'Venda', LOCACAO: 'Locação', AMBOS: 'Venda e Locação',
}
const BADGE_MODALIDADE: Record<string, string> = {
  VENDA: 'bg-blue-100 text-blue-700',
  LOCACAO: 'bg-purple-100 text-purple-700',
  AMBOS: 'bg-amber-100 text-amber-800',
}
const LABEL_FACILIDADES_IMOVEL: Record<string, string> = {
  ARMARIOS_QUARTOS: 'Armários nos Quartos', COZ_PLANEJADA: 'Cozinha Planejada',
  VENTILADOR_TETO: 'Ventilador de Teto', AR_CONDICIONADO: 'Ar Condicionado',
  VARANDA_GOURMET: 'Varanda Gourmet', CHURRASQUEIRA: 'Churrasqueira',
}
const LABEL_FACILIDADES_COND: Record<string, string> = {
  PISCINA: 'Piscina', ACADEMIA: 'Academia', SALAO_FESTAS: 'Salão de Festas',
  SALAO_JOGOS: 'Salão de Jogos', PLAYGROUND: 'Playground',
}
const LABEL_ACESSO: Record<string, string> = {
  TERREO: 'Térreo', ESCADAS: 'Escadas', ELEVADOR: 'Elevador',
}

// ─── Componente de característica ────────────────────────────────────────────

function Caracteristica({ label, valor }: { label: string; valor?: string | number | null }) {
  if (!valor && valor !== 0) return null
  return (
    <div className="flex flex-col items-center justify-center bg-gray-50 rounded-xl p-3 text-center">
      <span className="text-xs text-gray-400 mb-0.5">{label}</span>
      <span className="text-sm font-semibold text-[#1A1A2E]">{valor}</span>
    </div>
  )
}

// ─── Página ───────────────────────────────────────────────────────────────────

export default async function DetalheImovelPage({ params }: { params: { ref: string } }) {
  const imovel = await prisma.imovel.findFirst({
    where: { codigoRef: params.ref, situacao: 'DISPONIVEL', publicarSite: true },
  })

  if (!imovel) notFound()

  const fotos: { url: string; ordem: number; principal: boolean }[] = imovel.fotos
    ? (() => { try { return JSON.parse(imovel.fotos) } catch { return [] } })()
    : []

  const facilImovel: string[] = imovel.facilidadesImovel
    ? (() => { try { return JSON.parse(imovel.facilidadesImovel) } catch { return [] } })()
    : []

  const facilCond: string[] = imovel.facilidadesCond
    ? (() => { try { return JSON.parse(imovel.facilidadesCond) } catch { return [] } })()
    : []

  const facilImovelOutros: string[] = imovel.facilidadesImovelOutros
    ? (() => { try { const p = JSON.parse(imovel.facilidadesImovelOutros); return Array.isArray(p) ? p : [imovel.facilidadesImovelOutros] } catch { return [imovel.facilidadesImovelOutros as string] } })()
    : []

  const facilCondOutros: string[] = imovel.facilidadesCondOutros
    ? (() => { try { const p = JSON.parse(imovel.facilidadesCondOutros); return Array.isArray(p) ? p : [imovel.facilidadesCondOutros] } catch { return [imovel.facilidadesCondOutros as string] } })()
    : []

  const mostrarVenda = imovel.modalidade === 'VENDA' || imovel.modalidade === 'AMBOS'
  const mostrarLocacao = imovel.modalidade === 'LOCACAO' || imovel.modalidade === 'AMBOS'

  const tipoLabel = `${LABEL_TIPO[imovel.tipo] ?? imovel.tipo}${imovel.subtipo ? ` ${LABEL_SUBTIPO[imovel.subtipo] ?? imovel.subtipo}` : ''}`

  const msgWhatsApp = encodeURIComponent(
    `Olá! Tenho interesse no imóvel ${imovel.codigoRef} - ${tipoLabel} em ${imovel.bairro}`
  )

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Voltar */}
      <Link
        href="/imoveis"
        className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-[#1A1A2E] transition-colors mb-6"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        Voltar para a listagem
      </Link>

      {/* Ref */}
      <p className="text-xs text-gray-400 mb-2">Ref.: {imovel.codigoRef}</p>

      {/* Layout principal */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
        {/* Coluna esquerda: Galeria */}
        <div>
          <GaleriaPublica fotos={fotos} />
        </div>

        {/* Coluna direita: Informações */}
        <div className="space-y-5">
          {/* Título e badges */}
          <div>
            <div className="flex flex-wrap gap-2 mb-2">
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-lg ${BADGE_MODALIDADE[imovel.modalidade] ?? 'bg-gray-100 text-gray-600'}`}>
                {LABEL_MODALIDADE[imovel.modalidade] ?? imovel.modalidade}
              </span>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-green-100 text-green-700">
                Disponível
              </span>
            </div>
            <h1 className="text-2xl font-bold text-[#1A1A2E] leading-snug">
              {tipoLabel} em {imovel.bairro}
            </h1>
            <p className="text-sm text-gray-500 mt-1">{imovel.bairro}, {imovel.cidade} - {imovel.estado}</p>
          </div>

          {/* Preço */}
          <div className="bg-gray-50 rounded-2xl p-4 space-y-2">
            {mostrarVenda && imovel.valorVenda && (
              <div>
                <p className="text-xs text-gray-400">Venda</p>
                <p className="text-2xl font-bold" style={{ color: '#C9A84C' }}>
                  {formatarMoeda(imovel.valorVenda)}
                </p>
              </div>
            )}
            {mostrarLocacao && imovel.valorLocacao && (
              <div>
                <p className="text-xs text-gray-400">Locação</p>
                <p className={`font-bold ${imovel.modalidade === 'AMBOS' ? 'text-lg text-gray-700' : 'text-2xl'}`}
                  style={imovel.modalidade !== 'AMBOS' ? { color: '#C9A84C' } : {}}>
                  {formatarMoeda(imovel.valorLocacao)}/mês
                </p>
              </div>
            )}

            {/* Condomínio e IPTU */}
            {mostrarLocacao && imovel.locacaoPacote ? (
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs font-semibold bg-green-100 text-green-700 px-2 py-1 rounded-lg">
                  Pacote — condomínio e IPTU inclusos
                </span>
              </div>
            ) : (
              <div className="flex gap-4 text-sm text-gray-500 mt-1">
                {imovel.valorCondominio && (
                  <span>Cond.: <strong className="text-gray-700">{formatarMoeda(imovel.valorCondominio)}/mês</strong></span>
                )}
                {imovel.valorIptu && (
                  <span>IPTU: <strong className="text-gray-700">{formatarMoeda(imovel.valorIptu)}/mês</strong></span>
                )}
              </div>
            )}
          </div>

          {/* Características */}
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
            {imovel.areaUtil && <Caracteristica label="Área Privativa" valor={`${imovel.areaUtil} m²`} />}
            {imovel.areaTotal && <Caracteristica label="Área Total" valor={`${imovel.areaTotal} m²`} />}
            {imovel.dormitorios && imovel.dormitorios !== 'KIT_STUDIO' && (
              <Caracteristica
                label="Quartos"
                valor={imovel.dormitorios === '4_MAIS' ? '4+' : imovel.dormitorios}
              />
            )}
            {imovel.totalBanheiros && <Caracteristica label="Banheiros" valor={imovel.totalBanheiros} />}
            {imovel.vagasGaragem && imovel.vagasGaragem !== 'SEM_VAGA' && (
              <Caracteristica
                label="Vagas"
                valor={imovel.vagasGaragem === '3_MAIS' ? '3+' : imovel.vagasGaragem === 'MOTOS' ? 'Motos' : imovel.vagasGaragem}
              />
            )}
            {imovel.andar && <Caracteristica label="Andar" valor={imovel.andar} />}
            {imovel.acesso && <Caracteristica label="Acesso" valor={LABEL_ACESSO[imovel.acesso] ?? imovel.acesso} />}
          </div>

          {/* Descrição */}
          {imovel.descricao && (
            <div>
              <h3 className="text-sm font-semibold text-[#1A1A2E] mb-2">Descrição</h3>
              <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">{imovel.descricao}</p>
            </div>
          )}

          {/* Facilidades do imóvel */}
          {facilImovel.filter(f => f !== 'OUTROS').length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-[#1A1A2E] mb-2">Facilidades do Imóvel</h3>
              <div className="flex flex-wrap gap-2">
                {facilImovel.filter(f => f !== 'OUTROS').map(f => (
                  <span key={f} className="text-xs px-3 py-1.5 rounded-full bg-gray-100 text-gray-600 font-medium">
                    {LABEL_FACILIDADES_IMOVEL[f] ?? f}
                  </span>
                ))}
                {facilImovelOutros.map((tag, i) => (
                  <span key={`outros-${i}`} className="text-xs px-3 py-1.5 rounded-full bg-gray-100 text-gray-600 font-medium">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Facilidades do condomínio */}
          {facilCond.filter(f => f !== 'OUTROS').length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-[#1A1A2E] mb-2">Facilidades do Condomínio</h3>
              <div className="flex flex-wrap gap-2">
                {facilCond.filter(f => f !== 'OUTROS').map(f => (
                  <span key={f} className="text-xs px-3 py-1.5 rounded-full bg-blue-50 text-blue-600 font-medium">
                    {LABEL_FACILIDADES_COND[f] ?? f}
                  </span>
                ))}
                {facilCondOutros.map((tag, i) => (
                  <span key={`outros-cond-${i}`} className="text-xs px-3 py-1.5 rounded-full bg-blue-50 text-blue-600 font-medium">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Botões de ação */}
          <div className="space-y-3 pt-2">
            <a
              href={`https://wa.me/5513998084564?text=${msgWhatsApp}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-3 w-full py-3.5 rounded-2xl font-semibold text-white text-sm transition-opacity hover:opacity-90"
              style={{ background: '#25D366' }}
            >
              <svg viewBox="0 0 32 32" fill="none" className="w-5 h-5 flex-shrink-0">
                <circle cx="16" cy="16" r="16" fill="white" fillOpacity="0.25" />
                <path fill="white" d="M23.47 8.51A10.45 10.45 0 0 0 16 5.5 10.5 10.5 0 0 0 5.5 16c0 1.85.48 3.65 1.4 5.25L5.5 26.5l5.38-1.41A10.49 10.49 0 0 0 16 26.5 10.5 10.5 0 0 0 26.5 16a10.44 10.44 0 0 0-3.03-7.49zM16 24.73a8.73 8.73 0 0 1-4.44-1.21l-.32-.19-3.24.85.87-3.15-.21-.32A8.72 8.72 0 1 1 16 24.73zm4.79-6.53c-.26-.13-1.55-.77-1.79-.85s-.41-.13-.59.13-.68.85-.83 1.02-.3.2-.57.07a7.2 7.2 0 0 1-2.12-1.3 7.98 7.98 0 0 1-1.47-1.84c-.27-.46.27-.43.77-1.43a.48.48 0 0 0-.02-.46c-.07-.13-.59-1.42-.8-1.95s-.43-.44-.59-.45h-.5a.97.97 0 0 0-.7.32 2.95 2.95 0 0 0-.91 2.19 5.1 5.1 0 0 0 1.06 2.72 11.71 11.71 0 0 0 4.47 3.95c1.64.7 2.27.76 3.08.64a2.69 2.69 0 0 0 1.77-1.25 2.2 2.2 0 0 0 .15-1.25c-.07-.11-.23-.17-.49-.3z" />
              </svg>
              Falar com corretor no WhatsApp
            </a>

            <Link
              href="/imoveis"
              className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl font-medium text-gray-600 text-sm border border-gray-200 hover:bg-gray-50 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Voltar para a listagem
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
