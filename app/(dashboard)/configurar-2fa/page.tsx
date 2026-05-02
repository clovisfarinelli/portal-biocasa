'use client'

import { useState, useEffect } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

export default function Configurar2FAPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const [etapa, setEtapa] = useState<'inicio' | 'qrcode' | 'confirmar' | 'concluido'>('inicio')
  const [qrcode, setQrcode] = useState('')
  const [segredo, setSegredo] = useState('')
  const [codigo, setCodigo] = useState('')
  const [codigoDesativar, setCodigoDesativar] = useState('')
  const [erro, setErro] = useState('')
  const [carregando, setCarregando] = useState(false)
  const [mostrarDesativar, setMostrarDesativar] = useState(false)

  const usuario = session?.user as any
  const totpJaAtivo = usuario?.totpAtivado === true

  useEffect(() => {
    if (status === 'authenticated' && usuario?.perfil !== 'MASTER') {
      router.replace('/')
    }
  }, [status, usuario, router])

  async function gerarQRCode() {
    setCarregando(true)
    setErro('')
    try {
      const res = await fetch('/api/2fa/configurar')
      const dados = await res.json()
      if (!res.ok) throw new Error(dados.erro)
      setQrcode(dados.qrcode)
      setSegredo(dados.segredo)
      setEtapa('qrcode')
    } catch (e: any) {
      setErro(e.message)
    } finally {
      setCarregando(false)
    }
  }

  async function ativar2FA() {
    if (codigo.length !== 6) return setErro('O código deve ter 6 dígitos.')
    setCarregando(true)
    setErro('')
    try {
      const res = await fetch('/api/2fa/configurar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ codigo }),
      })
      const dados = await res.json()
      if (!res.ok) throw new Error(dados.erro)
      setEtapa('concluido')
    } catch (e: any) {
      setErro(e.message)
    } finally {
      setCarregando(false)
    }
  }

  async function desativar2FA() {
    if (codigoDesativar.length !== 6) return setErro('O código deve ter 6 dígitos.')
    setCarregando(true)
    setErro('')
    try {
      const res = await fetch('/api/2fa/configurar', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ codigo: codigoDesativar }),
      })
      const dados = await res.json()
      if (!res.ok) throw new Error(dados.erro)
      await signOut({ callbackUrl: '/login' })
    } catch (e: any) {
      setErro(e.message)
    } finally {
      setCarregando(false)
    }
  }

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-dourado-400" />
      </div>
    )
  }

  return (
    <div className="max-w-lg mx-auto py-10 px-4">
      <h1 className="text-2xl font-bold text-white mb-2">Autenticação de Dois Fatores</h1>
      <p className="text-escuro-200 text-sm mb-8">
        O 2FA adiciona uma camada extra de segurança à sua conta MASTER.
      </p>

      {/* 2FA já ativo */}
      {totpJaAtivo && etapa !== 'concluido' && (
        <div className="card">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-2xl">🔐</span>
            <div>
              <p className="text-white font-semibold">2FA está ativo</p>
              <p className="text-escuro-200 text-sm">Sua conta está protegida com TOTP.</p>
            </div>
          </div>

          <button
            onClick={() => setMostrarDesativar(!mostrarDesativar)}
            className="text-red-400 text-sm underline"
          >
            Desativar 2FA
          </button>

          {mostrarDesativar && (
            <div className="mt-4 space-y-3">
              <p className="text-yellow-400 text-sm">
                Informe o código atual para confirmar a desativação.
              </p>
              <input
                type="text"
                maxLength={6}
                value={codigoDesativar}
                onChange={e => setCodigoDesativar(e.target.value.replace(/\D/g, ''))}
                placeholder="000000"
                className="input-field text-center text-2xl tracking-widest w-40"
              />
              {erro && <p className="text-red-400 text-sm">{erro}</p>}
              <button
                onClick={desativar2FA}
                disabled={carregando}
                className="bg-red-700 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm"
              >
                {carregando ? 'Desativando...' : 'Confirmar desativação'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Fluxo de ativação */}
      {!totpJaAtivo && etapa === 'inicio' && (
        <div className="card space-y-4">
          <p className="text-escuro-200 text-sm">
            Use o Google Authenticator, Authy ou qualquer app TOTP compatível.
          </p>
          {erro && <p className="text-red-400 text-sm">{erro}</p>}
          <button onClick={gerarQRCode} disabled={carregando} className="btn-primary w-full">
            {carregando ? 'Gerando...' : 'Gerar QR Code'}
          </button>
        </div>
      )}

      {etapa === 'qrcode' && (
        <div className="card space-y-5">
          <p className="text-white font-medium">1. Escaneie o QR code com seu aplicativo</p>
          <div className="flex justify-center bg-white rounded-xl p-3">
            <Image src={qrcode} alt="QR Code 2FA" width={200} height={200} />
          </div>
          <div>
            <p className="text-escuro-200 text-xs mb-1">Ou insira o código manualmente:</p>
            <code className="text-dourado-400 text-sm font-mono break-all">{segredo}</code>
          </div>
          <button onClick={() => setEtapa('confirmar')} className="btn-primary w-full">
            Já escaneei — confirmar código
          </button>
        </div>
      )}

      {etapa === 'confirmar' && (
        <div className="card space-y-5">
          <p className="text-white font-medium">2. Insira o código do aplicativo para confirmar</p>
          <input
            type="text"
            maxLength={6}
            value={codigo}
            onChange={e => setCodigo(e.target.value.replace(/\D/g, ''))}
            placeholder="000000"
            className="input-field text-center text-3xl tracking-widest"
            autoFocus
          />
          {erro && <p className="text-red-400 text-sm">{erro}</p>}
          <button onClick={ativar2FA} disabled={carregando || codigo.length !== 6} className="btn-primary w-full">
            {carregando ? 'Verificando...' : 'Ativar 2FA'}
          </button>
        </div>
      )}

      {etapa === 'concluido' && (
        <div className="card text-center space-y-4">
          <div className="text-5xl">✅</div>
          <p className="text-white font-bold text-lg">2FA ativado com sucesso!</p>
          <p className="text-escuro-200 text-sm">
            Na próxima vez que fizer login, você precisará inserir o código do aplicativo.
          </p>
          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="btn-primary w-full"
          >
            Fazer login novamente
          </button>
        </div>
      )}
    </div>
  )
}
