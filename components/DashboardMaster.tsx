'use client'

import { Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import DashboardConsolidado from '@/components/DashboardConsolidado'
import UserManagement from '@/components/UserManagement'

type Aba = 'metricas' | 'usuarios' | 'auditoria' | 'configuracoes'

const ABAS: { id: Aba; label: string; icone: React.ReactNode }[] = [
  {
    id: 'metricas',
    label: 'Métricas',
    icone: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
  },
  {
    id: 'usuarios',
    label: 'Usuários',
    icone: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
  {
    id: 'auditoria',
    label: 'Auditoria',
    icone: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
      </svg>
    ),
  },
  {
    id: 'configuracoes',
    label: 'Configurações',
    icone: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
]

function AbaEmBreve({ titulo, descricao }: { titulo: string; descricao: string }) {
  return (
    <div className="flex items-center justify-center h-full min-h-[400px]">
      <div className="text-center">
        <div className="w-16 h-16 rounded-full bg-dourado-400/10 border border-dourado-400/20 flex items-center justify-center mx-auto mb-4">
          <svg className="w-7 h-7 text-dourado-400/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h2 className="text-white font-semibold text-lg mb-2">{titulo}</h2>
        <p className="text-escuro-300 text-sm max-w-xs mx-auto">{descricao}</p>
        <span className="inline-block mt-4 px-3 py-1 rounded-full bg-dourado-400/10 text-dourado-400 text-xs font-medium">
          Em desenvolvimento
        </span>
      </div>
    </div>
  )
}

function DashboardMasterInner() {
  const { data: session } = useSession()
  const searchParams     = useSearchParams()
  const router           = useRouter()
  const abaAtual         = (searchParams.get('aba') as Aba) ?? 'metricas'

  function mudarAba(aba: Aba) {
    router.replace(`/consolidado?aba=${aba}`)
  }

  if (!session) return null

  return (
    <div className="flex flex-col h-full">
      {/* Barra de abas */}
      <div className="flex-shrink-0 border-b border-escuro-500 bg-escuro-700 px-6">
        <div className="flex gap-1 overflow-x-auto">
          {ABAS.map(aba => (
            <button
              key={aba.id}
              onClick={() => mudarAba(aba.id)}
              className={`flex items-center gap-2 px-4 py-3.5 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
                abaAtual === aba.id
                  ? 'border-dourado-400 text-dourado-400'
                  : 'border-transparent text-escuro-300 hover:text-white hover:border-escuro-300'
              }`}
            >
              {aba.icone}
              {aba.label}
            </button>
          ))}
        </div>
      </div>

      {/* Conteúdo da aba */}
      <div className="flex-1 overflow-auto">
        {abaAtual === 'metricas'      && <DashboardConsolidado />}
        {abaAtual === 'usuarios'      && <UserManagement session={session} />}
        {abaAtual === 'auditoria'     && (
          <AbaEmBreve
            titulo="Auditoria"
            descricao="Timeline de ações e logs de segurança de todas as unidades. Disponível na Tarefa 5.3."
          />
        )}
        {abaAtual === 'configuracoes' && (
          <AbaEmBreve
            titulo="Configurações"
            descricao="Configurações centralizadas do sistema — câmbio, limites de análises, parâmetros Chatwoot. Disponível na Tarefa 5.5."
          />
        )}
      </div>
    </div>
  )
}

export default function DashboardMaster() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-full">
        <div className="w-8 h-8 border-2 border-dourado-400 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <DashboardMasterInner />
    </Suspense>
  )
}
