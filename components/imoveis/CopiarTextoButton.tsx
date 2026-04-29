'use client'

import { useState } from 'react'

interface Props {
  texto: string
}

export default function CopiarTextoButton({ texto }: Props) {
  const [copiado, setCopiado] = useState(false)

  async function copiar() {
    try {
      await navigator.clipboard.writeText(texto)
      setCopiado(true)
      setTimeout(() => setCopiado(false), 2000)
    } catch {
      // fallback silencioso
    }
  }

  return (
    <button
      onClick={copiar}
      className="ml-2 inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded border border-escuro-400 bg-escuro-600 hover:bg-escuro-500 text-escuro-200 hover:text-white transition-colors"
      title="Copiar link"
    >
      {copiado ? '✓ Copiado!' : '📋 Copiar'}
    </button>
  )
}
