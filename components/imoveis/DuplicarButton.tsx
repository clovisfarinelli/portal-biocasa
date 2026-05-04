'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  imovelId: string
  codigoRef: string
}

export default function DuplicarButton({ imovelId, codigoRef }: Props) {
  const router = useRouter()
  const [duplicando, setDuplicando] = useState(false)

  async function duplicar() {
    if (!confirm(`Duplicar o imóvel ${codigoRef}? Uma cópia será criada sem fotos.`)) return
    setDuplicando(true)
    try {
      const res = await fetch(`/api/imoveis/${imovelId}/duplicar`, { method: 'POST' })
      if (res.ok) {
        const data = await res.json()
        router.push(`/imoveis/${data.id}`)
      } else {
        const data = await res.json()
        alert(data.erro ?? 'Erro ao duplicar imóvel')
      }
    } finally {
      setDuplicando(false)
    }
  }

  return (
    <button
      onClick={duplicar}
      disabled={duplicando}
      className="btn-secondary flex items-center gap-2 text-sm disabled:opacity-50"
      title="Duplicar imóvel"
    >
      {duplicando ? (
        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      ) : (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5a3.375 3.375 0 00-3.375-3.375H9.75" />
        </svg>
      )}
      {duplicando ? 'Duplicando...' : 'Duplicar'}
    </button>
  )
}
