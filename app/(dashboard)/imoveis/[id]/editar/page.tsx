import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect, notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import ImovelForm, { ImovelCompleto } from '@/components/imoveis/ImovelForm'

export default async function EditarImovelPage({
  params,
  searchParams,
}: {
  params: { id: string }
  searchParams: { voltar?: string }
}) {
  const session = await getServerSession(authOptions)
  const usuario = session?.user as any
  const perfil = usuario?.perfil as string

  const perfisPermitidos = ['MASTER', 'PROPRIETARIO', 'ASSISTENTE']
  if (!perfisPermitidos.includes(perfil)) {
    redirect('/imoveis')
  }

  const imovel = await prisma.imovel.findUnique({
    where: { id: params.id },
    include: { unidade: { select: { id: true, nome: true } } },
  })

  if (!imovel) notFound()

  // Restrição de unidade para não-MASTER
  if (perfil !== 'MASTER' && imovel.unidadeId !== usuario.unidadeId) {
    redirect('/imoveis')
  }

  const imovelData: ImovelCompleto = {
    ...imovel,
    dataCadastro: imovel.dataCadastro.toISOString(),
    updatedAt: imovel.updatedAt.toISOString(),
  }

  const voltarUrl = (searchParams.voltar && searchParams.voltar.startsWith('/imoveis'))
    ? searchParams.voltar
    : '/imoveis'

  return <ImovelForm imovelId={params.id} imovelInicial={imovelData} perfil={perfil} voltarUrl={voltarUrl} />
}
