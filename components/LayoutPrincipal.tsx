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
    <main className="flex-1 relative w-full h-full overflow-hidden">
      {jaAcessou && (
        <div
          style={emAtendimento
            ? { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 }
            : { position: 'fixed', top: 0, left: '-9999px', width: '100vw', height: '100vh' }}
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
