import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import UserManagement from '@/components/UserManagement'

export default async function UsuariosPage() {
  const session = await getServerSession(authOptions)
  const perfil = (session?.user as any)?.perfil

  if (perfil === 'ESPECIALISTA') {
    redirect('/chat')
  }

  return (
    <div className="h-full">
      <UserManagement session={session!} />
    </div>
  )
}
