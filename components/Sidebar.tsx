'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { Session } from 'next-auth'
import LogoBiocasa from './LogoBiocasa'

type Modulo = 'INCORP' | 'IMOB' | 'USUARIOS'

function rotaParaModulo(pathname: string): Modulo | null {
  if (
    pathname.startsWith('/chat') ||
    pathname.startsWith('/treinar-ia') ||
    pathname.startsWith('/analises-unidades')
  ) return 'INCORP'
  if (pathname.startsWith('/imoveis')) return 'IMOB'
  if (pathname.startsWith('/usuarios')) return 'USUARIOS'
  return null
}

export default function Sidebar({ session }: { session: Session }) {
  const pathname = usePathname()
  const usuario = session.user as any
  const perfil = usuario.perfil as string

  const isAdmin = ['MASTER', 'PROPRIETARIO'].includes(perfil)
  const temIncorporacao = isAdmin || usuario.acessoIncorp === true
  const temImoveis = isAdmin || usuario.acessoImob === true
  const temUsuarios = isAdmin

  const [moduloAberto, setModuloAberto] = useState<Modulo | null>(rotaParaModulo(pathname))
  const [recolhido, setRecolhido] = useState(false)

  // Abre automaticamente o módulo correspondente à rota atual
  useEffect(() => {
    const modulo = rotaParaModulo(pathname)
    if (modulo !== null) {
      setModuloAberto(modulo)
    }
  }, [pathname])

  function toggleModulo(modulo: Modulo) {
    if (recolhido) setRecolhido(false)
    setModuloAberto(atual => atual === modulo ? null : modulo)
  }

  const btnModulo = (ativo: boolean) =>
    `w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-bold tracking-wider transition-all ${
      ativo
        ? 'bg-dourado-400 text-escuro-700'
        : 'text-escuro-100 hover:bg-escuro-500 hover:text-white'
    }`

  const btnSub = (ativo: boolean) =>
    `flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm w-full transition-colors ${
      ativo
        ? 'text-dourado-400 bg-dourado-400/10 font-medium'
        : 'text-escuro-200 hover:text-white hover:bg-escuro-500'
    }`

  const chevron = (aberto: boolean) => (
    <svg
      className={`w-4 h-4 flex-shrink-0 transition-transform duration-200 ${aberto ? 'rotate-180' : ''}`}
      fill="none" viewBox="0 0 24 24" stroke="currentColor"
    >
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  )

  return (
    <aside className={`flex flex-col bg-escuro-700 border-r border-escuro-500 transition-all duration-300 ${recolhido ? 'w-16' : 'w-64'}`}>

      {/* Logo */}
      <div className={`flex items-center border-b border-escuro-500 px-4 py-4 ${recolhido ? 'justify-center' : 'justify-between'}`}>
        {!recolhido && <LogoBiocasa />}
        <button
          onClick={() => setRecolhido(!recolhido)}
          className="p-2 rounded-lg hover:bg-escuro-500 text-escuro-200 hover:text-white transition-colors"
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

      {/* Navegação modular */}
      <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">

        {/* ── INCORP ── */}
        {temIncorporacao && (
          <div>
            <button
              onClick={() => toggleModulo('INCORP')}
              className={btnModulo(moduloAberto === 'INCORP')}
              title="Incorporação"
            >
              <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
              {!recolhido && (
                <>
                  <span className="flex-1 text-left uppercase tracking-widest text-xs">Incorp</span>
                  {chevron(moduloAberto === 'INCORP')}
                </>
              )}
            </button>

            {moduloAberto === 'INCORP' && !recolhido && (
              <div className="mt-1 ml-3 pl-3 border-l-2 border-dourado-400/30 space-y-0.5">
                <Link href="/chat" className={btnSub(pathname.startsWith('/chat'))}>
                  <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Nova Análise
                </Link>
                {perfil === 'MASTER' && (
                  <Link href="/analises-unidades" className={btnSub(pathname === '/analises-unidades')}>
                    <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Histórico
                  </Link>
                )}
                {perfil === 'MASTER' && (
                  <Link href="/treinar-ia" className={btnSub(pathname === '/treinar-ia')}>
                    <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                    Treinamento IA
                  </Link>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── IMOB ── */}
        {temImoveis && (
          <div>
            <button
              onClick={() => toggleModulo('IMOB')}
              className={btnModulo(moduloAberto === 'IMOB')}
              title="Imóveis"
            >
              <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              {!recolhido && (
                <>
                  <span className="flex-1 text-left uppercase tracking-widest text-xs">Imob</span>
                  {chevron(moduloAberto === 'IMOB')}
                </>
              )}
            </button>

            {moduloAberto === 'IMOB' && !recolhido && (
              <div className="mt-1 ml-3 pl-3 border-l-2 border-dourado-400/30 space-y-0.5">
                <Link href="/imoveis" className={btnSub(pathname.startsWith('/imoveis'))}>
                  <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                  </svg>
                  Imóveis
                </Link>
              </div>
            )}
          </div>
        )}

        {/* ── ATENDIMENTO ── */}
        <Link
          href="/atendimento"
          className={btnModulo(pathname.startsWith('/atendimento'))}
          title="Atendimento"
        >
          <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          {!recolhido && (
            <span className="flex-1 text-left uppercase tracking-widest text-xs">Atendimento</span>
          )}
        </Link>

        {/* ── USUÁRIOS ── */}
        {temUsuarios && (
          <div>
            <button
              onClick={() => toggleModulo('USUARIOS')}
              className={btnModulo(moduloAberto === 'USUARIOS')}
              title="Usuários"
            >
              <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {!recolhido && (
                <>
                  <span className="flex-1 text-left uppercase tracking-widest text-xs">Usuários</span>
                  {chevron(moduloAberto === 'USUARIOS')}
                </>
              )}
            </button>

            {moduloAberto === 'USUARIOS' && !recolhido && (
              <div className="mt-1 ml-3 pl-3 border-l-2 border-dourado-400/30 space-y-0.5">
                <Link href="/usuarios" className={btnSub(pathname === '/usuarios')}>
                  <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                  Gerenciar Usuários
                </Link>
              </div>
            )}
          </div>
        )}
      </nav>

      {/* ── 2FA (apenas MASTER) ── */}
      {perfil === 'MASTER' && !recolhido && (
        <div className="px-2 pb-2">
          <Link
            href="/configurar-2fa"
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs transition-colors ${
              pathname === '/configurar-2fa'
                ? 'bg-dourado-400/20 text-dourado-400'
                : usuario.totpAtivado
                ? 'text-escuro-300 hover:bg-escuro-500 hover:text-white'
                : 'text-yellow-400 hover:bg-yellow-900/30'
            }`}
          >
            <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            {usuario.totpAtivado ? 'Autenticação 2FA' : '⚠ Configurar 2FA'}
          </Link>
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
