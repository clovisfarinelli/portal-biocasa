'use client'

import { useState, useEffect } from 'react'
import { Session } from 'next-auth'
import { useDropzone } from 'react-dropzone'
import { formatarData } from '@/lib/utils'

interface Cidade {
  id: string
  nome: string
  estado: string
}

interface Documento {
  id: string
  titulo: string
  tipo: string
  categoria: string
  ativo: boolean
  criadoEm: string
  arquivoUrl?: string
  cidade?: { nome: string }
}

interface Aprendizado {
  id: string
  resumo: string
  ativo: boolean
  criadoEm: string
  cidade?: { nome: string }
  analise: { inscricaoImobiliaria?: string; motivoInvalidacao?: string }
}

interface LogErro {
  id: string
  mensagem: string
  detalhes?: string
  criadoEm: string
  usuario?: { nome: string; email: string }
}

type Aba = 'global' | 'cidade' | 'aprendizados' | 'logs'

const TIPOS_DOCUMENTO = [
  { valor: 'PLANO_DIRETOR', label: 'Plano Diretor' },
  { valor: 'ZONEAMENTO', label: 'Zoneamento' },
  { valor: 'CUSTOS', label: 'Custos' },
  { valor: 'MERCADO', label: 'Mercado' },
  { valor: 'DIRETRIZES_BIOCASA', label: 'Diretrizes Biocasa' },
  { valor: 'OUTRO', label: 'Outro' },
]

export default function TreinarIA({ session }: { session: Session }) {
  const [aba, setAba] = useState<Aba>('global')
  const [cidades, setCidades] = useState<Cidade[]>([])
  const [cidadeSelecionada, setCidadeSelecionada] = useState('')
  const [documentos, setDocumentos] = useState<Documento[]>([])
  const [aprendizados, setAprendizados] = useState<Aprendizado[]>([])
  const [logs, setLogs] = useState<LogErro[]>([])
  const [carregando, setCarregando] = useState(false)

  // Formulário novo documento
  const [showForm, setShowForm] = useState(false)
  const [formDoc, setFormDoc] = useState({
    titulo: '',
    tipo: 'PLANO_DIRETOR',
    conteudoTexto: '',
  })
  const [arquivoDoc, setArquivoDoc] = useState<File | null>(null)

  useEffect(() => {
    carregarCidades()
    carregarDocumentos()
  }, [aba, cidadeSelecionada])

  async function carregarCidades() {
    const res = await fetch('/api/cidades')
    if (res.ok) setCidades(await res.json())
  }

  async function carregarDocumentos() {
    setCarregando(true)
    if (aba === 'global') {
      const res = await fetch('/api/documentos?categoria=GLOBAL')
      if (res.ok) setDocumentos(await res.json())
    } else if (aba === 'cidade' && cidadeSelecionada) {
      const res = await fetch(`/api/documentos?cidadeId=${cidadeSelecionada}&categoria=CIDADE`)
      if (res.ok) setDocumentos(await res.json())
    } else if (aba === 'aprendizados') {
      const res = await fetch('/api/analises?status=INVALIDA')
      if (res.ok) {
        const data = await res.json()
        setAprendizados(data.aprendizados ?? [])
      }
    } else if (aba === 'logs') {
      const res = await fetch('/api/logs-erro')
      if (res.ok) {
        const data = await res.json()
        setLogs(data.logs ?? [])
      }
    }
    setCarregando(false)
  }

  async function salvarDocumento() {
    const formData = new FormData()
    formData.append('titulo', formDoc.titulo)
    formData.append('tipo', formDoc.tipo)
    formData.append('categoria', aba === 'global' ? 'GLOBAL' : 'CIDADE')
    if (cidadeSelecionada && aba === 'cidade') {
      formData.append('cidadeId', cidadeSelecionada)
    }
    if (formDoc.conteudoTexto) formData.append('conteudoTexto', formDoc.conteudoTexto)
    if (arquivoDoc) formData.append('arquivo', arquivoDoc)

    const res = await fetch('/api/documentos', { method: 'POST', body: formData })
    if (res.ok) {
      setShowForm(false)
      setFormDoc({ titulo: '', tipo: 'PLANO_DIRETOR', conteudoTexto: '' })
      setArquivoDoc(null)
      carregarDocumentos()
    }
  }

  async function toggleDocumento(id: string, ativo: boolean) {
    await fetch(`/api/documentos/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ativo: !ativo }),
    })
    carregarDocumentos()
  }

  async function excluirDocumento(id: string) {
    if (!confirm('Excluir este documento?')) return
    await fetch(`/api/documentos/${id}`, { method: 'DELETE' })
    carregarDocumentos()
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: files => setArquivoDoc(files[0] ?? null),
    maxFiles: 1,
  })

  const abas: { id: Aba; label: string; icone: string }[] = [
    { id: 'global', label: 'Global Biocasa', icone: '🌐' },
    { id: 'cidade', label: 'Por Cidade', icone: '🏙️' },
    { id: 'aprendizados', label: 'Aprendizados', icone: '🧠' },
    { id: 'logs', label: 'Logs de Erro', icone: '🔴' },
  ]

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Treinar IA</h1>
        <p className="text-escuro-200 text-sm mt-1">
          Gerencie documentos de referência e aprendizados do sistema
        </p>
      </div>

      {/* Abas */}
      <div className="flex gap-1 bg-escuro-700 rounded-xl p-1 mb-6 w-fit">
        {abas.map(a => (
          <button
            key={a.id}
            onClick={() => setAba(a.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              aba === a.id
                ? 'bg-dourado-400 text-escuro-600'
                : 'text-escuro-200 hover:text-white'
            }`}
          >
            {a.icone} {a.label}
          </button>
        ))}
      </div>

      {/* Seletor de cidade */}
      {aba === 'cidade' && (
        <div className="mb-5">
          <label className="label">Selecione a cidade</label>
          <select
            value={cidadeSelecionada}
            onChange={e => setCidadeSelecionada(e.target.value)}
            className="input-field max-w-xs"
          >
            <option value="">Selecione...</option>
            {cidades.map(c => (
              <option key={c.id} value={c.id}>{c.nome} - {c.estado}</option>
            ))}
          </select>
        </div>
      )}

      {/* Documentos (Global e Cidade) */}
      {(aba === 'global' || aba === 'cidade') && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-white">
              Documentos {aba === 'global' ? 'Globais' : 'da Cidade'}
            </h2>
            <button
              onClick={() => setShowForm(true)}
              disabled={aba === 'cidade' && !cidadeSelecionada}
              className="btn-primary flex items-center gap-2 text-sm disabled:opacity-50"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Adicionar Documento
            </button>
          </div>

          {carregando ? (
            <div className="card p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-dourado-400 mx-auto" />
            </div>
          ) : documentos.length === 0 ? (
            <div className="card p-8 text-center text-escuro-300 text-sm">
              Nenhum documento cadastrado
            </div>
          ) : (
            <div className="space-y-3">
              {documentos.map(doc => (
                <div key={doc.id} className="card flex items-center gap-4 py-4 px-5">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <span className="text-white font-medium text-sm">{doc.titulo}</span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-escuro-400 text-escuro-100">
                        {TIPOS_DOCUMENTO.find(t => t.valor === doc.tipo)?.label ?? doc.tipo}
                      </span>
                      {doc.cidade && (
                        <span className="text-xs text-escuro-300">{doc.cidade.nome}</span>
                      )}
                    </div>
                    <p className="text-xs text-escuro-300">{formatarData(doc.criadoEm)}</p>
                  </div>

                  {doc.arquivoUrl && (
                    <a
                      href={doc.arquivoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-dourado-400 hover:text-dourado-300 underline"
                    >
                      Ver arquivo
                    </a>
                  )}

                  <label className="flex items-center gap-2 cursor-pointer">
                    <div
                      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${doc.ativo ? 'bg-green-600' : 'bg-escuro-400'}`}
                      onClick={() => toggleDocumento(doc.id, doc.ativo)}
                    >
                      <span
                        className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${doc.ativo ? 'translate-x-5' : 'translate-x-1'}`}
                      />
                    </div>
                    <span className="text-xs text-escuro-200">{doc.ativo ? 'Ativo' : 'Inativo'}</span>
                  </label>

                  <button
                    onClick={() => excluirDocumento(doc.id)}
                    className="p-1.5 rounded hover:bg-red-900/30 text-escuro-300 hover:text-red-400 transition-colors"
                    title="Excluir"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Aprendizados */}
      {aba === 'aprendizados' && (
        <div>
          <h2 className="text-lg font-semibold text-white mb-4">Análises Inválidas para Revisão</h2>
          {aprendizados.length === 0 ? (
            <div className="card p-8 text-center text-escuro-300 text-sm">
              Nenhuma análise inválida pendente de revisão
            </div>
          ) : (
            <div className="space-y-3">
              {aprendizados.map(ap => (
                <div key={ap.id} className="card">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm text-white font-medium mb-1">
                        {ap.analise?.inscricaoImobiliaria ?? 'Análise sem inscrição'}
                        {ap.cidade && <span className="text-escuro-300 ml-2">— {ap.cidade.nome}</span>}
                      </p>
                      {ap.analise?.motivoInvalidacao && (
                        <p className="text-xs text-red-300 mb-2">Motivo: {ap.analise.motivoInvalidacao}</p>
                      )}
                      <p className="text-xs text-escuro-300">{formatarData(ap.criadoEm)}</p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full flex-shrink-0 ${ap.ativo ? 'bg-green-900/30 text-green-300' : 'bg-red-900/30 text-red-300'}`}>
                      {ap.ativo ? 'Ativo' : 'Inativo'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Logs de Erro */}
      {aba === 'logs' && (
        <div>
          <h2 className="text-lg font-semibold text-white mb-4">Logs de Erro da API</h2>
          {logs.length === 0 ? (
            <div className="card p-8 text-center text-escuro-300 text-sm">
              Nenhum erro registrado
            </div>
          ) : (
            <div className="space-y-3">
              {logs.map(log => (
                <div key={log.id} className="card border-l-4 border-red-600">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-sm font-medium text-white">{log.mensagem}</span>
                    <span className="text-xs text-escuro-300 flex-shrink-0 ml-4">{formatarData(log.criadoEm)}</span>
                  </div>
                  {log.usuario && (
                    <p className="text-xs text-escuro-300 mb-1">
                      Usuário: {log.usuario.nome} ({log.usuario.email})
                    </p>
                  )}
                  {log.detalhes && (
                    <pre className="text-xs text-red-300 bg-escuro-700 rounded p-2 overflow-x-auto mt-2 whitespace-pre-wrap">
                      {log.detalhes}
                    </pre>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modal Novo Documento */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="card w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-semibold text-white mb-5">Adicionar Documento</h2>

            <div className="space-y-4">
              <div>
                <label className="label">Título</label>
                <input
                  type="text"
                  value={formDoc.titulo}
                  onChange={e => setFormDoc(f => ({ ...f, titulo: e.target.value }))}
                  className="input-field"
                  placeholder="Ex: Plano Diretor São Paulo 2023"
                />
              </div>

              <div>
                <label className="label">Tipo</label>
                <select
                  value={formDoc.tipo}
                  onChange={e => setFormDoc(f => ({ ...f, tipo: e.target.value }))}
                  className="input-field"
                >
                  {TIPOS_DOCUMENTO.map(t => (
                    <option key={t.valor} value={t.valor}>{t.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label">Arquivo (opcional)</label>
                <div
                  {...getRootProps()}
                  className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${isDragActive ? 'border-dourado-400 bg-dourado-400/10' : 'border-escuro-400 hover:border-dourado-400/50'}`}
                >
                  <input {...getInputProps()} />
                  {arquivoDoc ? (
                    <p className="text-sm text-white">{arquivoDoc.name}</p>
                  ) : (
                    <p className="text-sm text-escuro-300">
                      {isDragActive ? 'Solte o arquivo aqui' : 'Arraste ou clique para selecionar'}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label className="label">Conteúdo em texto (opcional)</label>
                <textarea
                  value={formDoc.conteudoTexto}
                  onChange={e => setFormDoc(f => ({ ...f, conteudoTexto: e.target.value }))}
                  className="input-field min-h-[120px] resize-none"
                  placeholder="Cole o texto do documento aqui..."
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={salvarDocumento} className="btn-primary flex-1 py-2.5">
                Salvar Documento
              </button>
              <button
                onClick={() => { setShowForm(false); setArquivoDoc(null) }}
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
