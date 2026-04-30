'use client'

import { useState } from 'react'

interface FotoItem { url: string; ordem: number; principal: boolean }

function fotoUrl(url: string) {
  return `/api/imoveis/publico/fotos?url=${encodeURIComponent(url)}`
}

export default function GaleriaPublica({ fotos }: { fotos: FotoItem[] }) {
  const fotosOrdenadas = [...fotos].sort((a, b) => a.ordem - b.ordem)
  const [idx, setIdx] = useState(() => {
    const principalIdx = fotosOrdenadas.findIndex(f => f.principal)
    return principalIdx >= 0 ? principalIdx : 0
  })

  if (fotosOrdenadas.length === 0) {
    return (
      <div className="w-full aspect-[4/3] bg-gray-100 rounded-2xl flex items-center justify-center">
        <svg className="w-16 h-16 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* Foto principal */}
      <div className="w-full aspect-[4/3] bg-gray-100 rounded-2xl overflow-hidden">
        <img
          src={fotoUrl(fotosOrdenadas[idx].url)}
          alt={`Foto ${idx + 1}`}
          className="w-full h-full object-cover object-center"
        />
      </div>

      {/* Miniaturas */}
      {fotosOrdenadas.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {fotosOrdenadas.map((foto, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setIdx(i)}
              className={`flex-shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 transition-all ${
                i === idx ? 'border-[#C9A84C] opacity-100' : 'border-transparent opacity-60 hover:opacity-90'
              }`}
            >
              <img
                src={fotoUrl(foto.url)}
                alt={`Miniatura ${i + 1}`}
                className="w-full h-full object-cover object-center"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
