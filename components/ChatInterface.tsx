'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { Session } from 'next-auth'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import UploadArquivos from './UploadArquivos'
import ExportarPDF from './ExportarPDF'
import { formatarMoeda } from '@/lib/utils'

interface Mensagem {
  role: 'user' | 'model'
  content: string
}

interface Analise {
  id: string
  cidadeId?: string
  inscricaoImobiliaria?: string
  margemAlvo?: number
  conteudoConversa: Mensagem[]
  cidade?: { nome: string }
  custoBrl: number
  tokensInput: number
  tokensOutput: number
  statusValidacao: string
}

interface Cidade {
  id: string
  nome: string
  estado: string
}

export default function ChatInterface({ session }: { session: Session }) {
  const searchParams = useSearchParams()
  const analiseIdParam = searchParams.get('analise')
  const usuario = session.user as any
  const perfil = usuario.perfil as string

  // Campos do formulário
  const [cidadeId, setCidadeId] = useState('')
  const [cidadeNova, setCidadeNova] = useState('')
  const [showNovaCidade, setShowNovaCidade] = useState(false)
  const [inscricaoImobiliaria, setInscricaoImobiliaria] = useState('')
  const [margemAlvo, setMargemAlvo] = useState(20)
  const [analiseProfunda, setAnaliseProfunda] = useState(false)
  const [camposPreenchidos, setCamposPreenchidos] = useState(perfil !== 'ESPECIALISTA')

  // Estado da análise
  const [analiseId, setAnaliseId] = useState<string | null>(analiseIdParam)
  const [mensagens, setMensagens] = useState<Mensagem[]>([])
  const [mensagem, setMensagem] = useState('')
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState('')

  // Upload
  const [arquivos, setArquivos] = useState<File[]>([])
  const [arquivosUpload, setArquivosUpload] = useState<{ url: string; nome: string; tipo: string }[]>([])

  // Validação
  const [mostrarValidacao, setMostrarValidacao] = useState(false)
  const [motivoInvalidacao, setMotivoInvalidacao] = useState('')
  const [validacaoEnviada, setValidacaoEnviada] = useState(false)

  // Custo acumulado
  const [custoTotal, setCustoTotal] = useState(0)

  // Cidades
  const [cidades, setCidades] = useState<Cidade[]>([])

  const chatRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    carregarCidades()
    if (analiseIdParam) carregarAnalise(analiseIdParam)
  }, [analiseIdParam])

  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight
    }
  }, [mensagens, carregando])

  async function carregarCidades() {
    const res = await fetch('/api/cidades')
    if (res.ok) setCidades(await res.json())
  }

  async function carregarAnalise(id: string) {
    const res = await fetch(`/api/analises/${id}`)
    if (res.ok) {
      const data: Analise = await res.json()
      setAnaliseId(data.id)
      setMensagens(data.conteudoConversa as Mensagem[])
      setCidadeId(data.cidadeId ?? '')
      setInscricaoImobiliaria(data.inscricaoImobiliaria ?? '')
      setMargemAlvo(data.margemAlvo ?? 20)
      setCustoTotal(data.custoBrl ?? 0)
      setCamposPreenchidos(true)
      if (data.statusValidacao !== 'PENDENTE') setValidacaoEnviada(true)
    }
  }

  async function criarCidade() {
    if (!cidadeNova.trim()) return
    const partes = cidadeNova.trim().split('-')
    const nome = partes[0].trim()
    const estado = partes[1]?.trim().toUpperCase() ?? 'SP'

    const res = await fetch('/api/cidades', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nome, estado }),
    })
    if (res.ok) {
      const nova: Cidade = await res.json()
      setCidades(prev => [...prev, nova])
      setCidadeId(nova.id)
      setShowNovaCidade(false)
      setCidadeNova('')
    }
  }

  function validarCampos(): boolean {
    if (perfil !== 'ESPECIALISTA') return true
    if (!cidadeId && !cidadeNova) return false
    if (!inscricaoImobiliaria.trim()) return false
    if (arquivos.length === 0 && arquivosUpload.length === 0) return false
    return true
  }

  async function iniciarChat() {
    if (!validarCampos()) {
      setErro('Preencha todos os campos obrigatórios antes de iniciar a análise.')
      return
    }
    if (showNovaCidade && cidadeNova) await criarCidade()
    setErro('')
    setCamposPreenchidos(true)
  }

  async function enviarMensagem() {
    if (!mensagem.trim() || carregando) return
    if (!camposPreenchidos) {
      await iniciarChat()
      return
    }

    const novaMensagem = mensagem.trim()
    setMensagem('')
    setErro('')
    setCarregando(true)

    const novasMensagens: Mensagem[] = [...mensagens, { role: 'user', content: novaMensagem }]
    setMensagens(novasMensagens)

    try {
      const res = await fetch('/api/analises', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mensagem: novaMensagem,
          cidadeId: cidadeId || undefined,
          inscricaoImobiliaria: inscricaoImobiliaria || undefined,
          margemAlvo,
          analiseProfunda,
          analiseId,
          historico: mensagens,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setErro(data.erro ?? 'Erro ao processar análise')
        setMensagens(mensagens)
        return
      }

      setAnaliseId(data.analiseId)
      setCustoTotal(prev => prev + data.custoBrl)
      setMensagens([...novasMensagens, { role: 'model', content: data.resposta }])

      // Mostra validação após primeira resposta da IA
      if (mensagens.length === 0) {
        setTimeout(() => setMostrarValidacao(true), 1000)
      }
    } catch {
      setErro('Erro de conexão. Tente novamente.')
      setMensagens(mensagens)
    } finally {
      setCarregando(false)
    }
  }

  async function validarAnalise(valida: boolean) {
    if (!analiseId) return

    const res = await fetch(`/api/analises/${analiseId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        statusValidacao: valida ? 'VALIDA' : 'INVALIDA',
        motivoInvalidacao: valida ? undefined : motivoInvalidacao,
      }),
    })

    if (res.ok) {
      setValidacaoEnviada(true)
      setMostrarValidacao(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (camposPreenchidos) enviarMensagem()
    }
  }

  const mostrarFormulario = !camposPreenchidos
  const temMensagens = mensagens.length > 0

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-escuro-500 bg-escuro-700">
        <div>
          <h1 className="text-lg font-semibold text-white">Análise de Viabilidade</h1>
          {cidadeId && (
            <p className="text-xs text-escuro-300">
              {cidades.find(c => c.id === cidadeId)?.nome}{inscricaoImobiliaria ? ` • ${inscricaoImobiliaria}` : ''}
            </p>
          )}
        </div>
        <div className="flex items-center gap-3">
          {custoTotal > 0 && (
            <span className="text-xs text-escuro-300">
              Custo: <span className="text-dourado-400 font-semibold">{formatarMoeda(custoTotal)}</span>
            </span>
          )}
          {analiseId && temMensagens && (
            <ExportarPDF mensagens={mensagens} analiseId={analiseId} />
          )}
        </div>
      </div>

      {/* Formulário de campos */}
      {mostrarFormulario && (
        <div className="px-6 py-5 border-b border-escuro-500 bg-escuro-600">
          <p className="text-sm font-medium text-dourado-300 mb-4">
            {perfil === 'ESPECIALISTA'
              ? 'Preencha os dados obrigatórios para iniciar a análise:'
              : 'Preencha os dados da análise (opcionais):'}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Cidade */}
            <div>
              <label className="label">
                Cidade {perfil === 'ESPECIALISTA' && <span className="text-red-400">*</span>}
              </label>
              {!showNovaCidade ? (
                <div className="flex gap-2">
                  <select
                    value={cidadeId}
                    onChange={e => {
                      if (e.target.value === '__nova__') {
                        setShowNovaCidade(true)
                        setCidadeId('')
                      } else {
                        setCidadeId(e.target.value)
                      }
                    }}
                    className="input-field flex-1"
                  >
                    <option value="">Selecione a cidade...</option>
                    {cidades.map(c => (
                      <option key={c.id} value={c.id}>{c.nome} - {c.estado}</option>
                    ))}
                    <option value="__nova__">+ Nova cidade</option>
                  </select>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={cidadeNova}
                    onChange={e => setCidadeNova(e.target.value)}
                    className="input-field flex-1"
                    placeholder="Ex: São Paulo - SP"
                  />
                  <button
                    onClick={() => setShowNovaCidade(false)}
                    className="btn-secondary px-3 py-2 text-sm"
                  >
                    ↩
                  </button>
                </div>
              )}
            </div>

            {/* Inscrição Imobiliária */}
            <div>
              <label className="label">
                Inscrição Imobiliária {perfil === 'ESPECIALISTA' && <span className="text-red-400">*</span>}
              </label>
              <input
                type="text"
                value={inscricaoImobiliaria}
                onChange={e => setInscricaoImobiliaria(e.target.value)}
                className="input-field"
                placeholder="Ex: 0000.00.0000.0000"
              />
            </div>

            {/* Margem de Lucro */}
            <div>
              <label className="label">Margem de Lucro (%)</label>
              <input
                type="number"
                value={margemAlvo}
                onChange={e => setMargemAlvo(Number(e.target.value))}
                className="input-field"
                min={0}
                max={100}
                step={0.5}
              />
            </div>

            {/* Análise Profunda */}
            <div className="flex items-end">
              <label className="flex items-center gap-3 cursor-pointer">
                <div
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${analiseProfunda ? 'bg-dourado-400' : 'bg-escuro-400'}`}
                  onClick={() => setAnaliseProfunda(!analiseProfunda)}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${analiseProfunda ? 'translate-x-6' : 'translate-x-1'}`}
                  />
                </div>
                <span className="text-sm text-white">Análise Profunda</span>
                <span className="text-xs text-escuro-300">(busca dados na internet)</span>
              </label>
            </div>
          </div>

          {/* Upload IPTU */}
          <div className="mt-4">
            <label className="label">
              Documentos {perfil === 'ESPECIALISTA' && <span className="text-red-400">* IPTU obrigatório</span>}
            </label>
            <UploadArquivos
              onArquivosChange={setArquivos}
              analiseId={analiseId ?? undefined}
              onUploadConcluido={setArquivosUpload}
            />
          </div>

          {erro && (
            <div className="mt-3 bg-red-900/30 border border-red-700 text-red-300 rounded-lg px-4 py-2.5 text-sm">
              {erro}
            </div>
          )}

          <button onClick={iniciarChat} className="btn-primary mt-4 px-6 py-2.5">
            Iniciar Análise
          </button>
        </div>
      )}

      {/* Área de chat */}
      <div ref={chatRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {!temMensagens && camposPreenchidos && (
          <div className="flex flex-col items-center justify-center h-full text-center py-16">
            <div className="w-16 h-16 rounded-2xl bg-dourado-400/10 border border-dourado-400/20 flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-dourado-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-white mb-2">Pronto para analisar</h2>
            <p className="text-escuro-200 text-sm max-w-md">
              Digite sua pergunta ou descreva o imóvel/terreno para começar a análise de viabilidade.
            </p>
          </div>
        )}

        {mensagens.map((msg, i) => (
          <div
            key={i}
            className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
          >
            <div
              className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold ${
                msg.role === 'user'
                  ? 'bg-dourado-400/20 text-dourado-400 border border-dourado-400/40'
                  : 'bg-escuro-400 text-escuro-100'
              }`}
            >
              {msg.role === 'user'
                ? (session.user?.name?.charAt(0).toUpperCase() ?? 'U')
                : 'IA'
              }
            </div>
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                msg.role === 'user'
                  ? 'bg-dourado-400/10 border border-dourado-400/20 text-white rounded-tr-sm'
                  : 'bg-escuro-500 border border-escuro-400 text-escuro-100 rounded-tl-sm'
              }`}
            >
              {msg.role === 'model' ? (
                <div className="markdown-content">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                </div>
              ) : (
                <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
              )}
            </div>
          </div>
        ))}

        {carregando && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold bg-escuro-400 text-escuro-100">
              IA
            </div>
            <div className="bg-escuro-500 border border-escuro-400 rounded-2xl rounded-tl-sm px-4 py-3">
              <div className="flex gap-1 items-center h-5">
                {[0, 1, 2].map(i => (
                  <span
                    key={i}
                    className="w-2 h-2 rounded-full bg-dourado-400 animate-bounce"
                    style={{ animationDelay: `${i * 0.15}s` }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Bloco de validação */}
        {mostrarValidacao && !validacaoEnviada && analiseId && (
          <div className="bg-escuro-500 border border-dourado-400/30 rounded-xl p-4 mx-4">
            <p className="text-sm text-white font-medium mb-3">
              Esta análise foi útil e os dados estão corretos?
            </p>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => validarAnalise(true)}
                className="flex items-center gap-2 bg-green-800/30 border border-green-600 hover:bg-green-700/40 text-green-300 rounded-lg px-4 py-2 text-sm transition-colors"
              >
                ✅ Sim, análise válida
              </button>
              <button
                onClick={() => setMostrarValidacao(false)}
                className="flex items-center gap-2 bg-red-800/30 border border-red-700 hover:bg-red-700/40 text-red-300 rounded-lg px-4 py-2 text-sm transition-colors"
              >
                ❌ Não, houve problemas
              </button>
            </div>
          </div>
        )}

        {!mostrarValidacao && !validacaoEnviada && analiseId && mensagens.length > 0 && (
          <div className="bg-escuro-500 border border-red-700/40 rounded-xl p-4 mx-4">
            <p className="text-sm text-red-300 mb-2">O que houve de errado?</p>
            <textarea
              value={motivoInvalidacao}
              onChange={e => setMotivoInvalidacao(e.target.value)}
              className="input-field min-h-[80px] resize-none mb-3"
              placeholder="Descreva o problema com a análise..."
            />
            <div className="flex gap-2">
              <button
                onClick={() => validarAnalise(false)}
                className="btn-danger text-sm px-4 py-2"
              >
                Registrar problema
              </button>
              <button
                onClick={() => { setMostrarValidacao(true); setMotivoInvalidacao('') }}
                className="btn-secondary text-sm px-4 py-2"
              >
                Voltar
              </button>
            </div>
          </div>
        )}

        {validacaoEnviada && (
          <div className="bg-green-900/20 border border-green-700 rounded-xl p-3 mx-4 text-center">
            <p className="text-sm text-green-300">Feedback registrado. Obrigado!</p>
          </div>
        )}
      </div>

      {/* Input de mensagem */}
      {camposPreenchidos && (
        <div className="border-t border-escuro-500 px-4 py-4 bg-escuro-700">
          {erro && (
            <div className="mb-3 bg-red-900/30 border border-red-700 text-red-300 rounded-lg px-4 py-2.5 text-sm">
              {erro}
            </div>
          )}
          <div className="flex gap-3 items-end">
            <textarea
              ref={textareaRef}
              value={mensagem}
              onChange={e => setMensagem(e.target.value)}
              onKeyDown={handleKeyDown}
              className="input-field flex-1 min-h-[52px] max-h-[200px] resize-none py-3"
              placeholder="Digite sua mensagem... (Enter para enviar, Shift+Enter para nova linha)"
              rows={1}
              disabled={carregando}
            />
            <button
              onClick={enviarMensagem}
              disabled={carregando || !mensagem.trim()}
              className="btn-primary h-[52px] w-[52px] flex items-center justify-center rounded-xl flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Enviar"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
