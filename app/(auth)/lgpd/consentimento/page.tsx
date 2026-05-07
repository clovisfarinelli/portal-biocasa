'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import LogoBiocasa from '@/components/LogoBiocasa'

export default function ConsentimentoLGPD() {
  const [aceito, setAceito] = useState(false)
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState('')
  const router = useRouter()
  const { update } = useSession()

  async function handleConfirmar() {
    if (!aceito) return
    setCarregando(true)
    setErro('')

    try {
      const res = await fetch('/api/lgpd/consentimento', { method: 'POST' })
      const dados = await res.json()

      if (!res.ok) {
        setErro(dados.erro ?? 'Erro ao registrar consentimento. Tente novamente.')
        setCarregando(false)
        return
      }

      // Atualiza o token JWT com consentimentoEm para evitar loop de redirecionamento
      await update({ consentimentoEm: dados.consentimentoEm })

      router.replace('/')
    } catch {
      setErro('Erro de conexão. Tente novamente.')
      setCarregando(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-escuro-600 px-4">
      <div className="w-full max-w-lg">
        <div className="card">
          <div className="flex justify-center mb-8">
            <LogoBiocasa className="h-16" />
          </div>

          <h1 className="text-xl font-bold text-center text-white mb-4">
            Termos de Uso e Política de Privacidade
          </h1>

          <p className="text-escuro-200 text-sm text-center mb-6 leading-relaxed">
            Para continuar usando o Portal Biocasa, é necessário que você leia
            e aceite nossa Política de Privacidade e nossos Termos de Uso,
            conforme exigido pela Lei Geral de Proteção de Dados (LGPD — Lei 13.709/2018).
          </p>

          <div className="flex justify-center gap-6 mb-6">
            <a
              href="#"
              target="_blank"
              rel="noopener noreferrer"
              className="text-dourado-400 text-sm underline hover:text-dourado-300 transition-colors"
            >
              Política de Privacidade
            </a>
            <a
              href="#"
              target="_blank"
              rel="noopener noreferrer"
              className="text-dourado-400 text-sm underline hover:text-dourado-300 transition-colors"
            >
              Termos de Uso
            </a>
          </div>

          <label className="flex items-start gap-3 mb-6 cursor-pointer">
            <input
              type="checkbox"
              checked={aceito}
              onChange={e => setAceito(e.target.checked)}
              className="mt-0.5 w-4 h-4 accent-dourado-400 flex-shrink-0"
            />
            <span className="text-escuro-100 text-sm leading-relaxed">
              Li e aceito a Política de Privacidade e os Termos de Uso do Portal Biocasa.
            </span>
          </label>

          {erro && (
            <div className="bg-red-900/30 border border-red-700 text-red-300 rounded-lg px-4 py-3 text-sm mb-4">
              {erro}
            </div>
          )}

          <button
            onClick={handleConfirmar}
            disabled={!aceito || carregando}
            className="btn-primary w-full py-3 text-base disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {carregando ? (
              <span className="flex items-center justify-center gap-2">
                <span className="animate-spin rounded-full h-4 w-4 border-t-2 border-escuro-600" />
                Registrando...
              </span>
            ) : (
              'Confirmar e Continuar'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
