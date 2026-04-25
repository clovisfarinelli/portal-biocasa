import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import AnalisesUnidades from '@/components/AnalisesUnidades'

export default async function AnalisesUnidadesPage() {
  const session = await getServerSession(authOptions)
  if ((session?.user as any)?.perfil !== 'MASTER') redirect('/chat')

  return (
    <div className="h-full overflow-y-auto">
      <AnalisesUnidades session={session!} />
    </div>
  )
}
