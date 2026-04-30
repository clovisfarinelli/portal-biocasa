'use client'

import { useState } from 'react'
import Link from 'next/link'
import LogoBiocasa from '@/components/LogoBiocasa'

export default function HeaderSite() {
  const [menuAberto, setMenuAberto] = useState(false)

  return (
    <header className="fixed top-0 inset-x-0 z-50 bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center gap-4">
        {/* Logo */}
        <Link href="/" className="flex-shrink-0">
          <LogoBiocasa />
        </Link>

        {/* Nav desktop */}
        <nav className="hidden lg:flex items-center gap-1 ml-2">
          {/* Proprietários */}
          <div className="group relative">
            <button className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-gray-700 hover:text-[#C9A84C] rounded-lg hover:bg-gray-50 transition-colors">
              Proprietários
              <svg className="w-3 h-3 mt-0.5 transition-transform group-hover:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            <div className="absolute top-full left-0 mt-1 w-52 bg-white rounded-xl shadow-lg border border-gray-100 opacity-0 invisible translate-y-1 group-hover:opacity-100 group-hover:visible group-hover:translate-y-0 transition-all duration-200 z-50">
              <a href="#" className="flex items-center px-4 py-3 text-sm text-gray-700 hover:text-[#C9A84C] hover:bg-gray-50 rounded-xl transition-colors">
                Cadastre seu Imóvel
              </a>
            </div>
          </div>

          {/* Biocasa */}
          <div className="group relative">
            <button className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-gray-700 hover:text-[#C9A84C] rounded-lg hover:bg-gray-50 transition-colors">
              Biocasa
              <svg className="w-3 h-3 mt-0.5 transition-transform group-hover:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            <div className="absolute top-full left-0 mt-1 w-52 bg-white rounded-xl shadow-lg border border-gray-100 opacity-0 invisible translate-y-1 group-hover:opacity-100 group-hover:visible group-hover:translate-y-0 transition-all duration-200 z-50">
              <a href="#" className="flex items-center px-4 py-3 text-sm text-gray-700 hover:text-[#C9A84C] hover:bg-gray-50 rounded-t-xl transition-colors border-b border-gray-50">
                Quem Somos
              </a>
              <a href="#" className="flex items-center px-4 py-3 text-sm text-gray-700 hover:text-[#C9A84C] hover:bg-gray-50 rounded-b-xl transition-colors">
                Seja um Franqueado
              </a>
            </div>
          </div>
        </nav>

        {/* Direita */}
        <div className="ml-auto flex items-center gap-3 sm:gap-4">
          {/* Redes sociais */}
          <div className="hidden sm:flex items-center gap-3">
            <a href="#" aria-label="Instagram" className="text-gray-500 hover:text-[#C9A84C] transition-colors">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                <circle cx="12" cy="12" r="4" />
                <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" strokeWidth="0" />
              </svg>
            </a>
            <a href="#" aria-label="YouTube" className="text-gray-500 hover:text-[#C9A84C] transition-colors">
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
              </svg>
            </a>
            <a href="#" aria-label="TikTok" className="text-gray-500 hover:text-[#C9A84C] transition-colors">
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-[18px] h-[18px]">
                <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.27 6.27 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.75a4.85 4.85 0 0 1-1.01-.06z" />
              </svg>
            </a>
          </div>

          {/* WhatsApp */}
          <a
            href="https://wa.me/5513998084564"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-green-600 transition-colors"
          >
            <svg viewBox="0 0 32 32" fill="none" className="w-7 h-7 flex-shrink-0">
              <circle cx="16" cy="16" r="16" fill="#25D366" />
              <path fill="white" d="M23.47 8.51A10.45 10.45 0 0 0 16 5.5 10.5 10.5 0 0 0 5.5 16c0 1.85.48 3.65 1.4 5.25L5.5 26.5l5.38-1.41A10.49 10.49 0 0 0 16 26.5 10.5 10.5 0 0 0 26.5 16a10.44 10.44 0 0 0-3.03-7.49zM16 24.73a8.73 8.73 0 0 1-4.44-1.21l-.32-.19-3.24.85.87-3.15-.21-.32A8.72 8.72 0 1 1 16 24.73zm4.79-6.53c-.26-.13-1.55-.77-1.79-.85s-.41-.13-.59.13-.68.85-.83 1.02-.3.2-.57.07a7.2 7.2 0 0 1-2.12-1.3 7.98 7.98 0 0 1-1.47-1.84c-.27-.46.27-.43.77-1.43a.48.48 0 0 0-.02-.46c-.07-.13-.59-1.42-.8-1.95s-.43-.44-.59-.45h-.5a.97.97 0 0 0-.7.32 2.95 2.95 0 0 0-.91 2.19 5.1 5.1 0 0 0 1.06 2.72 11.71 11.71 0 0 0 4.47 3.95c1.64.7 2.27.76 3.08.64a2.69 2.69 0 0 0 1.77-1.25 2.2 2.2 0 0 0 .15-1.25c-.07-.11-.23-.17-.49-.3z" />
            </svg>
            <span className="hidden md:inline">(13) 99808-4564</span>
          </a>

          {/* Hamburger mobile */}
          <button
            onClick={() => setMenuAberto(a => !a)}
            className="lg:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
            aria-label={menuAberto ? 'Fechar menu' : 'Abrir menu'}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {menuAberto
                ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              }
            </svg>
          </button>
        </div>
      </div>

      {/* Menu mobile */}
      {menuAberto && (
        <div className="lg:hidden border-t border-gray-100 bg-white px-4 pb-5 shadow-lg">
          <div className="pt-3 space-y-0.5">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest px-3 pt-2 pb-1">Proprietários</p>
            <a href="#" className="block px-3 py-2.5 text-sm text-gray-700 hover:text-[#C9A84C] hover:bg-gray-50 rounded-lg transition-colors">
              Cadastre seu Imóvel
            </a>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest px-3 pt-3 pb-1">Biocasa</p>
            <a href="#" className="block px-3 py-2.5 text-sm text-gray-700 hover:text-[#C9A84C] hover:bg-gray-50 rounded-lg transition-colors">
              Quem Somos
            </a>
            <a href="#" className="block px-3 py-2.5 text-sm text-gray-700 hover:text-[#C9A84C] hover:bg-gray-50 rounded-lg transition-colors">
              Seja um Franqueado
            </a>
            <div className="flex items-center gap-4 px-3 pt-4">
              <a href="#" aria-label="Instagram" className="text-gray-500 hover:text-[#C9A84C] transition-colors">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                  <circle cx="12" cy="12" r="4" />
                  <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" strokeWidth="0" />
                </svg>
              </a>
              <a href="#" aria-label="YouTube" className="text-gray-500 hover:text-[#C9A84C] transition-colors">
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                </svg>
              </a>
              <a href="#" aria-label="TikTok" className="text-gray-500 hover:text-[#C9A84C] transition-colors">
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-[18px] h-[18px]">
                  <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.27 6.27 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.75a4.85 4.85 0 0 1-1.01-.06z" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
