'use client'

import { useEffect, useCallback } from 'react'

interface FotoItem {
  url: string
  ordem: number
  principal: boolean
}

interface Props {
  fotos:    FotoItem[]
  indice:   number
  onFechar: () => void
  onNavegar: (novoIndice: number) => void
}

function proxyUrl(url: string) {
  return `/api/imoveis/fotos/download?url=${encodeURIComponent(url)}`
}

export default function Lightbox({ fotos, indice, onFechar, onNavegar }: Props) {
  const total    = fotos.length
  const anterior = (indice - 1 + total) % total
  const proximo  = (indice + 1) % total

  const ir = useCallback((novo: number) => onNavegar(novo), [onNavegar])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape')      onFechar()
      if (e.key === 'ArrowLeft')   ir(anterior)
      if (e.key === 'ArrowRight')  ir(proximo)
    }
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [onFechar, ir, anterior, proximo])

  if (!fotos[indice]) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(6px)' }}
      onClick={onFechar}
    >
      {/* Contador */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 text-white/70 text-sm font-medium select-none">
        {indice + 1} / {total}
      </div>

      {/* Fechar */}
      <button
        onClick={onFechar}
        className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 transition-colors flex items-center justify-center text-white"
        aria-label="Fechar"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {/* Seta esquerda */}
      {total > 1 && (
        <button
          onClick={e => { e.stopPropagation(); ir(anterior) }}
          className="absolute left-3 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 transition-colors flex items-center justify-center text-white"
          aria-label="Foto anterior"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      )}

      {/* Imagem */}
      <img
        src={proxyUrl(fotos[indice].url)}
        alt={`Foto ${indice + 1} de ${total}`}
        onClick={e => e.stopPropagation()}
        className="max-h-[90vh] max-w-[90vw] object-contain rounded-lg shadow-2xl select-none"
        draggable={false}
      />

      {/* Seta direita */}
      {total > 1 && (
        <button
          onClick={e => { e.stopPropagation(); ir(proximo) }}
          className="absolute right-3 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 transition-colors flex items-center justify-center text-white"
          aria-label="Próxima foto"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      )}

      {/* Miniaturas */}
      {total > 1 && (
        <div
          className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 px-3 py-2 bg-black/50 rounded-full"
          onClick={e => e.stopPropagation()}
        >
          {fotos.map((_, i) => (
            <button
              key={i}
              onClick={() => ir(i)}
              className={`w-2 h-2 rounded-full transition-all ${
                i === indice ? 'bg-dourado-400 scale-125' : 'bg-white/40 hover:bg-white/70'
              }`}
              aria-label={`Ir para foto ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  )
}
