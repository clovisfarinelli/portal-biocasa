'use client'

import { useState } from 'react'

interface Mensagem {
  role: 'user' | 'model'
  content: string
}

interface Props {
  mensagens: Mensagem[]
  analiseId: string
}

export default function ExportarPDF({ mensagens, analiseId }: Props) {
  const [gerando, setGerando] = useState(false)

  async function exportarPDF() {
    setGerando(true)
    // Registra exportação para auditoria e alertas de segurança (fire-and-forget)
    fetch('/api/logs/exportacao', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ analiseId }),
    }).catch(() => {})

    try {
      // Gera HTML formatado e usa a API de impressão do browser
      const conteudo = mensagens
        .map(m => {
          const remetente = m.role === 'user' ? 'Você' : 'Biocasa IA'
          return `<div class="mensagem ${m.role}">
            <strong>${remetente}:</strong>
            <div class="conteudo">${m.content.replace(/\n/g, '<br>')}</div>
          </div>`
        })
        .join('')

      const html = `
        <!DOCTYPE html>
        <html lang="pt-BR">
        <head>
          <meta charset="UTF-8">
          <title>Análise Biocasa</title>
          <style>
            body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; color: #333; }
            h1 { color: #C9A84C; border-bottom: 2px solid #C9A84C; padding-bottom: 10px; }
            .mensagem { margin: 20px 0; padding: 15px; border-radius: 8px; }
            .user { background: #f5f5f5; border-left: 3px solid #C9A84C; }
            .model { background: #fff; border-left: 3px solid #1A1A2E; }
            strong { color: #1A1A2E; font-size: 14px; display: block; margin-bottom: 8px; }
            .conteudo { font-size: 13px; line-height: 1.6; }
            @media print { body { margin: 0; } }
          </style>
        </head>
        <body>
          <h1>Análise de Viabilidade Imobiliária</h1>
          <p style="color: #666; font-size: 12px;">ID: ${analiseId} • Gerado em: ${new Date().toLocaleString('pt-BR')}</p>
          ${conteudo}
        </body>
        </html>
      `

      const janela = window.open('', '_blank')
      if (janela) {
        janela.document.write(html)
        janela.document.close()
        janela.focus()
        setTimeout(() => {
          janela.print()
          janela.close()
        }, 500)
      }
    } finally {
      setGerando(false)
    }
  }

  return (
    <button
      onClick={exportarPDF}
      disabled={gerando}
      className="flex items-center gap-2 btn-secondary text-sm px-3 py-2"
      title="Exportar PDF"
    >
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
      {gerando ? 'Gerando...' : 'Exportar PDF'}
    </button>
  )
}
