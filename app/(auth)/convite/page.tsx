'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { signIn } from 'next-auth/react'
import LogoBiocasa from '@/components/LogoBiocasa'

type Etapa = 'carregando' | 'form' | 'erro' | 'enviando' | 'sucesso'

function ConviteForm() {
  const searchParams = useSearchParams()
  const router       = useRouter()
  const token        = searchParams.get('token') ?? ''

  const [etapa,    setEtapa]    = useState<Etapa>('carregando')
  const [nome,     setNome]     = useState('')
  const [email,    setEmail]    = useState('')
  const [senha,    setSenha]    = useState('')
  const [confirma, setConfirma] = useState('')
  const [erro,     setErro]     = useState('')

  useEffect(() => {
    if (!token) { setEtapa('erro'); setErro('Link de convite inválido.'); return }

    fetch(`/api/usuarios/convite?token=${token}`)
      .then(r => r.json())
      .then(data => {
        if (data.erro) { setEtapa('erro'); setErro(data.erro); return }
        setNome(data.nome)
        setEmail(data.email)
        setEtapa('form')
      })
      .catch(() => { setEtapa('erro'); setErro('Erro ao validar convite.') })
  }, [token])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErro('')

    if (senha.length < 8) { setErro('A senha deve ter pelo menos 8 caracteres.'); return }
    if (senha !== confirma) { setErro('As senhas não conferem.'); return }

    setEtapa('enviando')

    const res  = await fetch('/api/usuarios/convite/aceitar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, senha }),
    })
    const data = await res.json()

    if (!res.ok) { setEtapa('form'); setErro(data.erro ?? 'Erro ao ativar conta.'); return }

    // Auto-login após aceitar
    const result = await signIn('credentials', { email, password: senha, redirect: false })
    if (result?.ok) {
      router.replace('/usuarios')
    } else {
      setEtapa('sucesso')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-escuro-600 px-4">
      <div className="w-full max-w-md">
        <div className="card">
          <div className="flex justify-center mb-8">
            <LogoBiocasa className="h-16" />
          </div>

          {etapa === 'carregando' && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-dourado-400 mx-auto mb-3" />
              <p className="text-escuro-200 text-sm">Validando convite...</p>
            </div>
          )}

          {etapa === 'erro' && (
            <div className="text-center py-6">
              <div className="w-14 h-14 rounded-full bg-red-900/30 flex items-center justify-center mx-auto mb-4">
                <svg className="w-7 h-7 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <p className="text-red-400 font-medium mb-2">{erro}</p>
              <p className="text-escuro-300 text-sm">Entre em contato com o administrador para obter um novo convite.</p>
            </div>
          )}

          {(etapa === 'form' || etapa === 'enviando') && (
            <>
              <h1 className="text-2xl font-bold text-center text-white mb-1">Bem-vindo!</h1>
              <p className="text-center text-escuro-200 text-sm mb-6">
                Olá, <span className="text-dourado-400 font-medium">{nome}</span>. Defina sua senha para ativar sua conta.
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="label">Email</label>
                  <input type="email" value={email} readOnly className="input-field opacity-60 cursor-not-allowed" />
                </div>
                <div>
                  <label className="label">Nova Senha</label>
                  <input
                    type="password"
                    value={senha}
                    onChange={e => setSenha(e.target.value)}
                    className="input-field"
                    placeholder="Mínimo 8 caracteres"
                    required
                    autoComplete="new-password"
                  />
                </div>
                <div>
                  <label className="label">Confirmar Senha</label>
                  <input
                    type="password"
                    value={confirma}
                    onChange={e => setConfirma(e.target.value)}
                    className="input-field"
                    placeholder="Repita a senha"
                    required
                    autoComplete="new-password"
                  />
                </div>

                {erro && (
                  <div className="bg-red-900/30 border border-red-700 text-red-300 rounded-lg px-4 py-3 text-sm">
                    {erro}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={etapa === 'enviando'}
                  className="btn-primary w-full py-3 text-base"
                >
                  {etapa === 'enviando' ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="animate-spin rounded-full h-4 w-4 border-t-2 border-escuro-600" />
                      Ativando conta...
                    </span>
                  ) : 'Ativar minha conta'}
                </button>
              </form>
            </>
          )}

          {etapa === 'sucesso' && (
            <div className="text-center py-6">
              <div className="w-14 h-14 rounded-full bg-green-900/30 flex items-center justify-center mx-auto mb-4">
                <svg className="w-7 h-7 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-white mb-2">Conta ativada!</h2>
              <p className="text-escuro-200 text-sm mb-6">Sua senha foi definida. Faça login para acessar o portal.</p>
              <a href="/login" className="btn-primary inline-block px-8 py-2.5">Ir para o login</a>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function ConvitePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-escuro-600">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-dourado-400" />
      </div>
    }>
      <ConviteForm />
    </Suspense>
  )
}
