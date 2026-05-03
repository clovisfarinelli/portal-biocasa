'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import ChatwootEmbed from './ChatwootEmbed'

export default function LayoutPrincipal({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const emAtendimento = pathname === '/atendimento'

  // Monta o iframe apenas na primeira visita; depois mantém vivo com CSS
  const [jaAcessou, setJaAcessou] = useState(emAtendimento)
  useEffect(() => {
    if (emAtendimento) setJaAcessou(true)
  }, [emAtendimento])

  return (
    <main className="flex-1 overflow-hidden relative">
      {jaAcessou && (
        <div
          style={emAtendimento
            ? { position: 'absolute', inset: 0 }
            : { position: 'fixed', left: '-9999px', top: 0, width: '100vw', height: '100vh' }}
        >
          <ChatwootEmbed />
        </div>
      )}
      <div className="h-full overflow-y-auto">
        {children}
      </div>
    </main>
  )
}
