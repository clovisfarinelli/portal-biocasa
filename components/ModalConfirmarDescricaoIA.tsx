'use client'

import { useEffect } from 'react'

interface Props {
  onGerarComIA: () => void
  onManterTexto: () => void
}

export default function ModalConfirmarDescricaoIA({ onGerarComIA, onManterTexto }: Props) {
  // Bloquear scroll do body enquanto modal aberto
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}
      onClick={onManterTexto}
    >
      <div
        className="w-full max-w-md rounded-2xl border border-escuro-400 p-6 shadow-2xl"
        style={{ backgroundColor: '#1A1A2E' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Ícone */}
        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-dourado-400/15 border border-dourado-400/40 mx-auto mb-4">
          <svg className="w-6 h-6 text-dourado-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
        </div>

        <h2 className="text-lg font-semibold text-white text-center mb-2">
          Descrição já preenchida
        </h2>
        <p className="text-sm text-escuro-200 text-center mb-6">
          Este imóvel já possui uma descrição. Deseja substituí-la por uma gerada pela IA?
        </p>

        <div className="flex flex-col gap-3">
          <button
            type="button"
            onClick={onGerarComIA}
            className="w-full py-2.5 px-4 rounded-xl font-semibold text-sm transition-colors"
            style={{ backgroundColor: '#C9A84C', color: '#1A1A2E' }}
            onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#b8973b')}
            onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#C9A84C')}
          >
            Gerar com IA
          </button>
          <button
            type="button"
            onClick={onManterTexto}
            className="w-full py-2.5 px-4 rounded-xl border border-escuro-400 text-sm text-escuro-100 hover:border-escuro-300 hover:text-white transition-colors"
          >
            Manter meu texto
          </button>
        </div>
      </div>
    </div>
  )
}
