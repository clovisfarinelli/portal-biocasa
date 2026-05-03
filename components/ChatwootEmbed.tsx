'use client'

export default function ChatwootEmbed() {
  function abrirAtendimento() {
    window.open('/api/chatwoot/redirect', '_blank', 'noopener,noreferrer')
  }

  return (
    <div className="flex items-center justify-center h-full bg-escuro-600">
      <div className="text-center max-w-md px-6">
        <div className="w-16 h-16 rounded-full bg-dourado-400/10 flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8 text-dourado-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </div>

        <h2 className="text-white text-xl font-semibold mb-2">Atendimento</h2>
        <p className="text-escuro-300 text-sm mb-6 leading-relaxed">
          O módulo de atendimento abre em uma nova aba,<br />
          já autenticado com a sua conta.
        </p>

        <button
          onClick={abrirAtendimento}
          className="inline-flex items-center gap-2 bg-dourado-400 hover:bg-dourado-400/90 text-escuro-600 font-semibold px-6 py-3 rounded-lg transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
          Abrir Atendimento
        </button>

        <p className="text-escuro-400 text-xs mt-4">
          O Chatwoot abrirá com login automático via SSO.
        </p>
      </div>
    </div>
  )
}
