'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { TIPOS_ACEITOS, obterLimiteArquivo } from '@/lib/utils'

interface ArquivoUpload {
  url: string
  nome: string
  tipo: string
}

interface Props {
  onArquivosChange: (arquivos: File[]) => void
  analiseId?: string
  onUploadConcluido: (arquivos: ArquivoUpload[]) => void
  maxArquivos?: number
}

interface ArquivoLocal {
  file: File
  progresso: number
  erro?: string
  url?: string
}

export default function UploadArquivos({ onArquivosChange, analiseId, onUploadConcluido, maxArquivos = 10 }: Props) {
  const [arquivos, setArquivos] = useState<ArquivoLocal[]>([])

  const onDrop = useCallback(async (aceitos: File[], rejeitados: any[]) => {
    if (aceitos.length + arquivos.length > maxArquivos) {
      alert(`Máximo de ${maxArquivos} arquivos por análise.`)
      return
    }

    const novosArquivos: ArquivoLocal[] = aceitos.map(f => ({ file: f, progresso: 0 }))
    const todosArquivos = [...arquivos, ...novosArquivos]
    setArquivos(todosArquivos)
    onArquivosChange(todosArquivos.map(a => a.file))

    // Inicia uploads se há analiseId
    for (const arqLocal of novosArquivos) {
      const limite = obterLimiteArquivo(arqLocal.file.type)
      if (arqLocal.file.size > limite) {
        const limMB = (limite / (1024 * 1024)).toFixed(0)
        setArquivos(prev => prev.map(a =>
          a.file === arqLocal.file
            ? { ...a, erro: `Arquivo muito grande (máx ${limMB}MB)` }
            : a
        ))
        continue
      }

      // Simula progresso e faz upload
      uploadArquivo(arqLocal.file)
    }
  }, [arquivos, analiseId, maxArquivos])

  async function uploadArquivo(file: File) {
    // Simula progresso de upload
    const intervalo = setInterval(() => {
      setArquivos(prev => prev.map(a =>
        a.file === file && a.progresso < 90
          ? { ...a, progresso: a.progresso + 10 }
          : a
      ))
    }, 200)

    try {
      const formData = new FormData()
      formData.append('arquivo', file)
      if (analiseId) formData.append('analiseId', analiseId)

      const res = await fetch('/api/arquivos', { method: 'POST', body: formData })
      clearInterval(intervalo)

      if (res.ok) {
        const data = await res.json()
        setArquivos(prev => prev.map(a =>
          a.file === file ? { ...a, progresso: 100, url: data.url ?? data.arquivoUrl } : a
        ))
        onUploadConcluido(prev => [...prev, { url: data.url ?? data.arquivoUrl, nome: file.name, tipo: file.type }])
      } else {
        const err = await res.json()
        setArquivos(prev => prev.map(a =>
          a.file === file ? { ...a, erro: err.erro ?? 'Erro no upload', progresso: 0 } : a
        ))
      }
    } catch {
      clearInterval(intervalo)
      setArquivos(prev => prev.map(a =>
        a.file === file ? { ...a, erro: 'Falha na conexão', progresso: 0 } : a
      ))
    }
  }

  function removerArquivo(file: File) {
    const novos = arquivos.filter(a => a.file !== file)
    setArquivos(novos)
    onArquivosChange(novos.map(a => a.file))
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: TIPOS_ACEITOS,
    maxFiles: maxArquivos,
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

  return (
    <div className="space-y-3">
      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all
          ${isDragActive
            ? 'border-dourado-400 bg-dourado-400/10'
            : 'border-escuro-400 hover:border-dourado-400/50 hover:bg-escuro-500/50'
          }
        `}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center gap-2">
          <svg className="w-10 h-10 text-escuro-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          <div>
            <p className="text-sm text-white font-medium">
              {isDragActive ? 'Solte os arquivos aqui' : 'Arraste arquivos ou clique para selecionar'}
            </p>
            <p className="text-xs text-escuro-300 mt-1">
              PDF, DOCX, TXT, JPG, PNG, WEBP, KML, MP4, XLSX, CSV (máx {maxArquivos} arquivos)
            </p>
          </div>
        </div>
      </div>

      {arquivos.length > 0 && (
        <div className="space-y-2">
          {arquivos.map((arq, i) => (
            <div key={i} className="flex items-center gap-3 bg-escuro-500 rounded-lg px-3 py-2">
              <span className="text-lg flex-shrink-0">{iconeArquivo(arq.file.type)}</span>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-white truncate">{arq.file.name}</p>
                {arq.erro ? (
                  <p className="text-xs text-red-400">{arq.erro}</p>
                ) : arq.progresso < 100 ? (
                  <div className="mt-1">
                    <div className="h-1 bg-escuro-400 rounded-full overflow-hidden">
                      <div
                        className="h-1 bg-dourado-400 rounded-full transition-all"
                        style={{ width: `${arq.progresso}%` }}
                      />
                    </div>
                    <p className="text-[10px] text-escuro-300 mt-0.5">{arq.progresso}% enviado</p>
                  </div>
                ) : (
                  <p className="text-xs text-green-400">Enviado com sucesso</p>
                )}
              </div>
              {/* Preview de imagem */}
              {arq.file.type.startsWith('image/') && arq.url && (
                <img src={arq.url} alt={arq.file.name} className="w-10 h-10 rounded object-cover flex-shrink-0" />
              )}
              <button
                onClick={() => removerArquivo(arq.file)}
                className="text-escuro-300 hover:text-red-400 transition-colors flex-shrink-0"
                title="Remover"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
