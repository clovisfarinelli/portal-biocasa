import Link from 'next/link'

export default function AcessoNegadoPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <div className="card max-w-md w-full">
        <div className="mb-4">
          <svg className="w-14 h-14 text-red-400 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
          </svg>
        </div>
        <h1 className="text-xl font-bold text-white mb-2">Acesso não autorizado</h1>
        <p className="text-escuro-200 text-sm mb-6">
          Você não tem acesso a este módulo. Entre em contato com o administrador para solicitar a liberação.
        </p>
        <Link href="/" className="btn-secondary text-sm">
          Voltar
        </Link>
      </div>
    </div>
  )
}
