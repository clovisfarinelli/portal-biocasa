'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'

const CHATWOOT_URL = 'https://atendimento.cf8.com.br'

type Conta = { id: number; nome: string }

export default function ChatwootEmbed() {
  const { data: session } = useSession()
  const perfil = (session?.user as any)?.perfil

  const [token, setToken]                   = useState<string | null>(null)
  const [contaSelecionada, setContaSelecionada] = useState<number | null>(null)
  const [contas, setContas]                 = useState<Conta[]>([])
  const [iframeSrc, setIframeSrc]           = useState<string | null>(null)
  const [iframeKey, setIframeKey]           = useState<string>('')
  const [erro, setErro]                     = useState<string | null>(null)
  const [carregando, setCarregando]         = useState(true)

  useEffect(() => {
    if (!session) return

    async function carregar() {
      setCarregando(true)
      try {
        const res = await fetch('/api/chatwoot/token')
        if (!res.ok) {
          const data = await res.json()
          setErro(data.erro ?? 'Sem acesso ao Chatwoot')
          return
        }
        const data = await res.json()
        setToken(data.chatwootToken)
        setContaSelecionada(data.chatwootAccountId)

        // Entrada via raiz: o Chatwoot processa o token e autentica
        const url = `${CHATWOOT_URL}?user_access_token=${data.chatwootToken}`
        console.log('[ChatwootEmbed] iframeSrc:', url)
        console.log('[ChatwootEmbed] accountId:', data.chatwootAccountId)
        setIframeKey(data.chatwootToken)
        setIframeSrc(url)

        if (perfil === 'MASTER') {
          const resContas = await fetch('/api/chatwoot/contas')
          if (resContas.ok) {
            const dadosContas = await resContas.json()
            setContas(dadosContas.contas ?? [])
          }
        }
      } catch {
        setErro('Erro ao conectar com o Chatwoot')
      } finally {
        setCarregando(false)
      }
    }

    carregar()
  }, [session, perfil])

  function trocarConta(novaContaId: number) {
    setContaSelecionada(novaContaId)
    // Navega dentro do mesmo iframe (sem recarregar) — auth já está no localStorage do Chatwoot
    setIframeSrc(`${CHATWOOT_URL}/app/accounts/${novaContaId}/conversations`)
  }

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

  if (!iframeSrc || !token) return null

  return (
    <div className="flex flex-col h-full">
      {perfil === 'MASTER' && contas.length > 1 && (
        <div className="flex items-center gap-3 px-4 py-2 bg-escuro-700 border-b border-escuro-500 flex-shrink-0">
          <svg className="w-4 h-4 text-escuro-300 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
          <span className="text-xs text-escuro-300">Conta:</span>
          <select
            value={contaSelecionada ?? ''}
            onChange={e => trocarConta(Number(e.target.value))}
            className="text-xs bg-escuro-600 border border-escuro-500 text-white rounded px-2 py-1 focus:outline-none focus:border-dourado-400 cursor-pointer"
          >
            {contas.map(c => (
              <option key={c.id} value={c.id}>{c.nome}</option>
            ))}
          </select>
        </div>
      )}
      <iframe
        key={iframeKey}
        src={iframeSrc}
        className="flex-1 w-full border-0"
        allow="clipboard-read; clipboard-write; microphone"
        title="Chatwoot Atendimento"
      />
    </div>
  )
}
