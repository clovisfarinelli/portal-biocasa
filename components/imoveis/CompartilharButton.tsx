'use client'

import { useState } from 'react'

const BASE_URL = 'https://imoveis.cf8.com.br'

interface Props {
  slug: string
}

export default function CompartilharButton({ slug }: Props) {
  const [copiado, setCopiado] = useState(false)

  async function copiar() {
    const url = `${BASE_URL}/imoveis/${slug}`
    try {
      await navigator.clipboard.writeText(url)
    } catch {
      // fallback para browsers sem clipboard API
      const el = document.createElement('textarea')
      el.value = url
      el.style.position = 'fixed'
      el.style.opacity = '0'
      document.body.appendChild(el)
      el.select()
      document.execCommand('copy')
      document.body.removeChild(el)
    }
    setCopiado(true)
    setTimeout(() => setCopiado(false), 2500)
  }

  return (
    <div className="relative">
      <button
        onClick={copiar}
        className="btn-secondary flex items-center gap-2 text-sm"
        title={`Copiar link: ${BASE_URL}/imoveis/${slug}`}
      >
        {copiado ? (
          <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        ) : (
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
          </svg>
        )}
        {copiado ? 'Link copiado!' : 'Compartilhar'}
      </button>

      {/* Toast */}
      {copiado && (
        <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 whitespace-nowrap bg-escuro-700 border border-escuro-500 text-white text-xs px-3 py-1.5 rounded-lg shadow-lg z-20 pointer-events-none">
          ✓ Link copiado para a área de transferência
        </div>
      )}
    </div>
  )
}
