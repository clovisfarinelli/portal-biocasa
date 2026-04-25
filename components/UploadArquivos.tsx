'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { TIPOS_ACEITOS, obterLimiteArquivo } from '@/lib/utils'

export interface ArquivoUpload {
  url: string
  nome: string
  tipo: string
}

const TIPOS_IPTU: Record<string, string[]> = {
  'application/pdf': ['.pdf'],
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/webp': ['.webp'],
}

interface Props {
  /** Rótulo exibido no topo da área de upload */
  label: string
  /** Se true: aceita apenas 1 arquivo e substitui ao dropar outro */
  modoSingle?: boolean
  /** Se true: restringe aos tipos aceitos para IPTU (PDF + imagens) */
  apenasIPTU?: boolean
  onArquivosChange: (arquivos: File[]) => void
  analiseId?: string
  onUploadConcluido: React.Dispatch<React.SetStateAction<ArquivoUpload[]>>
  maxArquivos?: number
}

interface ArquivoLocal {
  file: File
  progresso: number
  erro?: string
  url?: string
}

export default function UploadArquivos({
  label,
  modoSingle = false,
  apenasIPTU = false,
  onArquivosChange,
  analiseId,
  onUploadConcluido,
  maxArquivos = 10,
}: Props) {
  const [arquivos, setArquivos] = useState<ArquivoLocal[]>([])

  const limiteEfetivo = modoSingle ? 1 : maxArquivos
  const tiposEfetivos = apenasIPTU ? TIPOS_IPTU : TIPOS_ACEITOS

  const onDrop = useCallback(
    async (aceitos: File[]) => {
      if (aceitos.length === 0) return

      let base: ArquivoLocal[]
      if (modoSingle) {
        // Substitui o arquivo existente
        base = []
        onUploadConcluido([])
      } else {
        if (aceitos.length + arquivos.length > limiteEfetivo) {
          alert(`Máximo de ${limiteEfetivo} arquivos neste campo.`)
          return
        }
        base = arquivos
      }

      const novosArquivos: ArquivoLocal[] = aceitos.map(f => ({ file: f, progresso: 0 }))
      const todosArquivos = [...base, ...novosArquivos]
      setArquivos(todosArquivos)
      onArquivosChange(todosArquivos.map(a => a.file))

      for (const arqLocal of novosArquivos) {
        const limite = obterLimiteArquivo(arqLocal.file.type)
        if (arqLocal.file.size > limite) {
          const limMB = (limite / (1024 * 1024)).toFixed(0)
          setArquivos(prev =>
            prev.map(a =>
              a.file === arqLocal.file ? { ...a, erro: `Muito grande (máx ${limMB}MB)` } : a
            )
          )
          continue
        }
        uploadArquivo(arqLocal.file)
      }
    },
    [arquivos, analiseId, modoSingle, limiteEfetivo]
  )

  async function uploadArquivo(file: File) {
    const intervalo = setInterval(() => {
      setArquivos(prev =>
        prev.map(a =>
          a.file === file && a.progresso < 85 ? { ...a, progresso: a.progresso + 15 } : a
        )
      )
    }, 250)

    try {
      const formData = new FormData()
      formData.append('arquivo', file)
      if (analiseId) formData.append('analiseId', analiseId)

      const res = await fetch('/api/arquivos', { method: 'POST', body: formData })
      clearInterval(intervalo)

      if (res.ok) {
        const data = await res.json()
        const url: string = data.url ?? data.arquivoUrl ?? ''
        setArquivos(prev =>
          prev.map(a => (a.file === file ? { ...a, progresso: 100, url } : a))
        )
        onUploadConcluido(prev => [
          ...prev.filter(p => p.nome !== file.name),
          { url, nome: file.name, tipo: file.type },
        ])
      } else {
        let mensagemErro = 'Erro no upload'
        try {
          const err = await res.json()
          mensagemErro = err.erro ?? mensagemErro
        } catch {}
        setArquivos(prev =>
          prev.map(a => (a.file === file ? { ...a, erro: mensagemErro, progresso: 0 } : a))
        )
      }
    } catch {
      clearInterval(intervalo)
      setArquivos(prev =>
        prev.map(a =>
          a.file === file
            ? { ...a, erro: 'Falha ao enviar. Verifique sua conexão.', progresso: 0 }
            : a
        )
      )
    }
  }

  function removerArquivo(file: File) {
    const novos = arquivos.filter(a => a.file !== file)
    setArquivos(novos)
    onArquivosChange(novos.map(a => a.file))
    onUploadConcluido(prev => prev.filter(p => p.nome !== file.name))
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: tiposEfetivos,
    maxFiles: limiteEfetivo,
    multiple: !modoSingle,
  })

  function iconeArquivo(tipo: string) {
    if (tipo.startsWith('image/')) return '🖼️'
    if (tipo.startsWith('video/')) return '🎬'
    if (tipo === 'application/pdf') return '📄'
    if (tipo.includes('word')) return '📝'
    if (tipo.includes('spreadsheet') || tipo === 'text/csv') return '📊'
    if (tipo.includes('kml') || tipo.includes('kmz')) return '🗺️'
    return '📎'
  }

  const descricaoTipos = apenasIPTU
    ? 'PDF, JPG, PNG, WEBP'
    : 'PDF, DOCX, TXT, JPG, PNG, KML, MP4, XLSX, CSV'

  const temArquivoValido = arquivos.some(a => !a.erro && a.progresso === 100)

  return (
    <div className="space-y-2">
      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all
          ${isDragActive
            ? 'border-dourado-400 bg-dourado-400/10'
            : temArquivoValido
              ? 'border-green-600/50 bg-green-900/10'
              : 'border-escuro-400 hover:border-dourado-400/50 hover:bg-escuro-500/50'
          }
        `}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center gap-1.5">
          <svg
            className={`w-8 h-8 ${temArquivoValido ? 'text-green-500' : 'text-escuro-300'}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            {temArquivoValido ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            )}
          </svg>
          <p className="text-xs text-white font-medium">
            {isDragActive
              ? 'Solte aqui'
              : modoSingle
                ? 'Clique ou arraste o arquivo'
                : 'Clique ou arraste os arquivos'}
          </p>
          <p className="text-[11px] text-escuro-300">{descricaoTipos}</p>
        </div>
      </div>

      {arquivos.length > 0 && (
        <div className="space-y-1.5">
          {arquivos.map((arq, i) => (
            <div key={i} className="flex items-center gap-2 bg-escuro-500 rounded-lg px-3 py-1.5">
              <span className="text-base flex-shrink-0">{iconeArquivo(arq.file.type)}</span>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-white truncate">{arq.file.name}</p>
                {arq.erro ? (
                  <p className="text-xs text-red-400">{arq.erro}</p>
                ) : arq.progresso < 100 ? (
                  <div className="mt-0.5">
                    <div className="h-1 bg-escuro-400 rounded-full overflow-hidden">
                      <div
                        className="h-1 bg-dourado-400 rounded-full transition-all duration-300"
                        style={{ width: `${arq.progresso}%` }}
                      />
                    </div>
                  </div>
                ) : (
                  <p className="text-[11px] text-green-400">Enviado</p>
                )}
              </div>
              {arq.file.type.startsWith('image/') && arq.progresso === 100 && (
                <img
                  src={URL.createObjectURL(arq.file)}
                  alt={arq.file.name}
                  className="w-8 h-8 rounded object-cover flex-shrink-0"
                />
              )}
              <button
                onClick={() => removerArquivo(arq.file)}
                className="text-escuro-300 hover:text-red-400 transition-colors flex-shrink-0 p-0.5"
                title="Remover"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
