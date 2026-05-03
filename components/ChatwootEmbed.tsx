'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'

export default function ChatwootEmbed() {
  const { data: session } = useSession()
  const [ssoUrl, setSsoUrl]       = useState<string | null>(null)
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro]           = useState<string | null>(null)

  useEffect(() => {
    if (!session) return

    async function carregar() {
      setCarregando(true)
      try {
        const res = await fetch('/api/chatwoot/sso')
        const data = await res.json()
        if (!res.ok) {
          setErro(data.erro ?? 'Sem acesso ao Chatwoot')
          return
        }
        setSsoUrl(data.url)
      } catch {
        setErro('Erro ao conectar com o Chatwoot')
      } finally {
        setCarregando(false)
      }
    }

    carregar()
  }, [session])

  if (carregando) {
    return (
      <div className="flex items-center justify-center h-full bg-escuro-600">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-dourado-400 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-escuro-300 text-sm">Conectando ao Chatwoot...</p>
        </div>
      </div>
    )
  }

  if (erro) {
    return (
      <div className="flex items-center justify-center h-full bg-escuro-600">
        <div className="text-center max-w-sm">
          <div className="w-12 h-12 rounded-full bg-red-900/30 flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <p className="text-red-400 font-medium mb-1">{erro}</p>
          <p className="text-escuro-300 text-sm">Contate o administrador para configurar o acesso ao Chatwoot.</p>
        </div>
      </div>
    )
  }

  if (!ssoUrl) return null

  return (
    <div className="flex flex-col h-full">
      <iframe
        src={ssoUrl}
        className="w-full h-full border-0"
        allow="clipboard-read; clipboard-write; microphone"
        title="Chatwoot Atendimento"
      />
    </div>
  )
}
