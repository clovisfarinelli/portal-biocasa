export function cn(...inputs: (string | boolean | null | undefined)[]) {
  return inputs.filter(Boolean).join(' ')
}

export function formatarMoeda(valor: number, moeda: 'BRL' | 'USD' = 'BRL') {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: moeda,
    minimumFractionDigits: 2,
  }).format(valor)
}

export function formatarData(data: Date | string) {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(data))
}

export function formatarNumero(n: number) {
  return new Intl.NumberFormat('pt-BR').format(n)
}

// Limites de upload em bytes
export const LIMITES_UPLOAD = {
  pdf:    10 * 1024 * 1024,  // 10MB
  docx:   10 * 1024 * 1024,
  txt:    10 * 1024 * 1024,
  imagem: 10 * 1024 * 1024,
  kml:     5 * 1024 * 1024,  // 5MB
  kmz:     5 * 1024 * 1024,
  video: 100 * 1024 * 1024, // 100MB
  xlsx:   10 * 1024 * 1024,
  csv:    10 * 1024 * 1024,
}

export const TIPOS_ACEITOS: Record<string, string[]> = {
  'application/pdf': ['.pdf'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
  'text/plain': ['.txt'],
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/webp': ['.webp'],
  'application/vnd.google-earth.kml+xml': ['.kml'],
  'application/vnd.google-earth.kmz': ['.kmz'],
  'video/mp4': ['.mp4'],
  'video/quicktime': ['.mov'],
  'video/x-msvideo': ['.avi'],
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
  'text/csv': ['.csv'],
}

export function obterLimiteArquivo(tipo: string): number {
  if (tipo.startsWith('video/')) return LIMITES_UPLOAD.video
  if (tipo.startsWith('image/')) return LIMITES_UPLOAD.imagem
  if (tipo.includes('kml') || tipo.includes('kmz')) return LIMITES_UPLOAD.kml
  return LIMITES_UPLOAD.pdf
}

const SUFIXO_PARCERIA = '\n\nImóvel em Parceria Imobiliária'

export function parsearOutrosArray(valor: string | null | undefined): string[] {
  if (!valor) return []
  try {
    const parsed = JSON.parse(valor)
    if (Array.isArray(parsed)) return parsed.filter(Boolean)
    if (typeof parsed === 'string' && parsed.trim()) return [parsed.trim()]
    return []
  } catch {
    if (valor.trim()) return [valor.trim()]
    return []
  }
}

export function parsearOutros(valor: string | null | undefined): string {
  if (!valor) return '—'
  try {
    const parsed = JSON.parse(valor)
    if (Array.isArray(parsed)) return parsed.join(', ')
    return valor
  } catch {
    return valor
  }
}

export function aplicarSufixoParceria(texto: string, parceria: boolean): string {
  if (!parceria) return texto
  if (texto.trimEnd().endsWith(SUFIXO_PARCERIA.trim())) return texto
  return texto.trimEnd() + SUFIXO_PARCERIA
}
