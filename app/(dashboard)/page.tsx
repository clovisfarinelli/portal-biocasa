import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import LogoBiocasa from '@/components/LogoBiocasa'

export default async function HomePage() {
  const session = await getServerSession(authOptions)
  const nome = (session?.user as any)?.name as string | undefined
  const primeiroNome = nome?.split(' ')[0] ?? ''

  return (
    <div className="flex flex-col items-center justify-center h-full">
      <LogoBiocasa className="h-20" />
      <p className="text-escuro-300 text-sm mt-5">
        Bem-vindo, <span className="text-white font-medium">{primeiroNome}</span>
      </p>
    </div>
  )
}
