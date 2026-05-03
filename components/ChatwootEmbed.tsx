'use client'

import { useEffect, useRef, useState } from 'react'
import { useSession } from 'next-auth/react'
import { usePathname } from 'next/navigation'

// Token SSO expira em ~2 min no Chatwoot — renovamos a cada 90s enquanto off-screen
const REFRESH_MS = 90_000

export default function ChatwootEmbed() {
  const { data: session } = useSession()
  const userId    = (session?.user as any)?.id as string | undefined
  const pathname  = usePathname()

  const [iframeSrc, setIframeSrc]   = useState<string | null>(null)
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro]             = useState<string | null>(null)

  // Refs usados dentro do interval sem precisar recriá-lo
  const emAtendimentoRef = useRef(pathname === '/atendimento')
  const iniciadoRef      = useRef(false)

  useEffect(() => {
    emAtendimentoRef.current = pathname === '/atendimento'
  }, [pathname])

  // ── Carga inicial ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!userId) return
    let cancelado = false

    async function buscarToken() {
      setCarregando(true)
      setErro(null)
      try {
        const res  = await fetch('/api/chatwoot/sso')
        const data = await res.json()
        if (cancelado) return
        if (!res.ok) { setErro(data.erro ?? 'Sem acesso ao Chatwoot'); return }
        setIframeSrc(data.url)
        iniciadoRef.current = true
      } catch {
        if (!cancelado) setErro('Erro ao conectar com o Chatwoot')
      } finally {
        if (!cancelado) setCarregando(false)
      }
    }

    buscarToken()
    return () => { cancelado = true }
  }, [userId])

  // ── Refresh a cada 90s (só quando iframe está fora da tela) ───────────────
  useEffect(() => {
    const timer = setInterval(async () => {
      if (!iniciadoRef.current)      return  // ainda não carregou
      if (emAtendimentoRef.current)  return  // usuário está vendo — não recarregar

      try {
        const res  = await fetch('/api/chatwoot/sso')
        const data = await res.json()
        if (res.ok && data.url) setIframeSrc(data.url)
      } catch { /* falha silenciosa — próximo ciclo tentará novamente */ }
    }, REFRESH_MS)

    return () => clearInterval(timer)
  }, []) // roda uma vez; usa refs para valores atuais

  // ── Render ─────────────────────────────────────────────────────────────────
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

  if (!iframeSrc) return null

  return (
    <div className="flex flex-col h-full">
      <iframe
        src={iframeSrc}
        className="w-full h-full border-0"
        allow="clipboard-read; clipboard-write; microphone"
        title="Chatwoot Atendimento"
      />
    </div>
  )
}
