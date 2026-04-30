'use client'

import { useState } from 'react'
import { signIn, useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import LogoBiocasa from '@/components/LogoBiocasa'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState('')
  const [carregando, setCarregando] = useState(false)
  const router = useRouter()
  const { data: session, status } = useSession()

  useEffect(() => {
    if (status === 'authenticated') {
      router.replace('/')
    }
  }, [status, router])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErro('')
    setCarregando(true)

    const result = await signIn('credentials', {
      email,
      password: senha,
      redirect: false,
    })

    setCarregando(false)

    if (result?.error) {
      setErro('Email ou senha inválidos.')
    } else {
      router.replace('/')
    }
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-escuro-600">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-dourado-400" />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-escuro-600 px-4">
      <div className="w-full max-w-md">
        <div className="card">
          <div className="flex justify-center mb-8">
            <LogoBiocasa className="h-16" />
          </div>

          <h1 className="text-2xl font-bold text-center text-white mb-2">
            Bem-vindo ao Portal Biocasa
          </h1>
          <p className="text-center text-escuro-200 text-sm mb-8">
            Análise de Viabilidade Imobiliária com IA
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="label">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="input-field"
                placeholder="seu@email.com"
                required
                autoComplete="email"
              />
            </div>

            <div>
              <label className="label">Senha</label>
              <input
                type="password"
                value={senha}
                onChange={e => setSenha(e.target.value)}
                className="input-field"
                placeholder="••••••••"
                required
                autoComplete="current-password"
              />
            </div>

            {erro && (
              <div className="bg-red-900/30 border border-red-700 text-red-300 rounded-lg px-4 py-3 text-sm">
                {erro}
              </div>
            )}

            <button
              type="submit"
              disabled={carregando}
              className="btn-primary w-full py-3 text-base"
            >
              {carregando ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="animate-spin rounded-full h-4 w-4 border-t-2 border-escuro-600" />
                  Entrando...
                </span>
              ) : 'Entrar'}
            </button>
          </form>

          <p className="text-center text-escuro-300 text-xs mt-6">
            Portal exclusivo para usuários autorizados pela Biocasa
          </p>
        </div>
      </div>
    </div>
  )
}
