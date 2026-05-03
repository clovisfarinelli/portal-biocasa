import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import DashboardConsolidado from '@/components/DashboardConsolidado'

export default async function ConsolidadoPage() {
  const session = await getServerSession(authOptions)
  if ((session?.user as any)?.perfil !== 'MASTER') redirect('/')
  return (
    <div className="h-full overflow-auto">
      <DashboardConsolidado />
    </div>
  )
}
