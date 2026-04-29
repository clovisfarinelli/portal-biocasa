import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect, notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import ImovelForm, { ImovelCompleto } from '@/components/imoveis/ImovelForm'
import Link from 'next/link'

export default async function EditarImovelPage({ params }: { params: { id: string } }) {
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

  const fotos: { url: string }[] = imovel.fotos
    ? (() => { try { return JSON.parse(imovel.fotos) } catch { return [] } })()
    : []

  const imovelData: ImovelCompleto = {
    ...imovel,
    dataCadastro: imovel.dataCadastro.toISOString(),
    updatedAt: imovel.updatedAt.toISOString(),
  }

  return (
    <div>
      {fotos.length > 0 && (
        <div className="max-w-4xl mx-auto px-4 pt-4 flex justify-end">
          <a
            href={`/api/imoveis/${params.id}/fotos/zip`}
            download
            className="btn-secondary flex items-center gap-2 text-sm"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Baixar Fotos
          </a>
        </div>
      )}
      <ImovelForm imovelId={params.id} imovelInicial={imovelData} perfil={perfil} />
    </div>
  )
}
