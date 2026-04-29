import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import ImovelForm from '@/components/imoveis/ImovelForm'

export default async function NovoImovelPage() {
  const session = await getServerSession(authOptions)
  const perfil = (session?.user as any)?.perfil as string

  const perfisPermitidos = ['MASTER', 'PROPRIETARIO', 'ASSISTENTE']
  if (!perfisPermitidos.includes(perfil)) {
    redirect('/imoveis')
  }

  return (
    <ImovelForm perfil={perfil} />
  )
}
