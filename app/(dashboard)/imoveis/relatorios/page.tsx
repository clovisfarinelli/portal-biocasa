import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function RelatoriosPage() {
  const session = await getServerSession(authOptions)
  const usuario = session?.user as any
  const perfil = usuario?.perfil as string

  if (!['MASTER', 'PROPRIETARIO'].includes(perfil)) {
    redirect('/imoveis')
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Relatórios</h1>
        <p className="text-sm text-escuro-300 mt-0.5">Relatórios e fichas para uso interno da equipe</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="card flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-dourado-400/10 border border-dourado-400/30 flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-dourado-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <h2 className="text-white font-semibold text-sm">Ficha de Captação</h2>
              <p className="text-escuro-300 text-xs mt-0.5">Formulário em branco para preenchimento à mão</p>
            </div>
          </div>
          <Link
            href="/imprimir/ficha-captacao"
            target="_blank"
            className="btn-primary text-sm text-center flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            Imprimir
          </Link>
        </div>
      </div>
    </div>
  )
}
