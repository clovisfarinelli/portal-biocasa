'use client'

interface Props {
  texto: string
}

export default function CopiarFichaButton({ texto }: Props) {
  async function copiar() {
    try {
      await navigator.clipboard.writeText(texto)
      alert('Ficha copiada para a área de transferência!')
    } catch {
      alert('Não foi possível copiar. Use Ctrl+C para copiar o texto manualmente.')
    }
  }

  return (
    <button onClick={copiar} className="btn-secondary flex items-center gap-2 text-sm">
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
      </svg>
      Copiar Ficha
    </button>
  )
}
