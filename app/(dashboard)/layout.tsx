import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Sidebar from '@/components/Sidebar'
import LayoutPrincipal from '@/components/LayoutPrincipal'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/login')
  }

  return (
    <div className="flex h-screen overflow-hidden bg-escuro-600">
      <Sidebar session={session} />
      <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
        <LayoutPrincipal>{children}</LayoutPrincipal>
        <footer className="flex-shrink-0 text-center py-2 px-4 text-xs text-gray-500 border-t border-escuro-500">
          © 2026 CF8 · Portal Biocasa ·{' '}
          <a href="/privacidade" target="_blank" rel="noopener noreferrer" className="underline hover:text-gray-400 transition-colors">
            Política de Privacidade
          </a>
          {' · '}
          <a href="/termos" target="_blank" rel="noopener noreferrer" className="underline hover:text-gray-400 transition-colors">
            Termos de Uso
          </a>
        </footer>
      </div>
    </div>
  )
}
