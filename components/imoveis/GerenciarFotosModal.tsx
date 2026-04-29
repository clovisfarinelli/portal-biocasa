'use client'

import { useState, useEffect, useRef } from 'react'
import GaleriaFotos from './GaleriaFotos'

interface FotoItem { url: string; ordem: number; principal: boolean }

interface Props {
  imovelId: string
  fotosIniciais: FotoItem[]
}

export default function GerenciarFotosModal({ imovelId, fotosIniciais }: Props) {
  const [aberto, setAberto] = useState(false)
  const [totalFotos, setTotalFotos] = useState(fotosIniciais.length)
  const overlayRef = useRef<HTMLDivElement>(null)

  // Fecha ao pressionar ESC
  useEffect(() => {
    if (!aberto) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setAberto(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [aberto])

  // Bloqueia scroll do body quando aberto
  useEffect(() => {
    document.body.style.overflow = aberto ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [aberto])

  function onClickOverlay(e: React.MouseEvent) {
    if (e.target === overlayRef.current) setAberto(false)
  }

  return (
    <>
      {/* Trigger */}
      <div className="flex items-center justify-between">
        <span className="text-sm text-escuro-300">
          {totalFotos} foto{totalFotos !== 1 ? 's' : ''} cadastrada{totalFotos !== 1 ? 's' : ''}
        </span>
        <button
          type="button"
          onClick={() => setAberto(true)}
          className="btn-primary flex items-center gap-2 text-sm"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          Gerenciar Fotos
        </button>
      </div>

      {/* Modal */}
      {aberto && (
        <div
          ref={overlayRef}
          onClick={onClickOverlay}
          className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4"
        >
          <div className="bg-escuro-600 border border-escuro-400 rounded-2xl w-full max-w-3xl max-h-[88vh] flex flex-col shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-escuro-400 flex-shrink-0">
              <div>
                <h2 className="text-white font-semibold text-lg">Gerenciar Fotos</h2>
                <p className="text-escuro-300 text-sm mt-0.5">
                  {totalFotos} foto{totalFotos !== 1 ? 's' : ''} cadastrada{totalFotos !== 1 ? 's' : ''}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setAberto(false)}
                className="w-8 h-8 flex items-center justify-center rounded-lg bg-escuro-500 hover:bg-escuro-400 text-escuro-200 hover:text-white transition-colors"
                aria-label="Fechar"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Content scrollável */}
            <div className="flex-1 overflow-y-auto p-5">
              <GaleriaFotos
                imovelId={imovelId}
                fotosIniciais={fotosIniciais}
                onFotosChange={f => setTotalFotos(f.length)}
              />
            </div>
          </div>
        </div>
      )}
    </>
  )
}
