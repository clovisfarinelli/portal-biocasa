'use client'

import { useState, useEffect } from 'react'
import { Session } from 'next-auth'
import { formatarMoeda, formatarData } from '@/lib/utils'

interface Unidade {
  id: string
  nome: string
  estado: string
  limiteAnalises: number
}

interface Usuario {
  id: string
  nome: string
  email: string
  perfil: string
  ativo: boolean
  criadoEm: string
  unidade?: { nome: string; limiteAnalises: number }
  analisesMes: number
  custoMes: number
}

interface Props {
  session: Session
}

const PERFIS = ['MASTER', 'PROPRIETARIO', 'ESPECIALISTA'] as const

export default function UserManagement({ session }: Props) {
  const operador = session.user as any
  const perfil = operador.perfil as string

  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [unidades, setUnidades] = useState<Unidade[]>([])
  const [carregando, setCarregando] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editando, setEditando] = useState<Usuario | null>(null)
  const [erro, setErro] = useState('')
  const [cambioDolar, setCambioDolar] = useState('5.50')

  // Formulário
  const [form, setForm] = useState({
    nome: '', email: '', senha: '',
    perfil: perfil === 'PROPRIETARIO' ? 'ESPECIALISTA' : 'ESPECIALISTA',
    unidadeId: operador.unidadeId ?? '',
    limiteAnalises: 50,
  })

  useEffect(() => {
    carregarDados()
    if (perfil === 'MASTER') {
      carregarCambio()
      carregarUnidades()
    }
  }, [])

  async function carregarDados() {
    setCarregando(true)
    const res = await fetch('/api/usuarios')
    if (res.ok) setUsuarios(await res.json())
    setCarregando(false)
  }

  async function carregarUnidades() {
    const res = await fetch('/api/unidades')
    if (res.ok) setUnidades(await res.json())
  }

  async function carregarCambio() {
    const res = await fetch('/api/configuracoes')
    if (res.ok) {
      const data = await res.json()
      setCambioDolar(data.cambio_dolar_real ?? '5.50')
    }
  }

  async function salvarCambio() {
    await fetch('/api/configuracoes', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cambio_dolar_real: cambioDolar }),
    })
    alert('Câmbio atualizado com sucesso!')
  }

  async function salvarUsuario() {
    setErro('')
    try {
      const url = editando ? `/api/usuarios/${editando.id}` : '/api/usuarios'
      const method = editando ? 'PATCH' : 'POST'
      const body: any = {
        nome: form.nome,
        email: form.email,
        perfil: form.perfil,
        unidadeId: form.unidadeId || undefined,
      }
      if (form.senha) body.senha = form.senha

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const data = await res.json()
        setErro(data.erro ?? 'Erro ao salvar usuário')
        return
      }

      setShowModal(false)
      setEditando(null)
      resetForm()
      carregarDados()
    } catch {
      setErro('Erro de conexão')
    }
  }

  async function excluirUsuario(id: string) {
    if (!confirm('Deseja desativar este usuário?')) return
    await fetch(`/api/usuarios/${id}`, { method: 'DELETE' })
    carregarDados()
  }

  function abrirEdicao(u: Usuario) {
    setEditando(u)
    setForm({
      nome: u.nome,
      email: u.email,
      senha: '',
      perfil: u.perfil,
      unidadeId: '',
      limiteAnalises: 50,
    })
    setShowModal(true)
  }

  function resetForm() {
    setForm({
      nome: '', email: '', senha: '',
      perfil: perfil === 'PROPRIETARIO' ? 'ESPECIALISTA' : 'ESPECIALISTA',
      unidadeId: operador.unidadeId ?? '',
      limiteAnalises: 50,
    })
    setErro('')
  }

  const corPerfil: Record<string, string> = {
    MASTER: 'text-red-300 bg-red-900/30 border border-red-800',
    PROPRIETARIO: 'text-dourado-300 bg-dourado-400/10 border border-dourado-400/30',
    ESPECIALISTA: 'text-blue-300 bg-blue-900/30 border border-blue-800',
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Gerenciar Usuários</h1>
          <p className="text-escuro-200 text-sm mt-1">
            {perfil === 'MASTER' ? 'Todos os usuários do sistema' : 'Usuários da sua unidade'}
          </p>
        </div>
        <button
          onClick={() => { resetForm(); setEditando(null); setShowModal(true) }}
          className="btn-primary flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Novo Usuário
        </button>
      </div>

      {/* Configurações MASTER */}
      {perfil === 'MASTER' && (
        <div className="card mb-6">
          <h2 className="text-sm font-semibold text-dourado-300 uppercase tracking-wider mb-4">
            Configurações do Sistema
          </h2>
          <div className="flex items-end gap-4">
            <div>
              <label className="label">Câmbio Dólar / Real (R$)</label>
              <input
                type="number"
                value={cambioDolar}
                onChange={e => setCambioDolar(e.target.value)}
                className="input-field w-40"
                step="0.01"
                min="1"
                placeholder="5.50"
              />
            </div>
            <button onClick={salvarCambio} className="btn-primary px-5 py-2.5">
              Salvar Câmbio
            </button>
          </div>
        </div>
      )}

      {/* Tabela de usuários */}
      <div className="card overflow-hidden p-0">
        {carregando ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-dourado-400 mx-auto" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-escuro-500 bg-escuro-700">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-escuro-200 uppercase tracking-wider">Nome</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-escuro-200 uppercase tracking-wider">Email</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-escuro-200 uppercase tracking-wider">Perfil</th>
                  {perfil === 'MASTER' && (
                    <th className="px-4 py-3 text-left text-xs font-semibold text-escuro-200 uppercase tracking-wider">Unidade</th>
                  )}
                  <th className="px-4 py-3 text-right text-xs font-semibold text-escuro-200 uppercase tracking-wider">Análises/mês</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-escuro-200 uppercase tracking-wider">Custo/mês</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-escuro-200 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-escuro-200 uppercase tracking-wider">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-escuro-500">
                {usuarios.map(u => (
                  <tr key={u.id} className="hover:bg-escuro-500/30 transition-colors">
                    <td className="px-4 py-3 text-sm text-white font-medium">{u.nome}</td>
                    <td className="px-4 py-3 text-sm text-escuro-200">{u.email}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${corPerfil[u.perfil] ?? ''}`}>
                        {u.perfil}
                      </span>
                    </td>
                    {perfil === 'MASTER' && (
                      <td className="px-4 py-3 text-sm text-escuro-200">
                        {u.unidade?.nome ?? '—'}
                        {u.unidade && (
                          <span className="text-xs text-escuro-300 ml-1">(lim: {u.unidade.limiteAnalises})</span>
                        )}
                      </td>
                    )}
                    <td className="px-4 py-3 text-sm text-right text-white">{u.analisesMes}</td>
                    <td className="px-4 py-3 text-sm text-right text-dourado-400 font-semibold">
                      {formatarMoeda(u.custoMes)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`text-xs px-2 py-1 rounded-full ${u.ativo ? 'bg-green-900/40 text-green-300' : 'bg-escuro-400 text-escuro-200'}`}>
                        {u.ativo ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => abrirEdicao(u)}
                          className="p-1.5 rounded hover:bg-escuro-400 text-escuro-200 hover:text-white transition-colors"
                          title="Editar"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => excluirUsuario(u.id)}
                          className="p-1.5 rounded hover:bg-red-900/30 text-escuro-200 hover:text-red-400 transition-colors"
                          title="Desativar"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {usuarios.length === 0 && (
              <div className="p-8 text-center text-escuro-300 text-sm">Nenhum usuário encontrado</div>
            )}
          </div>
        )}
      </div>

      {/* Modal Novo/Editar Usuário */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="card w-full max-w-lg">
            <h2 className="text-lg font-semibold text-white mb-5">
              {editando ? 'Editar Usuário' : 'Novo Usuário'}
            </h2>

            <div className="space-y-4">
              <div>
                <label className="label">Nome completo</label>
                <input
                  type="text"
                  value={form.nome}
                  onChange={e => setForm(f => ({ ...f, nome: e.target.value }))}
                  className="input-field"
                  placeholder="Nome do usuário"
                />
              </div>

              <div>
                <label className="label">Email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  className="input-field"
                  placeholder="email@exemplo.com"
                />
              </div>

              <div>
                <label className="label">{editando ? 'Nova Senha (deixe em branco para manter)' : 'Senha'}</label>
                <input
                  type="password"
                  value={form.senha}
                  onChange={e => setForm(f => ({ ...f, senha: e.target.value }))}
                  className="input-field"
                  placeholder={editando ? '••••••••' : 'Mínimo 8 caracteres'}
                />
              </div>

              {perfil === 'MASTER' && (
                <>
                  <div>
                    <label className="label">Perfil</label>
                    <select
                      value={form.perfil}
                      onChange={e => setForm(f => ({ ...f, perfil: e.target.value }))}
                      className="input-field"
                    >
                      {PERFIS.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="label">Unidade</label>
                    <select
                      value={form.unidadeId}
                      onChange={e => setForm(f => ({ ...f, unidadeId: e.target.value }))}
                      className="input-field"
                    >
                      <option value="">Selecione...</option>
                      {unidades.map(u => (
                        <option key={u.id} value={u.id}>{u.nome} - {u.estado}</option>
                      ))}
                    </select>
                  </div>
                </>
              )}
            </div>

            {erro && (
              <div className="mt-4 bg-red-900/30 border border-red-700 text-red-300 rounded-lg px-4 py-2.5 text-sm">
                {erro}
              </div>
            )}

            <div className="flex gap-3 mt-6">
              <button onClick={salvarUsuario} className="btn-primary flex-1 py-2.5">
                {editando ? 'Salvar Alterações' : 'Criar Usuário'}
              </button>
              <button
                onClick={() => { setShowModal(false); setEditando(null); resetForm() }}
                className="btn-secondary flex-1 py-2.5"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
