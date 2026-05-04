import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import DashboardMaster from '@/components/DashboardMaster'

export default async function ConsolidadoPage() {
  const session = await getServerSession(authOptions)
  if ((session?.user as any)?.perfil !== 'MASTER') redirect('/')
  return <DashboardMaster />
}
