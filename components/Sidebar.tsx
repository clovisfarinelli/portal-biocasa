'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { Session } from 'next-auth'
import LogoBiocasa from './LogoBiocasa'
import { formatarMoeda, formatarNumero } from '@/lib/utils'

interface Analise {
  id: string
  criadoEm: string
  inscricaoImobiliaria?: string
  statusValidacao: string
  cidade?: { nome: string }
  usuario?: { nome: string }
  unidade?: { nome: string }
  custoBrl: number
  tokensInput: number
  tokensOutput: number
}

interface ConsumoMes {
  totalAnalises: number
  totalTokens: number
  totalCusto: number
}

export default function Sidebar({ session }: { session: Session }) {
  const pathname = usePathname()
  const router = useRouter()
  const usuario = session.user as any
  const perfil = usuario.perfil as string

  const [historico, setHistorico] = useState<Analise[]>([])
  const [consumo, setConsumo] = useState<ConsumoMes>({ totalAnalises: 0, totalTokens: 0, totalCusto: 0 })
  const [recolhido, setRecolhido] = useState(false)

  const isAdmin = ['MASTER', 'PROPRIETARIO'].includes(perfil)
  const temIncorporacao = isAdmin || usuario.acessoIncorp === true
  const temImoveis = isAdmin || usuario.acessoImob === true

  useEffect(() => {
    if (temIncorporacao) carregarHistorico()
  }, [pathname])

  async function carregarHistorico() {
    // MASTER usa ?proprio=true para ver apenas sua própria unidade no histórico
    const params = perfil === 'MASTER' ? '?pagina=1&proprio=true' : '?pagina=1'
    const res = await fetch(`/api/analises${params}`)
    if (!res.ok) return
    const data = await res.json()
    const analises: Analise[] = data.analises?.slice(0, 10) ?? []
    setHistorico(analises)

    const inicio = new Date()
    inicio.setDate(1)
    inicio.setHours(0, 0, 0, 0)
    const mes = analises.filter(a => new Date(a.criadoEm) >= inicio)
    setConsumo({
      totalAnalises: mes.length,
      totalTokens: mes.reduce((s, a) => s + a.tokensInput + a.tokensOutput, 0),
      totalCusto: mes.reduce((s, a) => s + a.custoBrl, 0),
    })
  }

  function primeiroNome(nome?: string) {
    return nome?.split(' ')[0] ?? ''
  }

  function novaAnalise() {
    router.push('/chat')
    router.refresh()
  }

  return (
    <aside className={`flex flex-col bg-escuro-700 border-r border-escuro-500 transition-all duration-300 ${recolhido ? 'w-16' : 'w-72'}`}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-escuro-500">
        {!recolhido && <LogoBiocasa />}
        <button
          onClick={() => setRecolhido(!recolhido)}
          className="p-2 rounded-lg hover:bg-escuro-500 text-escuro-200 hover:text-white transition-colors ml-auto"
          title={recolhido ? 'Expandir menu' : 'Recolher menu'}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            {recolhido
              ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            }
          </svg>
        </button>
      </div>

      {/* Nova Análise — apenas módulo incorporação */}
      {temIncorporacao && (
        <div className="px-3 py-3">
          <button
            onClick={novaAnalise}
            className="btn-primary w-full flex items-center justify-center gap-2 py-2.5"
            title="Nova Análise"
          >
            <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            {!recolhido && <span>Nova Análise</span>}
          </button>
        </div>
      )}

      {/* Nav items */}
      <nav className="px-3 space-y-1">
        {temImoveis && (
          <Link
            href="/imoveis"
            className={pathname.startsWith('/imoveis') ? 'sidebar-item-active' : 'sidebar-item'}
            title="Imóveis"
          >
            <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            {!recolhido && <span>Imóveis</span>}
          </Link>
        )}

        {['MASTER', 'PROPRIETARIO'].includes(perfil) && (
          <Link href="/usuarios" className={pathname === '/usuarios' ? 'sidebar-item-active' : 'sidebar-item'} title="Usuários">
            <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            {!recolhido && <span>Usuários</span>}
          </Link>
        )}

        {perfil === 'MASTER' && (
          <>
            <Link href="/analises-unidades" className={pathname === '/analises-unidades' ? 'sidebar-item-active' : 'sidebar-item'} title="Análises das Unidades">
              <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              {!recolhido && <span>Análises das Unidades</span>}
            </Link>

            <Link href="/treinar-ia" className={pathname === '/treinar-ia' ? 'sidebar-item-active' : 'sidebar-item'} title="Treinar IA">
              <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              {!recolhido && <span>Treinar IA</span>}
            </Link>
          </>
        )}
      </nav>

      {/* Histórico — apenas módulo incorporação */}
      {temIncorporacao && !recolhido && (
        <div className="flex-1 overflow-y-auto px-3 py-4">
          <p className="text-xs font-semibold text-escuro-300 uppercase tracking-wider mb-2 px-1">Histórico</p>
          {historico.length === 0 ? (
            <p className="text-xs text-escuro-300 px-1 italic">Nenhuma análise ainda</p>
          ) : (
            <div className="space-y-1">
              {historico.map(analise => {
                const invalida = analise.statusValidacao === 'INVALIDA'
                const valida   = analise.statusValidacao === 'VALIDA'
                const corTitulo = invalida
                  ? 'text-red-400 group-hover:text-red-300'
                  : valida
                    ? 'text-dourado-300 group-hover:text-dourado-200'
                    : 'text-white group-hover:text-dourado-300'
                return (
                  <Link
                    key={analise.id}
                    href={`/chat?analise=${analise.id}`}
                    className="block px-3 py-2 rounded-lg hover:bg-escuro-500 transition-colors group"
                  >
                    <div className="flex items-center gap-1.5">
                      {invalida && (
                        <svg className="w-3 h-3 text-red-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                      )}
                      <p className={`text-xs truncate font-medium transition-colors ${corTitulo}`}>
                        {analise.inscricaoImobiliaria ?? 'Análise sem inscrição'}
                      </p>
                    </div>
                    <p className="text-[11px] text-escuro-300 truncate">
                      {analise.cidade?.nome ?? 'Sem cidade'} · {new Date(analise.criadoEm).toLocaleDateString('pt-BR')}
                    </p>
                    {(analise.usuario?.nome || analise.unidade?.nome) && (
                      <p className="text-[11px] text-escuro-400 truncate">
                        {primeiroNome(analise.usuario?.nome)}
                        {analise.unidade?.nome ? ` · ${analise.unidade.nome}` : ''}
                      </p>
                    )}
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Spacer para perfis sem histórico */}
      {!temIncorporacao && <div className="flex-1" />}

      {/* Consumo do mês — apenas módulo incorporação */}
      {temIncorporacao && !recolhido && (
        <div className="border-t border-escuro-500 px-4 py-3">
          <p className="text-xs font-semibold text-escuro-300 uppercase tracking-wider mb-2">Consumo do mês</p>
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-escuro-200">Análises</span>
              <span className="text-white font-medium">{consumo.totalAnalises}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-escuro-200">Tokens</span>
              <span className="text-white font-medium">{formatarNumero(consumo.totalTokens)}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-escuro-200">Custo est.</span>
              <span className="text-dourado-400 font-semibold">{formatarMoeda(consumo.totalCusto)}</span>
            </div>
          </div>
        </div>
      )}

      {/* Usuário logado */}
      <div className="border-t border-escuro-500 px-3 py-3">
        <div className={`flex items-center gap-3 ${recolhido ? 'justify-center' : ''}`}>
          <div className="w-8 h-8 rounded-full bg-dourado-400/20 border border-dourado-400/40 flex items-center justify-center flex-shrink-0">
            <span className="text-dourado-400 text-xs font-bold">
              {session.user?.name?.charAt(0).toUpperCase() ?? 'U'}
            </span>
          </div>
          {!recolhido && (
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-white truncate">{session.user?.name}</p>
              <p className="text-[10px] text-escuro-300 truncate">{perfil}</p>
            </div>
          )}
          {!recolhido && (
            <button
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="p-1.5 rounded-lg hover:bg-escuro-500 text-escuro-300 hover:text-red-400 transition-colors"
              title="Sair"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </aside>
  )
}
