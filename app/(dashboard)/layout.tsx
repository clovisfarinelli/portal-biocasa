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
      <LayoutPrincipal>{children}</LayoutPrincipal>
    </div>
  )
}
