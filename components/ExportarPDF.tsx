'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'

interface Mensagem {
  role: 'user' | 'model'
  content: string
}

interface Props {
  mensagens: Mensagem[]
  analiseId: string
}

// Converte markdown básico para HTML (negrito, itálico, listas, cabeçalhos)
function markdownParaHtml(texto: string): string {
  return texto
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/^#{3}\s+(.+)$/gm, '<h3>$1</h3>')
    .replace(/^#{2}\s+(.+)$/gm, '<h2>$1</h2>')
    .replace(/^#{1}\s+(.+)$/gm, '<h1>$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    .replace(/(<li>.*<\/li>\n?)+/g, m => `<ul>${m}</ul>`)
    .replace(/\n{2,}/g, '</p><p>')
    .replace(/\n/g, '<br>')
    .replace(/^(?!<[hup])(.+)$/gm, '<p>$1</p>')
    .replace(/<p><\/p>/g, '')
}

export default function ExportarPDF({ mensagens, analiseId }: Props) {
  const [gerando, setGerando] = useState(false)
  const { data: session }     = useSession()

  async function exportarPDF() {
    setGerando(true)

    // Registra exportação para auditoria e alertas (fire-and-forget)
    fetch('/api/logs/exportacao', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ analiseId }),
    }).catch(() => {})

    try {
      const nomeUsuario = (session?.user as any)?.name ?? 'Usuário'
      const emailUsuario = session?.user?.email ?? ''
      const timestamp   = new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })

      const conteudo = mensagens
        .map(m => {
          const remetente = m.role === 'user' ? 'Você' : 'Biocasa IA'
          const classe    = m.role === 'user' ? 'user' : 'model'
          return `<div class="mensagem ${classe}">
            <strong>${remetente}:</strong>
            <div class="conteudo">${markdownParaHtml(m.content)}</div>
          </div>`
        })
        .join('')

      const rodapeTexto = `Confidencial · ${nomeUsuario} (${emailUsuario}) · ${timestamp} · ID: ${analiseId}`

      const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>Análise Biocasa — ${analiseId}</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; }

    body {
      font-family: Arial, sans-serif;
      max-width: 800px;
      margin: 0 auto;
      padding: 24px 32px 64px;
      color: #1a1a1a;
      font-size: 13px;
      line-height: 1.6;
    }

    /* ── marca d'água diagonal ── */
    .watermark {
      position: fixed;
      top: 0; left: 0;
      width: 100vw; height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      pointer-events: none;
      z-index: 9999;
      transform: rotate(-30deg);
      opacity: 0.055;
      white-space: nowrap;
      font-size: 32px;
      font-weight: 900;
      color: #000;
      letter-spacing: 3px;
      text-align: center;
    }

    /* ── rodapé fixo em toda página ── */
    .rodape {
      position: fixed;
      bottom: 0; left: 0; right: 0;
      padding: 6px 20px;
      border-top: 1px solid #e0e0e0;
      background: #fff;
      font-size: 9px;
      color: #888;
      text-align: center;
      letter-spacing: 0.3px;
    }

    /* ── cabeçalho do documento ── */
    .header {
      border-bottom: 2px solid #C9A84C;
      padding-bottom: 14px;
      margin-bottom: 20px;
    }
    .header h1 {
      margin: 0 0 4px;
      font-size: 20px;
      color: #C9A84C;
      letter-spacing: 1px;
    }
    .header-meta { font-size: 11px; color: #666; }

    /* ── mensagens ── */
    .mensagem { margin: 16px 0; padding: 14px 16px; border-radius: 6px; page-break-inside: avoid; }
    .user  { background: #f7f7f7; border-left: 3px solid #C9A84C; }
    .model { background: #fff;    border-left: 3px solid #1A1A2E; border: 1px solid #eee; }

    .mensagem > strong {
      display: block;
      margin-bottom: 8px;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #555;
    }

    .conteudo h1, .conteudo h2, .conteudo h3 { margin: 10px 0 4px; }
    .conteudo h2 { font-size: 15px; color: #1A1A2E; }
    .conteudo h3 { font-size: 13px; color: #333; }
    .conteudo ul { padding-left: 20px; margin: 6px 0; }
    .conteudo li { margin: 2px 0; }
    .conteudo p  { margin: 4px 0; }

    @media print {
      body { padding-bottom: 48px; }
      .watermark, .rodape { display: block !important; }
    }
  </style>
</head>
<body>

  <div class="watermark">BIOCASA</div>

  <div class="rodape">${rodapeTexto}</div>

  <div class="header">
    <h1>BIOCASA</h1>
    <div class="header-meta">
      Análise de Viabilidade Imobiliária &nbsp;·&nbsp;
      ID: ${analiseId} &nbsp;·&nbsp;
      Gerado em: ${timestamp} &nbsp;·&nbsp;
      Por: ${nomeUsuario}
    </div>
  </div>

  ${conteudo}

</body>
</html>`

      const janela = window.open('', '_blank')
      if (janela) {
        janela.document.write(html)
        janela.document.close()
        janela.focus()
        setTimeout(() => {
          janela.print()
          janela.close()
        }, 600)
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
