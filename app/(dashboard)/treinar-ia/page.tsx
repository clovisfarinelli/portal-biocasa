import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import TreinarIA from '@/components/TreinarIA'

export default async function TreinarIAPage() {
  const session = await getServerSession(authOptions)
  const perfil = (session?.user as any)?.perfil

  if (perfil !== 'MASTER') {
    redirect('/chat')
  }

  return (
    <div className="h-full">
      <TreinarIA session={session!} />
    </div>
  )
}
