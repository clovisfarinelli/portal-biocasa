'use client'

import { useState, useEffect } from 'react'
import { Session } from 'next-auth'
import { formatarMoeda, formatarData } from '@/lib/utils'

interface Unidade {
  id: string
  nome: string
  estado: string
  limiteAnalises: number
  analisesMes: number
  ativo: boolean
  criadoEm: string
  proprietario: { id: string; nome: string; email: string; ativo: boolean } | null
}

interface UnidadeSimples {
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
  conviteToken: string | null
  criadoEm: string
  acessoImob: boolean
  acessoIncorp: boolean
  unidade?: { nome: string; limiteAnalises: number }
  analisesMes: number
  custoMes: number
}

const TODOS_PERFIS = ['MASTER', 'PROPRIETARIO', 'ESPECIALISTA', 'ASSISTENTE', 'CORRETOR'] as const
const PERFIS_SUBORDINADOS = ['ESPECIALISTA', 'ASSISTENTE', 'CORRETOR'] as const
const LABEL_PERFIL: Record<string, string> = {
  MASTER: 'Master',
  PROPRIETARIO: 'Proprietário',
  ESPECIALISTA: 'Especialista',
  ASSISTENTE: 'Assistente',
  CORRETOR: 'Corretor',
}

const corPerfil: Record<string, string> = {
  MASTER: 'text-red-300 bg-red-900/30 border border-red-800',
  PROPRIETARIO: 'text-dourado-300 bg-dourado-400/10 border border-dourado-400/30',
  ESPECIALISTA: 'text-blue-300 bg-blue-900/30 border border-blue-800',
  ASSISTENTE: 'text-purple-300 bg-purple-900/30 border border-purple-800',
  CORRETOR: 'text-green-300 bg-green-900/30 border border-green-800',
}

const ordemPerfil: Record<string, number> = {
  MASTER: 0, PROPRIETARIO: 1, ESPECIALISTA: 2, ASSISTENTE: 3, CORRETOR: 4,
}

export default function UserManagement({ session }: { session: Session }) {
  const operador = session.user as any
  const perfil = operador.perfil as string
  const isMaster = perfil === 'MASTER'
  const isProprietario = perfil === 'PROPRIETARIO'

  const [aba, setAba] = useState<'usuarios' | 'unidades'>('usuarios')

  // ── Estado Usuários ──────────────────────────────────────────────────────
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [unidadesSelect, setUnidadesSelect] = useState<UnidadeSimples[]>([])
  const [carregandoUsuarios, setCarregandoUsuarios] = useState(true)
  const [showModalUsuario, setShowModalUsuario] = useState(false)
  const [editandoUsuario, setEditandoUsuario] = useState<Usuario | null>(null)
  const [erroUsuario, setErroUsuario] = useState('')
  const [cambioDolar, setCambioDolar] = useState('5.50')
  const [conviteEnviado, setConviteEnviado] = useState<{ email: string; url: string | null } | null>(null)

  const [formUsuario, setFormUsuario] = useState({
    nome: '', email: '', senha: '',
    perfil: 'ESPECIALISTA',
    unidadeId: operador.unidadeId ?? '',
    acessoImob: false,
    acessoIncorp: false,
  })

  // ── Filtros e ordenação (MASTER) ─────────────────────────────────────────
  const [filtroUnidade, setFiltroUnidade] = useState('')
  const [filtroPerfil, setFiltroPerfil] = useState('')
  const [mostrarDesativados, setMostrarDesativados] = useState(false)
  const [ordenacao, setOrdenacao] = useState<'perfil' | 'recente' | 'nome' | 'consumo'>('perfil')

  const convitePendente = (u: Usuario) => !u.ativo && !!u.conviteToken

  const usuariosFiltrados = usuarios
    .filter(u => mostrarDesativados ? (!u.ativo && !u.conviteToken) : (u.ativo || convitePendente(u)))
    .filter(u => !filtroUnidade || u.unidade?.nome === filtroUnidade || (filtroUnidade === '__sem__' && !u.unidade))
    .filter(u => !filtroPerfil || u.perfil === filtroPerfil)
    .sort((a, b) => {
      if (ordenacao === 'perfil') {
        const diff = (ordemPerfil[a.perfil] ?? 9) - (ordemPerfil[b.perfil] ?? 9)
        return diff !== 0 ? diff : a.nome.localeCompare(b.nome, 'pt-BR')
      }
      if (ordenacao === 'recente') return new Date(b.criadoEm).getTime() - new Date(a.criadoEm).getTime()
      if (ordenacao === 'nome') return a.nome.localeCompare(b.nome, 'pt-BR')
      if (ordenacao === 'consumo') return (b.custoMes ?? 0) - (a.custoMes ?? 0)
      return 0
    })

  // Perfis disponíveis no dropdown do modal conforme quem está logado
  const perfisDisponiveisNoModal = isMaster
    ? TODOS_PERFIS
    : PERFIS_SUBORDINADOS

  // ── Estado Unidades ──────────────────────────────────────────────────────
  const [unidades, setUnidades] = useState<Unidade[]>([])
  const [carregandoUnidades, setCarregandoUnidades] = useState(false)
  const [showModalUnidade, setShowModalUnidade] = useState(false)
  const [editandoUnidade, setEditandoUnidade] = useState<Unidade | null>(null)
  const [erroUnidade, setErroUnidade] = useState('')

  const [formUnidade, setFormUnidade] = useState({
    nome: '',
    limiteAnalises: 50,
    nomeProprietario: '',
    emailProprietario: '',
    senhaProprietario: '',
  })

  // ── Effects ──────────────────────────────────────────────────────────────
  useEffect(() => {
    carregarUsuarios()
    if (isMaster) {
      carregarCambio()
      carregarUnidadesSelect()
    }
  }, [])

  useEffect(() => {
    if (isMaster && aba === 'unidades' && unidades.length === 0) {
      carregarUnidades()
    }
  }, [aba])

  // ── Funções Usuários ─────────────────────────────────────────────────────
  async function carregarUsuarios() {
    setCarregandoUsuarios(true)
    const res = await fetch('/api/usuarios')
    if (res.ok) setUsuarios(await res.json())
    setCarregandoUsuarios(false)
  }

  async function carregarUnidadesSelect() {
    const res = await fetch('/api/unidades')
    if (res.ok) setUnidadesSelect(await res.json())
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
    setErroUsuario('')
    try {
      const url    = editandoUsuario ? `/api/usuarios/${editandoUsuario.id}` : '/api/usuarios'
      const method = editandoUsuario ? 'PATCH' : 'POST'
      const body: any = {
        nome: formUsuario.nome,
        email: formUsuario.email,
        perfil: formUsuario.perfil,
        unidadeId: formUsuario.unidadeId || undefined,
        acessoImob: formUsuario.acessoImob,
        acessoIncorp: formUsuario.acessoIncorp,
      }
      if (formUsuario.senha) body.senha = formUsuario.senha

      const res  = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()

      if (!res.ok) {
        setErroUsuario(data.erro ?? 'Erro ao salvar usuário')
        return
      }

      setShowModalUsuario(false)
      setEditandoUsuario(null)
      resetFormUsuario()
      carregarUsuarios()

      // Se convite foi enviado (novo usuário sem senha), mostrar URL de fallback
      if (!editandoUsuario && !formUsuario.senha) {
        setConviteEnviado({ email: data.email, url: data.conviteUrl })
      }
    } catch {
      setErroUsuario('Erro de conexão')
    }
  }

  async function toggleUsuario(u: Usuario) {
    const acao = u.ativo ? 'desativar' : 'reativar'
    if (!confirm(`Deseja ${acao} o usuário ${u.nome}?`)) return
    if (u.ativo) {
      await fetch(`/api/usuarios/${u.id}`, { method: 'DELETE' })
    } else {
      await fetch(`/api/usuarios/${u.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ativo: true }),
      })
    }
    carregarUsuarios()
  }

  async function reenviarConvite(u: Usuario) {
    if (!confirm(`Reenviar convite para ${u.email}?`)) return
    const res  = await fetch(`/api/usuarios/${u.id}/reenviar-convite`, { method: 'POST' })
    const data = await res.json()
    if (!res.ok) { alert(data.erro ?? 'Erro ao reenviar convite'); return }
    setConviteEnviado({ email: u.email, url: data.conviteUrl })
    carregarUsuarios()
  }

  function abrirEdicaoUsuario(u: Usuario) {
    setEditandoUsuario(u)
    setFormUsuario({
      nome: u.nome, email: u.email, senha: '', perfil: u.perfil, unidadeId: '',
      acessoImob: u.acessoImob ?? false,
      acessoIncorp: u.acessoIncorp ?? false,
    })
    setShowModalUsuario(true)
  }

  function resetFormUsuario() {
    setFormUsuario({
      nome: '', email: '', senha: '', perfil: 'ESPECIALISTA',
      unidadeId: operador.unidadeId ?? '',
      acessoImob: false,
      acessoIncorp: false,
    })
    setErroUsuario('')
  }

  // ── Funções Unidades ─────────────────────────────────────────────────────
  async function carregarUnidades() {
    setCarregandoUnidades(true)
    const res = await fetch('/api/unidades')
    if (res.ok) setUnidades(await res.json())
    setCarregandoUnidades(false)
  }

  async function salvarUnidade() {
    setErroUnidade('')
    try {
      if (editandoUnidade) {
        const res = await fetch(`/api/unidades/${editandoUnidade.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            nome: formUnidade.nome,
            limiteAnalises: formUnidade.limiteAnalises,
          }),
        })
        if (!res.ok) {
          const data = await res.json()
          setErroUnidade(data.erro ?? 'Erro ao salvar')
          return
        }
      } else {
        const res = await fetch('/api/unidades', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formUnidade),
        })
        if (!res.ok) {
          const data = await res.json()
          setErroUnidade(data.erro ?? 'Erro ao criar unidade')
          return
        }
      }
      setShowModalUnidade(false)
      setEditandoUnidade(null)
      resetFormUnidade()
      carregarUnidades()
      carregarUnidadesSelect()
    } catch {
      setErroUnidade('Erro de conexão')
    }
  }

  async function toggleUnidade(u: Unidade) {
    const acao = u.ativo ? 'desativar' : 'reativar'
    if (!confirm(`Deseja ${acao} a unidade "${u.nome}"?`)) return
    await fetch(`/api/unidades/${u.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ativo: !u.ativo }),
    })
    carregarUnidades()
  }

  function abrirEdicaoUnidade(u: Unidade) {
    setEditandoUnidade(u)
    setFormUnidade({ nome: u.nome, limiteAnalises: u.limiteAnalises, nomeProprietario: '', emailProprietario: '', senhaProprietario: '' })
    setShowModalUnidade(true)
  }

  function resetFormUnidade() {
    setFormUnidade({ nome: '', limiteAnalises: 50, nomeProprietario: '', emailProprietario: '', senhaProprietario: '' })
    setErroUnidade('')
  }

  const perfilAtualESubordinado = PERFIS_SUBORDINADOS.includes(formUsuario.perfil as any)

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Gerenciar Usuários</h1>
          <p className="text-escuro-200 text-sm mt-1">
            {isMaster ? 'Todos os usuários do sistema' : 'Usuários da sua unidade'}
          </p>
        </div>
        <button
          onClick={() => {
            if (aba === 'usuarios') { resetFormUsuario(); setEditandoUsuario(null); setShowModalUsuario(true) }
            else { resetFormUnidade(); setEditandoUnidade(null); setShowModalUnidade(true) }
          }}
          className="btn-primary flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          {aba === 'usuarios' ? 'Novo Usuário' : 'Nova Unidade'}
        </button>
      </div>

      {/* Abas (MASTER) */}
      {isMaster && (
        <div className="flex gap-1 mb-6 bg-escuro-700 p-1 rounded-xl w-fit">
          {(['usuarios', 'unidades'] as const).map(a => (
            <button
              key={a}
              onClick={() => setAba(a)}
              className={`px-5 py-2 rounded-lg text-sm font-medium transition-colors capitalize ${
                aba === a
                  ? 'bg-dourado-400 text-escuro-700'
                  : 'text-escuro-200 hover:text-white'
              }`}
            >
              {a === 'usuarios' ? 'Usuários' : 'Unidades'}
            </button>
          ))}
        </div>
      )}

      {/* Câmbio (MASTER, aba usuários) */}
      {isMaster && aba === 'usuarios' && (
        <div className="card mb-6">
          <h2 className="text-sm font-semibold text-dourado-300 uppercase tracking-wider mb-4">Configurações do Sistema</h2>
          <div className="flex items-end gap-4">
            <div>
              <label className="label">Câmbio Dólar / Real (R$)</label>
              <input
                type="number"
                value={cambioDolar}
                onChange={e => setCambioDolar(e.target.value)}
                className="input-field w-40"
                step="0.01" min="1"
              />
            </div>
            <button onClick={salvarCambio} className="btn-primary px-5 py-2.5">Salvar Câmbio</button>
          </div>
        </div>
      )}

      {/* ── Filtros (MASTER) ── */}
      {isMaster && aba === 'usuarios' && (
        <div className="flex flex-wrap gap-3 mb-4">
          <select
            value={filtroUnidade}
            onChange={e => setFiltroUnidade(e.target.value)}
            className="input-field w-auto text-sm py-2"
          >
            <option value="">Todas as unidades</option>
            {unidadesSelect.map(u => (
              <option key={u.id} value={u.nome}>{u.nome}</option>
            ))}
            <option value="__sem__">Sem unidade</option>
          </select>

          <select
            value={filtroPerfil}
            onChange={e => setFiltroPerfil(e.target.value)}
            className="input-field w-auto text-sm py-2"
          >
            <option value="">Todos os perfis</option>
            {TODOS_PERFIS.map(p => <option key={p} value={p}>{LABEL_PERFIL[p]}</option>)}
          </select>

          <select
            value={ordenacao}
            onChange={e => setOrdenacao(e.target.value as typeof ordenacao)}
            className="input-field w-auto text-sm py-2"
          >
            <option value="perfil">Ordenar: Perfil + Nome</option>
            <option value="recente">Ordenar: Mais recente</option>
            <option value="nome">Ordenar: Nome A-Z</option>
            <option value="consumo">Ordenar: Maior consumo</option>
          </select>

          <button
            onClick={() => { setMostrarDesativados(v => !v); setFiltroUnidade(''); setFiltroPerfil('') }}
            className={`text-xs px-3 py-2 rounded-lg border transition-colors ${
              mostrarDesativados
                ? 'bg-escuro-400 border-escuro-300 text-white'
                : 'border-escuro-500 text-escuro-300 hover:text-white hover:border-escuro-400'
            }`}
          >
            {mostrarDesativados ? 'Ver ativos' : 'Ver desativados'}
          </button>

          {(filtroUnidade || filtroPerfil) && (
            <button
              onClick={() => { setFiltroUnidade(''); setFiltroPerfil('') }}
              className="text-xs text-escuro-300 hover:text-white px-3 py-2 rounded-lg border border-escuro-500 hover:border-escuro-400 transition-colors"
            >
              Limpar filtros
            </button>
          )}

          <span className="text-xs text-escuro-300 self-center ml-auto">
            {usuariosFiltrados.length} {mostrarDesativados ? 'desativados' : 'ativos'}
          </span>
        </div>
      )}

      {/* ── Aba Usuários ── */}
      {aba === 'usuarios' && (
        <div className="card overflow-hidden p-0">
          {carregandoUsuarios ? (
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
                    {isMaster && <th className="px-4 py-3 text-left text-xs font-semibold text-escuro-200 uppercase tracking-wider">Unidade</th>}
                    <th className="px-4 py-3 text-left text-xs font-semibold text-escuro-200 uppercase tracking-wider">Módulos</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-escuro-200 uppercase tracking-wider">Análises/mês</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-escuro-200 uppercase tracking-wider">Custo/mês</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-escuro-200 uppercase tracking-wider">Status</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-escuro-200 uppercase tracking-wider">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-escuro-500">
                  {usuariosFiltrados.map(u => (
                    <tr key={u.id} className="hover:bg-escuro-500/30 transition-colors">
                      <td className="px-4 py-3 text-sm text-white font-medium">{u.nome}</td>
                      <td className="px-4 py-3 text-sm text-escuro-200">{u.email}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${corPerfil[u.perfil] ?? ''}`}>{LABEL_PERFIL[u.perfil] ?? u.perfil}</span>
                      </td>
                      {isMaster && (
                        <td className="px-4 py-3 text-sm text-escuro-200">
                          {u.unidade?.nome ?? '—'}
                          {u.unidade && <span className="text-xs text-escuro-300 ml-1">(lim: {u.unidade.limiteAnalises})</span>}
                        </td>
                      )}
                      <td className="px-4 py-3">
                        {['MASTER', 'PROPRIETARIO'].includes(u.perfil) ? (
                          <span className="text-xs text-escuro-300 italic">Total</span>
                        ) : (
                          <div className="flex gap-1.5">
                            {u.acessoImob && (
                              <span className="text-xs px-1.5 py-0.5 rounded bg-escuro-600 border border-escuro-400 text-escuro-100">IMOB</span>
                            )}
                            {u.acessoIncorp && (
                              <span className="text-xs px-1.5 py-0.5 rounded bg-escuro-600 border border-escuro-400 text-escuro-100">INCORP</span>
                            )}
                            {!u.acessoImob && !u.acessoIncorp && (
                              <span className="text-xs text-escuro-400 italic">Nenhum</span>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-right text-white">{u.analisesMes}</td>
                      <td className="px-4 py-3 text-sm text-right text-dourado-400 font-semibold">{formatarMoeda(u.custoMes)}</td>
                      <td className="px-4 py-3 text-center">
                        {convitePendente(u) ? (
                          <span className="text-xs px-2 py-1 rounded-full bg-yellow-900/40 text-yellow-300 border border-yellow-700/50 whitespace-nowrap">
                            Aguardando confirmação
                          </span>
                        ) : (
                          <span className={`text-xs px-2 py-1 rounded-full ${u.ativo ? 'bg-green-900/40 text-green-300' : 'bg-escuro-400 text-escuro-200'}`}>
                            {u.ativo ? 'Ativo' : 'Inativo'}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          {/* Botão Editar — não aparece para convites pendentes */}
                          {!convitePendente(u) && (
                            <button onClick={() => abrirEdicaoUsuario(u)} className="p-1.5 rounded hover:bg-escuro-400 text-escuro-200 hover:text-white transition-colors" title="Editar">
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                          )}

                          {/* Botão Reenviar convite */}
                          {convitePendente(u) && (
                            <button
                              onClick={() => reenviarConvite(u)}
                              className="p-1.5 rounded hover:bg-yellow-900/30 text-escuro-200 hover:text-yellow-400 transition-colors"
                              title="Reenviar convite"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                              </svg>
                            </button>
                          )}

                          {/* Botão Desativar/Reativar — oculto para MASTER, self e convite pendente */}
                          {!convitePendente(u) && u.perfil !== 'MASTER' && u.id !== operador.id && (
                            <button
                              onClick={() => toggleUsuario(u)}
                              className={`p-1.5 rounded transition-colors ${u.ativo ? 'hover:bg-red-900/30 text-escuro-200 hover:text-red-400' : 'hover:bg-green-900/30 text-escuro-200 hover:text-green-400'}`}
                              title={u.ativo ? 'Desativar' : 'Reativar'}
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                {u.ativo
                                  ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 115.636 5.636m12.728 12.728L5.636 5.636" />
                                  : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                }
                              </svg>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {usuariosFiltrados.length === 0 && (
                <div className="p-8 text-center text-escuro-300 text-sm">
                  {usuarios.length === 0 ? 'Nenhum usuário encontrado' : 'Nenhum usuário corresponde aos filtros'}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── Aba Unidades ── */}
      {aba === 'unidades' && isMaster && (
        <div className="card overflow-hidden p-0">
          {carregandoUnidades ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-dourado-400 mx-auto" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-escuro-500 bg-escuro-700">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-escuro-200 uppercase tracking-wider">Unidade</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-escuro-200 uppercase tracking-wider">Proprietário</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-escuro-200 uppercase tracking-wider">Limite/mês</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-escuro-200 uppercase tracking-wider">Uso este mês</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-escuro-200 uppercase tracking-wider">Status</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-escuro-200 uppercase tracking-wider">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-escuro-500">
                  {unidades.map(u => (
                    <tr key={u.id} className={`hover:bg-escuro-500/30 transition-colors ${!u.ativo ? 'opacity-50' : ''}`}>
                      <td className="px-4 py-3">
                        <p className="text-sm text-white font-medium">{u.nome}</p>
                        <p className="text-xs text-escuro-300">{formatarData(u.criadoEm)}</p>
                      </td>
                      <td className="px-4 py-3">
                        {u.proprietario ? (
                          <>
                            <p className="text-sm text-white">{u.proprietario.nome}</p>
                            <p className="text-xs text-escuro-300">{u.proprietario.email}</p>
                          </>
                        ) : (
                          <span className="text-xs text-escuro-300 italic">Sem proprietário</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-right text-white">{u.limiteAnalises}</td>
                      <td className="px-4 py-3 text-right">
                        <span className={`text-sm font-semibold ${u.analisesMes >= u.limiteAnalises ? 'text-red-400' : 'text-white'}`}>
                          {u.analisesMes}
                        </span>
                        <span className="text-xs text-escuro-300 ml-1">/ {u.limiteAnalises}</span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`text-xs px-2 py-1 rounded-full ${u.ativo ? 'bg-green-900/40 text-green-300' : 'bg-escuro-400 text-escuro-200'}`}>
                          {u.ativo ? 'Ativa' : 'Inativa'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => abrirEdicaoUnidade(u)} className="p-1.5 rounded hover:bg-escuro-400 text-escuro-200 hover:text-white transition-colors" title="Editar">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => toggleUnidade(u)}
                            className={`p-1.5 rounded transition-colors ${u.ativo ? 'hover:bg-red-900/30 text-escuro-200 hover:text-red-400' : 'hover:bg-green-900/30 text-escuro-200 hover:text-green-400'}`}
                            title={u.ativo ? 'Desativar' : 'Reativar'}
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              {u.ativo
                                ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 115.636 5.636m12.728 12.728L5.636 5.636" />
                                : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              }
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {unidades.length === 0 && <div className="p-8 text-center text-escuro-300 text-sm">Nenhuma unidade cadastrada</div>}
            </div>
          )}
        </div>
      )}

      {/* ── Modal Usuário ── */}
      {showModalUsuario && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="card w-full max-w-lg">
            <h2 className="text-lg font-semibold text-white mb-5">
              {editandoUsuario ? 'Editar Usuário' : 'Novo Usuário'}
            </h2>
            <div className="space-y-4">
              <div>
                <label className="label">Nome completo</label>
                <input type="text" value={formUsuario.nome} onChange={e => setFormUsuario(f => ({ ...f, nome: e.target.value }))} className="input-field" placeholder="Nome do usuário" />
              </div>
              <div>
                <label className="label">Email</label>
                <input type="email" value={formUsuario.email} onChange={e => setFormUsuario(f => ({ ...f, email: e.target.value }))} className="input-field" placeholder="email@exemplo.com" />
              </div>
              <div>
                <label className="label">
                  {editandoUsuario ? 'Nova Senha (deixe em branco para manter)' : 'Senha'}
                  {!editandoUsuario && (
                    <span className="ml-2 text-xs text-escuro-300 font-normal">— deixe em branco para enviar convite por email</span>
                  )}
                </label>
                <input type="password" value={formUsuario.senha} onChange={e => setFormUsuario(f => ({ ...f, senha: e.target.value }))} className="input-field" placeholder={editandoUsuario ? '••••••••' : 'Opcional — deixe em branco para convidar'} />
              </div>

              {/* Perfil — MASTER vê todos; PROPRIETARIO vê apenas subordinados */}
              {(isMaster || isProprietario) && (
                <div>
                  <label className="label">Perfil</label>
                  <select
                    value={formUsuario.perfil}
                    onChange={e => setFormUsuario(f => ({ ...f, perfil: e.target.value }))}
                    className="input-field"
                  >
                    {perfisDisponiveisNoModal.map(p => (
                      <option key={p} value={p}>{LABEL_PERFIL[p]}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Unidade — apenas MASTER */}
              {isMaster && (
                <div>
                  <label className="label">Unidade</label>
                  <select value={formUsuario.unidadeId} onChange={e => setFormUsuario(f => ({ ...f, unidadeId: e.target.value }))} className="input-field">
                    <option value="">Selecione...</option>
                    {unidadesSelect.map(u => <option key={u.id} value={u.id}>{u.nome}</option>)}
                  </select>
                </div>
              )}

              {/* Flags de acesso — apenas para perfis subordinados */}
              {perfilAtualESubordinado && (
                <div>
                  <label className="label">Módulos de acesso</label>
                  <div className="flex gap-6 mt-1">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formUsuario.acessoImob}
                        onChange={e => setFormUsuario(f => ({ ...f, acessoImob: e.target.checked }))}
                        className="w-4 h-4 rounded accent-dourado-400"
                      />
                      <span className="text-sm text-escuro-200">IMOB — Imóveis</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formUsuario.acessoIncorp}
                        onChange={e => setFormUsuario(f => ({ ...f, acessoIncorp: e.target.checked }))}
                        className="w-4 h-4 rounded accent-dourado-400"
                      />
                      <span className="text-sm text-escuro-200">INCORP — Incorporação</span>
                    </label>
                  </div>
                </div>
              )}
            </div>
            {erroUsuario && <div className="mt-4 bg-red-900/30 border border-red-700 text-red-300 rounded-lg px-4 py-2.5 text-sm">{erroUsuario}</div>}
            <div className="flex gap-3 mt-6">
              <button onClick={salvarUsuario} className="btn-primary flex-1 py-2.5">{editandoUsuario ? 'Salvar Alterações' : 'Criar Usuário'}</button>
              <button onClick={() => { setShowModalUsuario(false); setEditandoUsuario(null); resetFormUsuario() }} className="btn-secondary flex-1 py-2.5">Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal Convite Enviado ── */}
      {conviteEnviado && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="card w-full max-w-md text-center">
            <div className="w-14 h-14 rounded-full bg-green-900/30 flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-white mb-2">Convite enviado!</h2>
            <p className="text-escuro-200 text-sm mb-4">
              Um email foi enviado para <span className="text-white font-medium">{conviteEnviado.email}</span> com o link de ativação.
            </p>
            {conviteEnviado.url && (
              <div className="mb-4">
                <p className="text-xs text-escuro-300 mb-1">Link de fallback (caso o email não chegue):</p>
                <div className="bg-escuro-700 rounded-lg px-3 py-2 flex items-center gap-2">
                  <p className="text-xs text-dourado-400 break-all flex-1">{conviteEnviado.url}</p>
                  <button
                    onClick={() => navigator.clipboard.writeText(conviteEnviado.url!)}
                    className="text-escuro-300 hover:text-white shrink-0"
                    title="Copiar link"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </button>
                </div>
              </div>
            )}
            <button onClick={() => setConviteEnviado(null)} className="btn-primary px-8 py-2.5">Fechar</button>
          </div>
        </div>
      )}

      {/* ── Modal Unidade ── */}
      {showModalUnidade && isMaster && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="card w-full max-w-lg">
            <h2 className="text-lg font-semibold text-white mb-5">
              {editandoUnidade ? 'Editar Unidade' : 'Nova Unidade'}
            </h2>
            <div className="space-y-4">
              <div>
                <label className="label">Nome da unidade</label>
                <input type="text" value={formUnidade.nome} onChange={e => setFormUnidade(f => ({ ...f, nome: e.target.value }))} className="input-field" placeholder="Ex: Biocasa Santos" />
              </div>
              <div>
                <label className="label">Limite de análises por mês</label>
                <input type="number" value={formUnidade.limiteAnalises} onChange={e => setFormUnidade(f => ({ ...f, limiteAnalises: Number(e.target.value) }))} className="input-field" min={1} />
              </div>
              {!editandoUnidade && (
                <>
                  <div className="border-t border-escuro-500 pt-4">
                    <p className="text-xs font-semibold text-dourado-300 uppercase tracking-wider mb-3">Dados do Proprietário</p>
                  </div>
                  <div>
                    <label className="label">Nome do proprietário</label>
                    <input type="text" value={formUnidade.nomeProprietario} onChange={e => setFormUnidade(f => ({ ...f, nomeProprietario: e.target.value }))} className="input-field" placeholder="Nome completo" />
                  </div>
                  <div>
                    <label className="label">Email do proprietário</label>
                    <input type="email" value={formUnidade.emailProprietario} onChange={e => setFormUnidade(f => ({ ...f, emailProprietario: e.target.value }))} className="input-field" placeholder="proprietario@biocasa.com.br" />
                  </div>
                  <div>
                    <label className="label">Senha do proprietário</label>
                    <input type="password" value={formUnidade.senhaProprietario} onChange={e => setFormUnidade(f => ({ ...f, senhaProprietario: e.target.value }))} className="input-field" placeholder="Mínimo 8 caracteres" />
                  </div>
                </>
              )}
            </div>
            {erroUnidade && <div className="mt-4 bg-red-900/30 border border-red-700 text-red-300 rounded-lg px-4 py-2.5 text-sm">{erroUnidade}</div>}
            <div className="flex gap-3 mt-6">
              <button onClick={salvarUnidade} className="btn-primary flex-1 py-2.5">{editandoUnidade ? 'Salvar Alterações' : 'Criar Unidade'}</button>
              <button onClick={() => { setShowModalUnidade(false); setEditandoUnidade(null); resetFormUnidade() }} className="btn-secondary flex-1 py-2.5">Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
