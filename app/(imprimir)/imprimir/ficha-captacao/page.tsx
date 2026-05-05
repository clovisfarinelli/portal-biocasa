import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import FichaImpressaoClient from './FichaImpressaoClient'

export default async function FichaCaptacaoImpressaoPage() {
  const session = await getServerSession(authOptions)
  const usuario = session?.user as any
  const perfil = usuario?.perfil as string

  if (!['MASTER', 'PROPRIETARIO'].includes(perfil)) {
    redirect('/imoveis/relatorios')
  }

  return <FichaImpressaoClient />
}
