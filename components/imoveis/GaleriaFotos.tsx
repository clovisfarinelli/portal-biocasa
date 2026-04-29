'use client'

import { useState, useCallback, useRef } from 'react'
import { useDropzone } from 'react-dropzone'

interface FotoItem {
  url: string
  ordem: number
  principal: boolean
}

interface Props {
  imovelId: string
  fotosIniciais: FotoItem[]
  readOnly?: boolean
}

export default function GaleriaFotos({ imovelId, fotosIniciais, readOnly = false }: Props) {
  const [fotos, setFotos] = useState<FotoItem[]>(fotosIniciais)
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const dragIndexRef = useRef<number | null>(null)

  const onDrop = useCallback(async (arquivos: File[]) => {
    for (const arquivo of arquivos) {
      await uploadFoto(arquivo)
    }
  }, [imovelId])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpg', '.jpeg', '.png', '.webp', '.heic'] },
    maxSize: 20 * 1024 * 1024,
    disabled: readOnly || enviando,
  })

  async function uploadFoto(arquivo: File) {
    setEnviando(true)
    setErro(null)
    const fd = new FormData()
    fd.append('foto', arquivo)
    try {
      const res = await fetch(`/api/imoveis/${imovelId}/fotos`, { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) { setErro(data.erro ?? 'Erro no upload'); return }
      setFotos(data.fotos)
    } catch {
      setErro('Erro de conexão no upload')
    } finally {
      setEnviando(false)
    }
  }

  async function removerFoto(url: string) {
    if (!confirm('Remover esta foto?')) return
    setErro(null)
    try {
      const res = await fetch(`/api/imoveis/${imovelId}/fotos`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      })
      const data = await res.json()
      if (!res.ok) { setErro(data.erro ?? 'Erro ao remover'); return }
      setFotos(data.fotos)
    } catch {
      setErro('Erro de conexão ao remover')
    }
  }

  async function setPrincipal(url: string) {
    const novasFotos = fotos.map(f => ({ ...f, principal: f.url === url }))
    setFotos(novasFotos)
    try {
      await fetch(`/api/imoveis/${imovelId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fotos: JSON.stringify(novasFotos) }),
      })
    } catch {
      setErro('Erro ao salvar foto principal')
    }
  }

  function onDragStart(index: number) {
    dragIndexRef.current = index
  }

  function onDragOver(e: React.DragEvent, index: number) {
    e.preventDefault()
  }

  async function onDropFoto(e: React.DragEvent, targetIndex: number) {
    e.preventDefault()
    const fromIndex = dragIndexRef.current
    if (fromIndex === null || fromIndex === targetIndex) return

    const novasFotos = [...fotos]
    const [moved] = novasFotos.splice(fromIndex, 1)
    novasFotos.splice(targetIndex, 0, moved)
    const reordenadas = novasFotos.map((f, i) => ({ ...f, ordem: i }))
    setFotos(reordenadas)
    dragIndexRef.current = null

    try {
      await fetch(`/api/imoveis/${imovelId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fotos: JSON.stringify(reordenadas) }),
      })
    } catch {
      setErro('Erro ao salvar ordem das fotos')
    }
  }

  return (
    <div>
      {erro && (
        <div className="mb-3 px-4 py-2 bg-red-900/40 border border-red-700 rounded-lg text-red-300 text-sm">
          {erro}
        </div>
      )}

      {!readOnly && (
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors mb-4
            ${isDragActive ? 'border-dourado-400 bg-dourado-400/10' : 'border-escuro-400 hover:border-dourado-400/60'}
            ${enviando ? 'opacity-60 cursor-wait' : ''}
          `}
        >
          <input {...getInputProps()} />
          <svg className="w-8 h-8 text-escuro-300 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          {enviando ? (
            <p className="text-escuro-200 text-sm">Enviando...</p>
          ) : isDragActive ? (
            <p className="text-dourado-400 text-sm font-medium">Solte as fotos aqui</p>
          ) : (
            <>
              <p className="text-escuro-200 text-sm">Arraste fotos ou <span className="text-dourado-400">clique para selecionar</span></p>
              <p className="text-escuro-300 text-xs mt-1">JPG, PNG, WebP — máx 20MB por foto</p>
            </>
          )}
        </div>
      )}

      {fotos.length === 0 ? (
        <p className="text-escuro-300 text-sm italic text-center py-4">Nenhuma foto cadastrada</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {fotos.map((foto, index) => (
            <div
              key={foto.url}
              draggable={!readOnly}
              onDragStart={() => onDragStart(index)}
              onDragOver={(e) => onDragOver(e, index)}
              onDrop={(e) => onDropFoto(e, index)}
              className={`relative group rounded-xl overflow-hidden border-2 transition-colors
                ${foto.principal ? 'border-dourado-400' : 'border-escuro-400'}
                ${!readOnly ? 'cursor-grab active:cursor-grabbing' : ''}
              `}
            >
              <img
                src={foto.url}
                alt={`Foto ${index + 1}`}
                className="w-full aspect-square object-cover"
              />

              {foto.principal && (
                <span className="absolute top-1.5 left-1.5 bg-dourado-400 text-escuro-700 text-[10px] font-bold px-1.5 py-0.5 rounded">
                  PRINCIPAL
                </span>
              )}

              <div className="absolute top-1.5 right-1.5 text-[10px] font-bold text-white bg-black/50 rounded px-1">
                {index + 1}
              </div>

              {!readOnly && (
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1.5">
                  {!foto.principal && (
                    <button
                      onClick={() => setPrincipal(foto.url)}
                      className="text-[11px] bg-dourado-400 text-escuro-700 font-semibold px-2 py-1 rounded hover:bg-dourado-300 transition-colors"
                    >
                      Principal
                    </button>
                  )}
                  <button
                    onClick={() => removerFoto(foto.url)}
                    className="text-[11px] bg-red-700 text-white font-semibold px-2 py-1 rounded hover:bg-red-600 transition-colors"
                  >
                    Remover
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
