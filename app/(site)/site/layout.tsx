import type { Metadata } from 'next'
import Link from 'next/link'
import LogoBiocasa from '@/components/LogoBiocasa'

export const metadata: Metadata = {
  title: 'Biocasa Santos — Imóveis para Venda e Locação',
  description: 'Encontre apartamentos, casas, terrenos e muito mais em Santos e região. Imóveis para venda e locação com a Biocasa.',
}

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#F8F9FA', color: '#1A1A2E' }}>
      {/* Header */}
      <header className="fixed top-0 inset-x-0 z-50 bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex-shrink-0">
            <LogoBiocasa />
          </Link>
          <a
            href="https://wa.me/5513998084564"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-green-600 transition-colors"
          >
            <svg viewBox="0 0 32 32" fill="none" className="w-7 h-7 flex-shrink-0">
              <circle cx="16" cy="16" r="16" fill="#25D366" />
              <path
                fill="white"
                d="M23.47 8.51A10.45 10.45 0 0 0 16 5.5 10.5 10.5 0 0 0 5.5 16c0 1.85.48 3.65 1.4 5.25L5.5 26.5l5.38-1.41A10.49 10.49 0 0 0 16 26.5 10.5 10.5 0 0 0 26.5 16a10.44 10.44 0 0 0-3.03-7.49zM16 24.73a8.73 8.73 0 0 1-4.44-1.21l-.32-.19-3.24.85.87-3.15-.21-.32A8.72 8.72 0 1 1 16 24.73zm4.79-6.53c-.26-.13-1.55-.77-1.79-.85s-.41-.13-.59.13-.68.85-.83 1.02-.3.2-.57.07a7.2 7.2 0 0 1-2.12-1.3 7.98 7.98 0 0 1-1.47-1.84c-.27-.46.27-.43.77-1.43a.48.48 0 0 0-.02-.46c-.07-.13-.59-1.42-.8-1.95s-.43-.44-.59-.45h-.5a.97.97 0 0 0-.7.32 2.95 2.95 0 0 0-.91 2.19 5.1 5.1 0 0 0 1.06 2.72 11.71 11.71 0 0 0 4.47 3.95c1.64.7 2.27.76 3.08.64a2.69 2.69 0 0 0 1.77-1.25 2.2 2.2 0 0 0 .15-1.25c-.07-.11-.23-.17-.49-.3z"
              />
            </svg>
            <span className="hidden sm:inline">(13) 99808-4564</span>
          </a>
        </div>
      </header>

      {/* Conteúdo */}
      <main className="flex-1 pt-16">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-escuro-600 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 text-center space-y-1">
          <p className="text-escuro-200 text-sm font-medium">
            © 2026 Biocasa Santos — Todos os direitos reservados
          </p>
          <p className="text-escuro-400 text-sm">
            (13) 99808-4564 · CRECI-SP XXXXXX
          </p>
        </div>
      </footer>
    </div>
  )
}
