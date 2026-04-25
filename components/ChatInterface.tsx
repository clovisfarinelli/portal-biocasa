'use client'

import { useState, useEffect, useRef, Fragment } from 'react'
import { useSearchParams } from 'next/navigation'
import { Session } from 'next-auth'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import UploadArquivos, { ArquivoUpload } from './UploadArquivos'
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
  const ehEspecialista = perfil === 'ESPECIALISTA'

  // Campos do formulário (visíveis para TODOS os perfis)
  const [cidadeId, setCidadeId] = useState('')
  const [cidadeNova, setCidadeNova] = useState('')
  const [showNovaCidade, setShowNovaCidade] = useState(false)
  const [inscricaoImobiliaria, setInscricaoImobiliaria] = useState('')
  const [margemAlvo, setMargemAlvo] = useState(20)
  const [analiseProfunda, setAnaliseProfunda] = useState(false)
  const [formAberto, setFormAberto] = useState(true)

  // Upload IPTU separado
  const [iptuArquivos, setIptuArquivos] = useState<File[]>([])
  const [iptuUpload, setIptuUpload] = useState<ArquivoUpload[]>([])

  // Upload Outros Documentos
  const [outrosArquivos, setOutrosArquivos] = useState<File[]>([])
  const [outrosUpload, setOutrosUpload] = useState<ArquivoUpload[]>([])

  // Estado da análise
  const [analiseId, setAnaliseId] = useState<string | null>(analiseIdParam)
  const [mensagens, setMensagens] = useState<Mensagem[]>([])
  const [mensagem, setMensagem] = useState('')
  const [carregando, setCarregando] = useState(false)
  const [custoTotal, setCustoTotal] = useState(0)
  const [erroChat, setErroChat] = useState('')

  // Validação
  const [mostrarValidacao, setMostrarValidacao] = useState(false)
  const [motivoInvalidacao, setMotivoInvalidacao] = useState('')
  const [validacaoEnviada, setValidacaoEnviada] = useState(false)
  const [tentouEnviar, setTentouEnviar] = useState(false)

  // Dados insuficientes
  const [mostrarBotoesInsuficiente, setMostrarBotoesInsuficiente] = useState(false)
  const [highlightUpload, setHighlightUpload] = useState(false)

  // Cidades
  const [cidades, setCidades] = useState<Cidade[]>([])

  const chatRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const uploadOutroRef = useRef<HTMLDivElement>(null)

  // ─── Validação ────────────────────────────────────────────────────────────
  const cidadeOk = cidadeId !== '' || (showNovaCidade && cidadeNova.trim() !== '')

  const podeSendMensagem = (() => {
    if (!cidadeOk) return false
    if (ehEspecialista) {
      return inscricaoImobiliaria.trim() !== '' && iptuArquivos.length > 0
    }
    return true
  })()

  const mensagemBloqueio = (() => {
    if (!cidadeOk) return 'Selecione uma cidade para continuar'
    if (ehEspecialista && !inscricaoImobiliaria.trim()) return 'Informe a inscrição imobiliária'
    if (ehEspecialista && iptuArquivos.length === 0) return 'Faça o upload do IPTU para continuar'
    return ''
  })()

  // ─── Effects ──────────────────────────────────────────────────────────────
  useEffect(() => {
    carregarCidades()
    if (analiseIdParam) carregarAnalise(analiseIdParam)
  }, [analiseIdParam])

  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight
    }
  }, [mensagens, carregando])

  // Fecha o formulário ao iniciar a primeira conversa
  useEffect(() => {
    if (mensagens.length > 0 && formAberto) {
      setFormAberto(false)
    }
  }, [mensagens.length])

  // ─── Funções ──────────────────────────────────────────────────────────────
  async function carregarCidades() {
    const res = await fetch('/api/cidades')
    if (res.ok) setCidades(await res.json())
  }

  async function carregarAnalise(id: string) {
    const res = await fetch(`/api/analises/${id}`)
    if (!res.ok) return
    const data: Analise = await res.json()
    setAnaliseId(data.id)
    setMensagens(data.conteudoConversa as Mensagem[])
    setCidadeId(data.cidadeId ?? '')
    setInscricaoImobiliaria(data.inscricaoImobiliaria ?? '')
    setMargemAlvo(data.margemAlvo ?? 20)
    setCustoTotal(data.custoBrl ?? 0)
    setFormAberto(false)
    if (data.statusValidacao !== 'PENDENTE') setValidacaoEnviada(true)
  }

  async function criarCidadeSeNecessario(): Promise<string | null> {
    if (cidadeId) return cidadeId
    if (!cidadeNova.trim()) return null
    const partes = cidadeNova.trim().split('-')
    const nome = partes[0].trim()
    const estado = partes[1]?.trim().toUpperCase() ?? 'SP'
    const res = await fetch('/api/cidades', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nome, estado }),
    })
    if (!res.ok) return null
    const nova: Cidade = await res.json()
    setCidades(prev => [...prev, nova])
    setCidadeId(nova.id)
    setShowNovaCidade(false)
    setCidadeNova('')
    return nova.id
  }

  async function enviarMensagem(textoOverride?: string, profundaOverride?: boolean) {
    const texto = (textoOverride ?? mensagem).trim()
    if (!texto || carregando) return

    if (!textoOverride) {
      setTentouEnviar(true)
      if (!podeSendMensagem) return
    }

    const profundaUsada = profundaOverride ?? analiseProfunda
    const cidadeIdFinal = await criarCidadeSeNecessario()
    if (!textoOverride) setMensagem('')
    setErroChat('')
    setMostrarBotoesInsuficiente(false)
    setCarregando(true)

    const mensagensBase = mensagens
    const novasMensagens: Mensagem[] = [...mensagensBase, { role: 'user', content: texto }]
    setMensagens(novasMensagens)

    try {
      const res = await fetch('/api/analises', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mensagem: texto,
          cidadeId: cidadeIdFinal ?? undefined,
          inscricaoImobiliaria: inscricaoImobiliaria || undefined,
          margemAlvo,
          analiseProfunda: profundaUsada,
          analiseId: analiseId ?? undefined,
          historico: mensagensBase,
          arquivos: [...iptuUpload, ...outrosUpload],
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        setErroChat(data.erro ?? 'Erro ao processar análise')
        setMensagens(mensagensBase)
        return
      }

      setAnaliseId(data.analiseId)
      setCustoTotal(prev => prev + (data.custoBrl ?? 0))

      // Detect insufficient-data marker; strip it before display
      const respostaRaw: string = data.resposta ?? ''
      const temSolicitacao = respostaRaw.includes('[SOLICITAR_DOCS]')
      const respostaLimpa = respostaRaw.replace(/\[SOLICITAR_DOCS\]\s*$/m, '').trim()

      setMensagens([...novasMensagens, { role: 'model', content: respostaLimpa }])
      setMostrarBotoesInsuficiente(temSolicitacao)

      if (mensagensBase.length === 0) {
        setTimeout(() => setMostrarValidacao(true), 800)
      }
    } catch {
      setErroChat('Erro de conexão. Tente novamente.')
      setMensagens(mensagensBase)
    } finally {
      setCarregando(false)
    }
  }

  async function autorizarAnaliseProfunda() {
    setAnaliseProfunda(true)
    await enviarMensagem(
      'Análise Profunda autorizada. Por favor, busque na internet os dados necessários e prossiga com a análise completa.',
      true
    )
  }

  function abrirEnviarDocumentos() {
    setFormAberto(true)
    setTimeout(() => {
      uploadOutroRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      setHighlightUpload(true)
      setTimeout(() => setHighlightUpload(false), 2500)
    }, 150)
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
      enviarMensagem()
    }
  }

  const nomeCidade = cidades.find(c => c.id === cidadeId)?.nome

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-full">

      {/* ── Header ── */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-escuro-500 bg-escuro-700 flex-shrink-0">
        <div>
          <h1 className="text-base font-semibold text-white">Análise de Viabilidade</h1>
          {nomeCidade && (
            <p className="text-xs text-escuro-300">
              {nomeCidade}{inscricaoImobiliaria ? ` · ${inscricaoImobiliaria}` : ''}
            </p>
          )}
        </div>
        <div className="flex items-center gap-3">
          {custoTotal > 0 && (
            <span className="text-xs text-escuro-300">
              Custo: <span className="text-dourado-400 font-semibold">{formatarMoeda(custoTotal)}</span>
            </span>
          )}
          {analiseId && mensagens.length > 0 && (
            <ExportarPDF mensagens={mensagens} analiseId={analiseId} />
          )}
        </div>
      </div>

      {/* ── Formulário (todos os perfis, collapsível após iniciar chat) ── */}
      <div className="flex-shrink-0 border-b border-escuro-500 bg-escuro-600">
        {/* Cabeçalho do formulário com toggle */}
        <button
          onClick={() => setFormAberto(v => !v)}
          className="w-full flex items-center justify-between px-6 py-2.5 hover:bg-escuro-500/40 transition-colors"
        >
          <span className="text-xs font-semibold text-escuro-200 uppercase tracking-wider">
            Dados da Análise
            {!formAberto && nomeCidade && (
              <span className="ml-2 text-dourado-300 normal-case font-normal">
                — {nomeCidade}{inscricaoImobiliaria ? ` · ${inscricaoImobiliaria}` : ''}
              </span>
            )}
          </span>
          <svg
            className={`w-4 h-4 text-escuro-300 transition-transform ${formAberto ? '' : 'rotate-180'}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
          </svg>
        </button>

        {formAberto && (
          <div className="px-6 pb-5 pt-1">
            {/* Linha 1: Cidade + Inscrição */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              {/* Cidade */}
              <div>
                <label className="label">
                  Cidade <span className="text-red-400">*</span>
                </label>
                {!showNovaCidade ? (
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
                    className={`input-field ${tentouEnviar && !cidadeOk ? 'border-red-500' : ''}`}
                  >
                    <option value="">Selecione a cidade...</option>
                    {cidades.map(c => (
                      <option key={c.id} value={c.id}>{c.nome} — {c.estado}</option>
                    ))}
                    <option value="__nova__">+ Nova cidade</option>
                  </select>
                ) : (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={cidadeNova}
                      onChange={e => setCidadeNova(e.target.value)}
                      className={`input-field flex-1 ${tentouEnviar && !cidadeOk ? 'border-red-500' : ''}`}
                      placeholder="Ex: São Paulo - SP"
                    />
                    <button
                      onClick={() => { setShowNovaCidade(false); setCidadeNova('') }}
                      className="btn-secondary px-3"
                      title="Cancelar nova cidade"
                    >↩</button>
                  </div>
                )}
                {tentouEnviar && !cidadeOk && (
                  <p className="text-xs text-red-400 mt-1">Cidade obrigatória</p>
                )}
              </div>

              {/* Inscrição Imobiliária */}
              <div>
                <label className="label">
                  Inscrição Imobiliária
                  {ehEspecialista && <span className="text-red-400"> *</span>}
                </label>
                <input
                  type="text"
                  value={inscricaoImobiliaria}
                  onChange={e => setInscricaoImobiliaria(e.target.value)}
                  className={`input-field ${tentouEnviar && ehEspecialista && !inscricaoImobiliaria.trim() ? 'border-red-500' : ''}`}
                  placeholder="Ex: 0000.00.0000.0000"
                />
                {tentouEnviar && ehEspecialista && !inscricaoImobiliaria.trim() && (
                  <p className="text-xs text-red-400 mt-1">Campo obrigatório</p>
                )}
              </div>
            </div>

            {/* Linha 2: Margem + Toggle */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="label">Margem de Lucro (%)</label>
                <input
                  type="number"
                  value={margemAlvo}
                  onChange={e => setMargemAlvo(Number(e.target.value))}
                  className="input-field"
                  min={0} max={100} step={0.5}
                />
              </div>

              <div className="flex items-end pb-1">
                <label className="flex items-center gap-3 cursor-pointer select-none">
                  <div
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${analiseProfunda ? 'bg-dourado-400' : 'bg-escuro-400'}`}
                    onClick={() => setAnaliseProfunda(v => !v)}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${analiseProfunda ? 'translate-x-6' : 'translate-x-1'}`} />
                  </div>
                  <div>
                    <span className="text-sm text-white">Análise Profunda</span>
                    <p className="text-xs text-escuro-300">busca dados na internet</p>
                  </div>
                </label>
              </div>
            </div>

            {/* Linha 3: Dois campos de upload lado a lado */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* IPTU */}
              <div>
                <label className="label">
                  IPTU
                  {ehEspecialista && <span className="text-red-400"> *</span>}
                  <span className="text-escuro-300 font-normal ml-1">(PDF ou imagem)</span>
                </label>
                <UploadArquivos
                  label="IPTU"
                  modoSingle
                  apenasIPTU
                  onArquivosChange={setIptuArquivos}
                  analiseId={analiseId ?? undefined}
                  onUploadConcluido={setIptuUpload}
                />
                {tentouEnviar && ehEspecialista && iptuArquivos.length === 0 && (
                  <p className="text-xs text-red-400 mt-1">Upload do IPTU obrigatório</p>
                )}
              </div>

              {/* Outros Documentos */}
              <div ref={uploadOutroRef} className={`rounded-xl transition-all duration-300 ${highlightUpload ? 'ring-2 ring-dourado-400 ring-offset-2 ring-offset-escuro-600' : ''}`}>
                <label className="label">
                  Outros Documentos
                  <span className="text-escuro-300 font-normal ml-1">(opcional)</span>
                </label>
                <UploadArquivos
                  label="Outros Documentos"
                  maxArquivos={9}
                  onArquivosChange={setOutrosArquivos}
                  analiseId={analiseId ?? undefined}
                  onUploadConcluido={setOutrosUpload}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Área de chat ── */}
      <div ref={chatRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-4 min-h-0">
        {mensagens.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center py-12">
            <div className="w-14 h-14 rounded-2xl bg-dourado-400/10 border border-dourado-400/20 flex items-center justify-center mb-4">
              <svg className="w-7 h-7 text-dourado-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-white mb-1">Pronto para analisar</h2>
            <p className="text-escuro-200 text-sm max-w-sm">
              {podeSendMensagem
                ? 'Digite sua pergunta ou descreva o imóvel/terreno.'
                : mensagemBloqueio}
            </p>
          </div>
        )}

        {mensagens.map((msg, i) => {
          const isLastModel = msg.role === 'model' && i === mensagens.length - 1
          return (
            <Fragment key={i}>
              <div className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold ${
                  msg.role === 'user'
                    ? 'bg-dourado-400/20 text-dourado-400 border border-dourado-400/40'
                    : 'bg-escuro-400 text-escuro-100'
                }`}>
                  {msg.role === 'user' ? (session.user?.name?.charAt(0).toUpperCase() ?? 'U') : 'IA'}
                </div>
                <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                  msg.role === 'user'
                    ? 'bg-dourado-400/10 border border-dourado-400/20 text-white rounded-tr-sm'
                    : 'bg-escuro-500 border border-escuro-400 text-escuro-100 rounded-tl-sm'
                }`}>
                  {msg.role === 'model' ? (
                    <div className="markdown-content">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                    </div>
                  ) : (
                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                  )}
                </div>
              </div>

              {/* Action buttons when AI signals insufficient data */}
              {isLastModel && mostrarBotoesInsuficiente && (
                <div className="ml-11 flex flex-wrap gap-2">
                  <button
                    onClick={autorizarAnaliseProfunda}
                    disabled={carregando}
                    className="flex items-center gap-2 bg-dourado-400/15 border border-dourado-400/50 hover:bg-dourado-400/25 text-dourado-300 rounded-lg px-3 py-2 text-xs font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    Autorizar Análise Profunda
                  </button>
                  <button
                    onClick={abrirEnviarDocumentos}
                    disabled={carregando}
                    className="flex items-center gap-2 bg-escuro-500 border border-escuro-400 hover:bg-escuro-400 text-escuro-100 rounded-lg px-3 py-2 text-xs font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    Enviar Documentos
                  </button>
                </div>
              )}
            </Fragment>
          )
        })}

        {carregando && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold bg-escuro-400 text-escuro-100">IA</div>
            <div className="bg-escuro-500 border border-escuro-400 rounded-2xl rounded-tl-sm px-4 py-3">
              <div className="flex gap-1 items-center h-5">
                {[0, 1, 2].map(i => (
                  <span key={i} className="w-2 h-2 rounded-full bg-dourado-400 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Validação */}
        {mostrarValidacao && !validacaoEnviada && analiseId && (
          <div className="bg-escuro-500 border border-dourado-400/30 rounded-xl p-4">
            <p className="text-sm text-white font-medium mb-3">Esta análise foi útil e os dados estão corretos?</p>
            <div className="flex gap-2 flex-wrap">
              <button onClick={() => validarAnalise(true)} className="flex items-center gap-2 bg-green-800/30 border border-green-600 hover:bg-green-700/40 text-green-300 rounded-lg px-4 py-2 text-sm transition-colors">
                ✅ Sim, análise válida
              </button>
              <button onClick={() => setMostrarValidacao(false)} className="flex items-center gap-2 bg-red-800/30 border border-red-700 hover:bg-red-700/40 text-red-300 rounded-lg px-4 py-2 text-sm transition-colors">
                ❌ Não, houve problemas
              </button>
            </div>
          </div>
        )}

        {!mostrarValidacao && !validacaoEnviada && analiseId && mensagens.length > 0 && (
          <div className="bg-escuro-500 border border-red-700/40 rounded-xl p-4">
            <p className="text-sm text-red-300 mb-2">O que houve de errado?</p>
            <textarea
              value={motivoInvalidacao}
              onChange={e => setMotivoInvalidacao(e.target.value)}
              className="input-field min-h-[80px] resize-none mb-3"
              placeholder="Descreva o problema com a análise..."
            />
            <div className="flex gap-2">
              <button onClick={() => validarAnalise(false)} className="btn-danger text-sm px-4 py-2">Registrar problema</button>
              <button onClick={() => { setMostrarValidacao(true); setMotivoInvalidacao('') }} className="btn-secondary text-sm px-4 py-2">Voltar</button>
            </div>
          </div>
        )}

        {validacaoEnviada && (
          <div className="bg-green-900/20 border border-green-700 rounded-xl p-3 text-center">
            <p className="text-sm text-green-300">Feedback registrado. Obrigado!</p>
          </div>
        )}
      </div>

      {/* ── Input de mensagem ── */}
      <div className="border-t border-escuro-500 px-4 py-3 bg-escuro-700 flex-shrink-0">
        {erroChat && (
          <div className="mb-2 bg-red-900/30 border border-red-700 text-red-300 rounded-lg px-4 py-2 text-sm">
            {erroChat}
          </div>
        )}

        {/* Aviso de bloqueio (apenas quando tentou enviar) */}
        {tentouEnviar && !podeSendMensagem && (
          <div className="mb-2 bg-amber-900/30 border border-amber-700 text-amber-300 rounded-lg px-4 py-2 text-sm flex items-center gap-2">
            <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.999L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16.001c-.77 1.332.192 2.999 1.732 2.999z" />
            </svg>
            {mensagemBloqueio} — expanda os "Dados da Análise" acima para preencher.
          </div>
        )}

        <div className="flex gap-3 items-end">
          <textarea
            ref={textareaRef}
            value={mensagem}
            onChange={e => setMensagem(e.target.value)}
            onKeyDown={handleKeyDown}
            className="input-field flex-1 min-h-[48px] max-h-[160px] resize-none py-3"
            placeholder={podeSendMensagem ? 'Digite sua mensagem...' : mensagemBloqueio}
            rows={1}
            disabled={carregando}
          />
          <button
            onClick={() => enviarMensagem()}
            disabled={carregando || !mensagem.trim()}
            className="btn-primary h-[48px] w-[48px] flex items-center justify-center rounded-xl flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
            title={podeSendMensagem ? 'Enviar' : mensagemBloqueio}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}
