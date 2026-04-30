import type { Metadata } from 'next'
import HeaderSite from './HeaderSite'

export const metadata: Metadata = {
  title: 'Biocasa Santos — Imóveis para Venda e Locação',
  description: 'Encontre apartamentos, casas, terrenos e muito mais em Santos e região. Imóveis para venda e locação com a Biocasa.',
}

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#F8F9FA', color: '#1A1A2E' }}>
      <HeaderSite />

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
